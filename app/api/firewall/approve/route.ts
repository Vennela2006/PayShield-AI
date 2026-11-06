
import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { approveRequest } from '@/lib/approval-store';

export const runtime = 'nodejs';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type AttemptRecord = {
  count: number;
  resetAt: number;
};

const globalRateLimit = globalThis as typeof globalThis & {
  __payshieldApprovalAttempts?: Map<string, AttemptRecord>;
};

const attempts =
  globalRateLimit.__payshieldApprovalAttempts ??
  (globalRateLimit.__payshieldApprovalAttempts =
    new Map<string, AttemptRecord>());

function verifyPin(supplied: string, expected: string): boolean {
  // Hash both values to produce equal-length buffers before comparison.
  const suppliedHash = createHash('sha256').update(supplied).digest();
  const expectedHash = createHash('sha256').update(expected).digest();

  return timingSafeEqual(suppliedHash, expectedHash);
}

export async function POST(req: Request) {
  try {
    const configuredPin = process.env.PAYSHIELD_APPROVAL_PIN;

    if (!configuredPin || configuredPin.length < 8) {
      return NextResponse.json(
        { error: 'Approval PIN is not configured correctly.' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const requestId = body?.requestId;
    const pin = body?.pin;

    if (
      typeof requestId !== 'string' ||
      typeof pin !== 'string' ||
      pin.length < 1 ||
      pin.length > 128
    ) {
      return NextResponse.json(
        { error: 'A valid request ID and PIN are required.' },
        { status: 400 }
      );
    }

    // Use the proxy-provided client IP where available.
    // Production deployment must use a trusted proxy that overwrites
    // these headers rather than accepting arbitrary client values.
    const forwarded = req.headers.get('x-forwarded-for');
    const clientIp =
      req.headers.get('x-real-ip') ||
      forwarded?.split(',')[0]?.trim() ||
      'local-client';

    const now = Date.now();
    let record = attempts.get(clientIp);

    if (!record || now >= record.resetAt) {
      record = { count: 0, resetAt: now + WINDOW_MS };
      attempts.set(clientIp, record);
    }

    if (record.count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again in 15 minutes.' },
        { status: 429 }
      );
    }

    if (!verifyPin(pin, configuredPin)) {
      record.count += 1;

      return NextResponse.json(
        { error: 'Approval PIN is incorrect.' },
        { status: 401 }
      );
    }

    // Reset attempts after a successful PIN check.
    attempts.delete(clientIp);

    const approved = approveRequest(requestId);

    if (!approved) {
      return NextResponse.json(
        {
          error:
            'Approval request is invalid, expired, or already processed.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      requestId,
      status: 'APPROVED',
      message: 'Payment request approved.',
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to process approval request.' },
      { status: 400 }
    );
  }
}
