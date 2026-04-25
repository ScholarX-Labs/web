import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { and, eq, gte, like, sql } from "drizzle-orm";
import * as schema from "@/db/schema/auth-schema";
import { admin, bearer, emailOTP, phoneNumber } from "better-auth/plugins";
import { parsePhoneNumberWithError } from "libphonenumber-js";
import { z } from "zod";
import { sendEmail } from "./email";
import { randomUUID } from "node:crypto";

const EMAIL_OTP_RATE_LIMIT_IDENTIFIER = "email-otp-rate-limit";
const EMAIL_OTP_HOURLY_LIMIT = 4;
const EMAIL_OTP_DAILY_LIMIT = 10;
const ONE_HOUR_IN_MS = 60 * 60 * 1000;
const ONE_DAY_IN_MS = 24 * ONE_HOUR_IN_MS;
const EMAIL_OTP_EXPIRY_IN_SECONDS = 10 * 60;

function normalizeEmailAddress(email: string): string {
  return email.trim().toLowerCase();
}

function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

async function assertEmailOtpSendLimit(email: string): Promise<void> {
  const now = Date.now();
  const normalizedEmail = normalizeEmailAddress(email);

  await db.transaction(async (tx) => {
    const hourlyCount = await countOtpSendsSince(
      normalizedEmail,
      new Date(now - ONE_HOUR_IN_MS),
      tx,
    );
    const dailyCount = await countOtpSendsSince(
      normalizedEmail,
      new Date(now - ONE_DAY_IN_MS),
      tx,
    );

    if (hourlyCount >= EMAIL_OTP_HOURLY_LIMIT) {
      throw new APIError("TOO_MANY_REQUESTS", {
        message: "ERR_EMAIL_OTP_RATE_LIMIT_HOURLY",
      });
    }

    if (dailyCount >= EMAIL_OTP_DAILY_LIMIT) {
      throw new APIError("TOO_MANY_REQUESTS", {
        message: "ERR_EMAIL_OTP_RATE_LIMIT_DAILY",
      });
    }

    // record intent to send (provisional) to prevent race conditions
    await recordEmailOtpSend(normalizedEmail, tx);
  });
}

async function countOtpSendsSince(
  email: string,
  since: Date,
  tx: any = db,
): Promise<number> {
  const escapedEmail = escapeLikePattern(email);
  const identifierPrefix = `${EMAIL_OTP_RATE_LIMIT_IDENTIFIER}:${escapedEmail}:%`;
  const [result] = await tx
    .select({ count: sql<number>`count(*)` })
    .from(schema.verification)
    .where(
      and(
        like(schema.verification.identifier, identifierPrefix),
        gte(schema.verification.createdAt, since),
      ),
    );

  return Number(result?.count ?? 0);
}

async function recordEmailOtpSend(email: string, tx: any = db): Promise<void> {
  const normalizedEmail = normalizeEmailAddress(email);
  const uniqueId = randomUUID();

  await tx.insert(schema.verification).values({
    id: randomUUID(),
    identifier: `${EMAIL_OTP_RATE_LIMIT_IDENTIFIER}:${normalizedEmail}:${Date.now()}:${uniqueId}`,
    value: "sent",
    expiresAt: new Date(Date.now() + ONE_DAY_IN_MS + ONE_HOUR_IN_MS),
  });
}

function getOtpEmailContent(
  type: string,
  otp: string,
): {
  subject: string;
  text: string;
} {
  switch (type) {
    case "email-verification":
      return {
        subject: "Your ScholarX email verification code",
        text: `Your ScholarX verification code is ${otp}. It expires in 10 minutes.`,
      };
    case "sign-in":
      return {
        subject: "Your ScholarX sign-in code",
        text: `Your ScholarX sign-in code is ${otp}. It expires in 10 minutes.`,
      };
    case "forget-password":
      return {
        subject: "Your ScholarX password reset code",
        text: `Your ScholarX password reset code is ${otp}. It expires in 10 minutes.`,
      };
    case "change-email":
      return {
        subject: "Your ScholarX email change code",
        text: `Your ScholarX email change code is ${otp}. It expires in 10 minutes.`,
      };
    default:
      return {
        subject: "Your ScholarX verification code",
        text: `Your ScholarX verification code is ${otp}. It expires in 10 minutes.`,
      };
  }
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    async afterEmailVerification() {
      // Actions after user verified email
    },
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendOnSignIn: false,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/email-otp/send-verification-otp") {
        const requestEmail =
          typeof ctx.body?.email === "string" ? ctx.body.email : "";

        if (requestEmail) {
          await assertEmailOtpSendLimit(requestEmail);
        }

        return;
      }

      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const hasEmailInput = ctx.body?.email !== undefined;
      const hasPhoneInput = ctx.body?.phoneNumber !== undefined;
      const originalEmail = ctx.body?.email;
      const originalPhone = ctx.body?.phoneNumber;

      const email = hasEmailInput
        ? (originalEmail ?? "").trim().toLowerCase()
        : "";
      const rawPhone = hasPhoneInput ? (originalPhone ?? "").trim() : "";
      let normalizedPhone = rawPhone;

      if (rawPhone) {
        try {
          const parsedPhone = parsePhoneNumberWithError(rawPhone);
          if (!parsedPhone.isValid()) {
            throw new APIError("BAD_REQUEST", {
              message: "ERR_INVALID_PHONE",
            });
          }
          normalizedPhone = parsedPhone.number;
        } catch {
          throw new APIError("BAD_REQUEST", {
            message: "ERR_INVALID_PHONE",
          });
        }
      }

      const [foundEmail, foundPhone] = await Promise.all([
        email
          ? db
              .select({ id: schema.user.id })
              .from(schema.user)
              .where(eq(schema.user.email, email))
              .limit(1)
          : Promise.resolve([]),
        normalizedPhone
          ? db
              .select({ id: schema.user.id })
              .from(schema.user)
              .where(eq(schema.user.phoneNumber, normalizedPhone))
              .limit(1)
          : Promise.resolve([]),
      ]);

      if (foundEmail.length > 0 && foundPhone.length > 0) {
        throw new APIError("BAD_REQUEST", {
          message: "ERR_EMAIL_EXISTS|ERR_PHONE_EXISTS",
        });
      }

      if (foundEmail.length > 0) {
        throw new APIError("BAD_REQUEST", {
          message: "ERR_EMAIL_EXISTS",
        });
      }

      if (foundPhone.length > 0) {
        throw new APIError("BAD_REQUEST", {
          message: "ERR_PHONE_EXISTS",
        });
      }

      const shouldRewriteEmail = hasEmailInput && originalEmail !== email;
      const shouldRewritePhone =
        hasPhoneInput && originalPhone !== normalizedPhone;

      if (shouldRewriteEmail || shouldRewritePhone) {
        const nextBody = {
          ...ctx.body,
          ...(shouldRewriteEmail ? { email } : {}),
          ...(shouldRewritePhone ? { phoneNumber: normalizedPhone } : {}),
        };

        return {
          context: {
            ...ctx,
            body: nextBody,
          },
        };
      }
    }),
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: (profile) => ({
        firstName: profile.given_name ?? "",
        lastName: profile.family_name ?? "",
      }),
    },
  },
  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: true,
      },
      lastName: {
        type: "string",
        required: true,
      },
      firstNameAr: {
        type: "string",
        required: false,
      },
      lastNameAr: {
        type: "string",
        required: false,
      },
      educationLevel: {
        type: "string",
        required: false,
      },
      university: {
        type: "string",
        required: false,
      },
      faculty: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        required: false,
      },
      company: {
        type: "string",
        required: false,
      },
      school: {
        type: "string",
        required: false,
      },
      gpa: {
        type: "number",
        required: false,
        validator: {
          input: z.coerce.number().min(0.0).max(4.0),
        },
      },
      industry: {
        type: "string",
        required: false,
      },
      dateOfBirth: {
        type: "date",
        required: false,
        validator: {
          input: z.coerce.date(),
        },
      },
      nationality: {
        type: "string",
        required: false,
      },
      city: {
        type: "string",
        required: false,
      },
      currentInterest: {
        type: "string",
        required: false,
      },
      savedOpportunities: {
        type: "string[]",
        defaultValue: [],
        required: false,
      },
      registeredEvents: {
        type: "string[]",
        defaultValue: [],
        required: false,
      },
    },
  },
  plugins: [
    nextCookies(),
    emailOTP({
      otpLength: 6,
      expiresIn: EMAIL_OTP_EXPIRY_IN_SECONDS,
      overrideDefaultEmailVerification: true,
      rateLimit: {
        // Keep plugin-level throttle permissive and enforce product limits per email in middleware.
        window: 60,
        max: 100,
      },
      sendVerificationOTP: async ({ email, otp, type }) => {
        const normalizedEmail = normalizeEmailAddress(email);
        const { subject, text } = getOtpEmailContent(type, otp);

        console.log(`[TEST] Verification OTP for ${normalizedEmail}: ${otp}`);

        try {
          /* Temporarily disabled for testing
          await sendEmail({
            to: normalizedEmail,
            subject,
            text,
          });
          */
        } finally {
          await recordEmailOtpSend(normalizedEmail);
        }
      },
    }),
    phoneNumber(),
    admin(),
    bearer(),
  ],
});
