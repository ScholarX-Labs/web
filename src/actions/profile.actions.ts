"use server";

import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { auth } from "@/lib/auth";
import type { ActionResponse } from "@/types/profile.types";

type ProfileData = Record<string, unknown>;
type PrivacyData = { isProfilePublic: boolean };

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  firstNameAr: z.string().max(100).optional(),
  lastNameAr: z.string().max(100).optional(),
  educationLevel: z.string().max(100).optional(),
  university: z.string().max(200).optional(),
  faculty: z.string().max(200).optional(),
  currentInterest: z.string().max(500).optional(),
  nationality: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  dateOfBirth: z.preprocess(
    (arg) => {
      if (typeof arg === "string" && arg) {
        const d = new Date(arg);
        return isNaN(d.getTime()) ? undefined : d;
      }
      return arg instanceof Date ? arg : undefined;
    },
    z.date().optional()
  ),
  industry: z.string().max(100).optional(),
  gpa: z.coerce.number().min(0).max(4).optional(),
});

const socialLinksSchema = z.object({
  githubUrl: z.string().url().refine(val => /^https?:\/\//i.test(val), "Must be an HTTP/HTTPS URL").optional().or(z.literal("")),
  facebookUrl: z.string().url().refine(val => /^https?:\/\//i.test(val), "Must be an HTTP/HTTPS URL").optional().or(z.literal("")),
  instagramUrl: z.string().url().refine(val => /^https?:\/\//i.test(val), "Must be an HTTP/HTTPS URL").optional().or(z.literal("")),
  twitterUrl: z.string().url().refine(val => /^https?:\/\//i.test(val), "Must be an HTTP/HTTPS URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url().refine(val => /^https?:\/\//i.test(val), "Must be an HTTP/HTTPS URL").optional().or(z.literal("")),
});

export async function getProfile(): Promise<ActionResponse<ProfileData>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [profile] = await db
      .select({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        firstNameAr: user.firstNameAr,
        lastNameAr: user.lastNameAr,
        email: user.email,
        image: user.image,
        username: user.username,
        educationLevel: user.educationLevel,
        university: user.university,
        faculty: user.faculty,
        currentInterest: user.currentInterest,
        nationality: user.nationality,
        city: user.city,
        dateOfBirth: user.dateOfBirth,
        industry: user.industry,
        gpa: user.gpa,
        githubUrl: user.githubUrl,
        facebookUrl: user.facebookUrl,
        instagramUrl: user.instagramUrl,
        twitterUrl: user.twitterUrl,
        linkedinUrl: user.linkedinUrl,
        isProfilePublic: user.isProfilePublic,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    return { success: true, data: profile };
  } catch (error) {
    console.error("[getProfile] Error:", error);
    return { success: false, error: "Internal Server Error" };
  }
}

export async function updateProfile(
  input: z.infer<typeof updateProfileSchema>
): Promise<ActionResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        updateData[key] = key === "dateOfBirth" && value ? new Date(value) : value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: "No fields to update" };
    }

    await db.update(user).set(updateData).where(eq(user.id, session.user.id));

    if (parsed.data.firstName || parsed.data.lastName) {
      const [current] = await db
        .select({ username: user.username })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      await db.update(user).set({
        name: sql`concat_ws(' ', ${user.firstName}, ${user.lastName})`,
      }).where(eq(user.id, session.user.id));

      if (current?.username) {
        revalidatePath(`/scholar/${current.username}`);
      }
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[updateProfile] Error:", error);
    return { success: false, error: "Internal Server Error" };
  }
}

export async function updateSocialLinks(
  input: z.infer<typeof socialLinksSchema>
): Promise<ActionResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = socialLinksSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const updateData: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      updateData[key] = value || null;
    }

    await db.update(user).set(updateData).where(eq(user.id, session.user.id));

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[updateSocialLinks] Error:", error);
    return { success: false, error: "Internal Server Error" };
  }
}

export async function deleteAccount(): Promise<ActionResponse> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [current] = await db
      .select({ image: user.image, username: user.username })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (current?.image) {
      const { getAvatarKeyFromUrl, deleteAvatar } = await import("@/lib/upload");
      const key = getAvatarKeyFromUrl(current.image);
      if (key) {
        await deleteAvatar(key);
      }
    }

    await db.delete(user).where(eq(user.id, session.user.id));

    revalidatePath("/scholar/" + (current?.username ?? ""));
    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("[deleteAccount] Error:", error);
    return { success: false, error: "Internal Server Error" };
  }
}

export async function toggleProfilePrivacy(): Promise<ActionResponse<PrivacyData>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [current] = await db
      .select({ isProfilePublic: user.isProfilePublic })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!current) {
      return { success: false, error: "User not found" };
    }

    await db
      .update(user)
      .set({ isProfilePublic: !current.isProfilePublic })
      .where(eq(user.id, session.user.id));

    revalidatePath("/profile");
    return { success: true, data: { isProfilePublic: !current.isProfilePublic } };
  } catch (error) {
    console.error("[toggleProfilePrivacy] Error:", error);
    return { success: false, error: "Internal Server Error" };
  }
}
