import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema/auth-schema";
import { admin, bearer, phoneNumber } from "better-auth/plugins";
import { parsePhoneNumberWithError } from "libphonenumber-js";
import { z } from "zod";
import { sendEmail } from "./email";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      try {
        await sendEmail({
          to: user.email,
          subject: "Verify your email address",
          text: `Click the link to verify your email: ${url}`,
        });
      } catch (error) {
        console.error("[sendVerificationEmail] sendEmail failed", error);
        throw error;
      }
    },
    async afterEmailVerification(user, request) {
      // Actions after user verified email
    },
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendOnSignIn: false,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
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
        const parsedPhone = parsePhoneNumberWithError(rawPhone);
        if (!parsedPhone || !parsedPhone.isValid()) {
          throw new APIError("BAD_REQUEST", {
            message: "ERR_INVALID_PHONE",
          });
        }

        normalizedPhone = parsedPhone.number;
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
  plugins: [nextCookies(), phoneNumber(), admin(), bearer()],
});
