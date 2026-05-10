"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import type { PublicProfile } from "@/types/profile.types";

export async function getPublicProfile(
  username: string
): Promise<PublicProfile | null> {
  try {
    const [profile] = await db
      .select({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        educationLevel: user.educationLevel,
        university: user.university,
        faculty: user.faculty,
        currentInterest: user.currentInterest,
        githubUrl: user.githubUrl,
        facebookUrl: user.facebookUrl,
        instagramUrl: user.instagramUrl,
        twitterUrl: user.twitterUrl,
        linkedinUrl: user.linkedinUrl,
      })
      .from(user)
      .where(
        and(
          eq(user.username, username),
          eq(user.isProfilePublic, true)
        )
      )
      .limit(1);

    if (!profile || !profile.username) return null;

    return profile as PublicProfile;
  } catch (error) {
    console.error("[getPublicProfile] Error:", error);
    return null;
  }
}
