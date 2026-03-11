import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema/auth-schema";
import { admin, bearer, phoneNumber } from "better-auth/plugins";
import { z } from "zod";
const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL!,
    ssl: false,
  },
});

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
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
      GPA: {
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
