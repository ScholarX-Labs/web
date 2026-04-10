import { z } from "zod";

// Define the schema for environment variables
const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().min(1).default("/api"),
  NEXT_PUBLIC_API_BASE_URL: z.string().min(1).default("/api"),
  // Add other env variables here as needed
});

// Parse the environment variables to ensure they match the schema
// This provides runtime validation and type safety
export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_API_BASE_URL:
    process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL,
});

// Log env config on load for diagnostics
if (typeof window !== "undefined") {
  console.log("[ENV] NEXT_PUBLIC_API_BASE_URL:", env.NEXT_PUBLIC_API_BASE_URL);
  console.log("[ENV] NEXT_PUBLIC_API_URL:", env.NEXT_PUBLIC_API_URL);
}

export type Env = z.infer<typeof envSchema>;
