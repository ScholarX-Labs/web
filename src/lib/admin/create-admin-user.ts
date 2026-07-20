import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/db";
import { user as userSchema, account as accountSchema } from "@/db/schema/auth-schema";

export interface AdminCreatedUser {
  id: string;
  email: string;
  name: string;
}

interface CreateUserOptions {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  mustChangePassword?: boolean;
}

async function generateUniqueUsername(
  firstName: string,
  lastName: string,
): Promise<string> {
  const base = `${firstName}.${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
    .slice(0, 26);

  const candidateBase = base || `user-${randomUUID().slice(0, 6)}`;

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate =
      attempt === 0
        ? candidateBase
        : `${candidateBase}-${randomUUID().slice(0, 6)}`;

    const existing = await db
      .select({ id: userSchema.id })
      .from(userSchema)
      .where(eq(userSchema.username, candidate))
      .limit(1);

    if (existing.length === 0) {
      return candidate;
    }
  }

  return `user-${randomUUID().slice(0, 12)}`;
}

export async function createAdminUser(
  options: CreateUserOptions,
): Promise<AdminCreatedUser> {
  const userId = randomUUID();
  const username = await generateUniqueUsername(
    options.firstName,
    options.lastName,
  );

  const [createdUser] = await db
    .insert(userSchema)
    .values({
      id: userId,
      email: options.email.toLowerCase(),
      name: `${options.firstName} ${options.lastName}`,
      firstName: options.firstName,
      lastName: options.lastName,
      phoneNumber: options.phoneNumber ?? null,
      emailVerified: false,
      mustChangePassword: options.mustChangePassword ?? false,
      role: "user",
      username,
    })
    .returning({
      id: userSchema.id,
      email: userSchema.email,
      name: userSchema.name,
    });

  if (!createdUser) {
    throw new Error("Failed to create user record");
  }

  const hashedPassword = await hashPassword(options.password);

  await db.insert(accountSchema).values({
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: hashedPassword,
  });

  return {
    id: createdUser.id,
    email: createdUser.email,
    name: createdUser.name,
  };
}
