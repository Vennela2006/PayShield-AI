import { NextResponse } from 'next/server';
import { evaluatePayment, defaultPolicy } from '@/lib/policy';
import { createApprovalRequest } from '@/lib/approval-store';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (
      typeof body.agentId !== 'string' ||
      typeof body.recipient !== 'string' ||
      !body.recipient.trim() ||
      !Number.isFinite(Number(body.amount)) ||
      Number(body.amount) <= 0
    ) {
      return NextResponse.json(
        { error: 'Valid agent, recipient and positive amount are required.' },
        { status: 400 }
      );
    }

    // Ignore all approval and transaction-count values sent by the browser.
    const payment = {
      agentId: body.agentId.trim(),
      recipient: body.recipient.trim(),
      amount: Number(body.amount),
      currency: 'USD',
      recentTransactions: 0,
      approvedByHuman: false,
    };

    const result = evaluatePayment(payment);

    const recipientIsApproved = defaultPolicy.approvedRecipients.some(
      item => item.toLowerCase() === payment.recipient.toLowerCase()
    );

    const needsHighValueApproval =
      payment.amount > defaultPolicy.requireApprovalAbove;

    const approvalIsTheOnlyReason =
      result.decision === 'REVIEW' &&
      result.reasons.length === 1 &&
      result.reasons[0] ===
        'Human approval required above configured threshold';

    // PIN approval is available only for high-value payments
    // to recipients already present on the approved list.
    if (
      recipientIsApproved &&
      needsHighValueApproval &&
      approvalIsTheOnlyReason
    ) {
      const approval = createApprovalRequest({
        agentId: payment.agentId,
        recipient: payment.recipient,
        amount: payment.amount,
        currency: payment.currency,
      });

      return NextResponse.json({
        ...result,
        approvalRequired: true,
        approvalRequestId: approval.id,
        approvalExpiresAt: new Date(approval.expiresAt).toISOString(),
        evaluatedAt: new Date().toISOString(),
        engine: 'PayShield deterministic policy engine',
      });
    }

    return NextResponse.json({
      ...result,
      approvalRequired: false,
      reviewType:
        result.decision === 'REVIEW' && !recipientIsApproved
          ? 'RECIPIENT_NOT_APPROVED'
          : undefined,
      evaluatedAt: new Date().toISOString(),
      engine: 'PayShield deterministic policy engine',
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid payment request.' },
      { status: 400 }
    );
  }
}