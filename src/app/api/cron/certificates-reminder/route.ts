export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { CertificatesRepository } from "@/domain/certificates/infrastructure/db/certificates.repository";
import { CertificateEmailService } from "@/domain/certificates/application/certificate-email.service";
import { db } from "@/db";

/**
 * GET /api/cron/certificates-reminder
 *
 * Cron job endpoint — called by Vercel Cron or an external scheduler.
 * Sends a 7-day reminder email to all recipients whose certificate:
 * - has status = PENDING (not yet claimed)
 * - was issued between 7 and 8 days ago
 *
 * Security: protected by CRON_SECRET header to prevent unauthorized calls.
 *
 * T059 — 7-day unclaimed reminder
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repo = new CertificatesRepository(db as any);
    const emailService = new CertificateEmailService();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scholarx.lk";

    // Fetch PENDING certs issued 7–8 days ago
    const pending = await repo.findUnclaimedOlderThanDays(7);

    let sent = 0;
    let failed = 0;

    for (const cert of pending) {
      try {
        const claimUrl = cert.claimToken
          ? `${baseUrl}/certificates/claim/${cert.claimToken}`
          : null;

        if (!claimUrl) continue;

        await emailService.sendReminderEmail(
          cert.recipientEmail,
          cert.recipientName,
          claimUrl,
        );

        await repo.logEvent({
          certificateId: cert.id,
          eventType: "email_resent",
          metadata: { reason: "7_day_reminder" },
        });

        sent++;
      } catch (err) {
        console.error(`[cron/certificates-reminder] Failed for ${cert.id}:`, err);
        failed++;
      }
    }

    return NextResponse.json({
      message: "Reminder cron completed.",
      sent,
      failed,
      total: pending.length,
    });
  } catch (err) {
    console.error("[GET /api/cron/certificates-reminder]", err);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
