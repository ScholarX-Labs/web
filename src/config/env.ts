import { z } from "zod";

const secureUrlSchema = z.string().url().refine(
  (val) => /^https?:\/\//i.test(val),
  { message: "Must be a valid HTTP/HTTPS URL" }
);

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().min(1).default("/api"),
  NEXT_PUBLIC_API_BASE_URL: z.string().min(1).default("/api"),

  R2_ENDPOINT: secureUrlSchema.optional(),
  R2_ACCESS_KEY: z.string().optional(),
  R2_SECRET_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: secureUrlSchema.optional(),

  UPSTASH_REDIS_URL: secureUrlSchema.optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),

  AVATAR_UPLOAD_ENABLED: z.enum(["true", "false"]).optional(),

  BETTER_AUTH_URL: secureUrlSchema.optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues
    .filter((i) => i.code === "invalid_type" && i.message.includes("Required"))
    .map((i) => i.path.join("."));

  if (missing.length > 0) {
    throw new Error(
      `[ENV] Missing required environment variables: ${missing.join(", ")}.\n` +
      "Check your .env.local file or Azure App Settings."
    );
  }

  console.warn("[ENV] Non-critical env validation warnings:", parsed.error.issues);
}

export const env = parsed.data ?? {
  NEXT_PUBLIC_API_URL: "/api",
  NEXT_PUBLIC_API_BASE_URL: "/api",
};

if (typeof window !== "undefined") {
  console.log("[ENV] NEXT_PUBLIC_API_BASE_URL:", env.NEXT_PUBLIC_API_BASE_URL);
}

export type Env = z.infer<typeof envSchema>;
