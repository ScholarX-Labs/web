import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const env = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDatabaseSsl: !!process.env.DATABASE_SSL,
    hasAuthSecret: !!process.env.BETTER_AUTH_SECRET,
    hasAuthUrl: !!process.env.BETTER_AUTH_URL,
    hasDopplerToken: !!process.env.DOPPLER_TOKEN,
    port: process.env.PORT ?? null,
    nodeEnv: process.env.NODE_ENV,
  };

  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ status: 'ok', db: 'connected', env });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        db: error instanceof Error ? error.message : 'failed',
        env,
      },
      { status: 500 },
    );
  }
}
