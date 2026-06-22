import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { calculateR2Usage } from "@/lib/upload";
import { clearConfigCache, setConfig } from "@/lib/app-config";

const FREE_TIER_GB = 10;

const BUDGET_TIERS = [
  { threshold: 0.95, label: "95%", action: "disable" as const },
  { threshold: 0.80, label: "80%", action: "alert" as const },
] as const;

async function sendAlert(message: string): Promise<void> {
  console.error(`[storage-check] ALERT: ${message}`);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const isAdmin = session?.user?.role === "admin";
    const providedKey = request.headers.get("x-internal-key");
    const expectedKey = process.env.INTERNAL_API_KEY;

    let isInternal = false;
    if (providedKey && expectedKey) {
      const providedBuffer = Buffer.from(providedKey);
      const expectedBuffer = Buffer.from(expectedKey);
      if (providedBuffer.length === expectedBuffer.length) {
        isInternal = crypto.timingSafeEqual(providedBuffer, expectedBuffer);
      }
    }

    if (!isAdmin && !isInternal) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const totalBytes = await calculateR2Usage();
    const totalGB = totalBytes / (1024 * 1024 * 1024);
    const usagePercent = (totalGB / FREE_TIER_GB) * 100;

    let actionTaken: string | null = null;

    for (const tier of BUDGET_TIERS) {
      if (usagePercent >= tier.threshold * 100) {
        if (tier.action === "disable") {
          await setConfig("avatar_upload_enabled", "false", "system:storage-check");
          clearConfigCache();
          await sendAlert(
            `R2 storage at ${totalGB.toFixed(1)}GB (${tier.label}) — auto-disabled uploads`
          );
          actionTaken = "avatar_upload_disabled";
        } else {
          await sendAlert(
            `R2 storage at ${totalGB.toFixed(1)}GB (${tier.label} of ${FREE_TIER_GB}GB free tier)`
          );
          actionTaken = actionTaken ?? "alert_sent";
        }
      }
    }

    return NextResponse.json({
      totalBytes,
      totalGB: Math.round(totalGB * 10) / 10,
      usagePercent: Math.round(usagePercent * 10) / 10,
      freeTierGB: FREE_TIER_GB,
      actionTaken,
      status: actionTaken === "avatar_upload_disabled" ? "uploads_disabled" : "ok",
    });
  } catch (error) {
    console.error("[storage-check] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
