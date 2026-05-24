import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().min(1).default("/api"),
  NEXT_PUBLIC_API_BASE_URL: z.string().min(1).default("/api"),

  R2_ENDPOINT: z.string().url().optional(),
  R2_ACCESS_KEY: z.string().optional(),
  R2_SECRET_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),

  AZURE_REDIS_HOST: z.string().min(1).optional(),
  AZURE_REDIS_PORT: z.string().regex(/^\d+$/).optional(),
  AZURE_REDIS_KEY: z.string().optional(),
  AZURE_REDIS_CLUSTER: z.enum(["true", "false"]).optional(),
  AZURE_REDIS_TLS: z.enum(["true", "false"]).optional(),
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().min(1).optional(),
  REDIS_PORT: z.string().regex(/^\d+$/).optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_KEY_PREFIX: z.string().min(1).optional(),
  CACHE_ENABLED: z.enum(["true", "false"]).optional(),
  DISTRIBUTED_RATE_LIMITS_ENABLED: z.enum(["true", "false"]).optional(),

  AVATAR_UPLOAD_ENABLED: z.enum(["true", "false"]).optional(),

  BETTER_AUTH_URL: z.string().url().optional(),
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
