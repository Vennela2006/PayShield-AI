import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const result = await db.query('SELECT 1 AS ok');

    return NextResponse.json({
      status: result.rows[0]?.ok === 1 ? 'connected' : 'error',
    });
  } catch {
    return NextResponse.json(
      { status: 'database_unavailable' },
      { status: 503 }
    );
  }
}
