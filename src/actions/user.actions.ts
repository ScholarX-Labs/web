"use server";

import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { auth } from "@/lib/auth";

/**
 * Toggles the save status of an opportunity for the currently authenticated user.
 * Uses atomic array operations (array_append, array_remove) to ensure concurrency safety.
 *
 * @param opportunityId The ID of the opportunity to save or unsave.
 * @param action "save" to append, "unsave" to remove.
 * @returns { success: boolean, error?: string }
 */
export async function toggleSavedOpportunity(
  opportunityId: string,
  action: "save" | "unsave"
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (action === "save") {
      await db
        .update(user)
        .set({
          savedOpportunities: sql`array_append(${user.savedOpportunities}, ${opportunityId})`,
        })
        .where(eq(user.id, session.user.id));
    } else {
      await db
        .update(user)
        .set({
          savedOpportunities: sql`array_remove(${user.savedOpportunities}, ${opportunityId})`,
        })
        .where(eq(user.id, session.user.id));
    }

    // Revalidate paths where opportunities are likely displayed
    revalidatePath("/ai-search");
    revalidatePath("/opportunities");

    return { success: true };
  } catch (error) {
    console.error("[toggleSavedOpportunity] Error:", error);
    return { success: false, error: "Internal Server Error" };
  }
}
