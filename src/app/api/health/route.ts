import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  const env = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasAuthSecret: !!process.env.BETTER_AUTH_SECRET,
    hasAuthUrl: !!process.env.BETTER_AUTH_URL,
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
