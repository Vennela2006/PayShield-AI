
import { NextResponse } from 'next/server';
import {
  defaultPolicy,
  evaluatePayment,
} from '@/lib/policy';
import {
  claimApproval,
  consumeApproval,
  releaseApproval,
} from '@/lib/approval-store';
import { createPaymentIntent } from '@/lib/payment-store';
import {
  paypalConfigured,
  paypalRequest,
} from '@/lib/paypal';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let claimedApprovalId: string | null = null;

  try {
    const body = await req.json();

    if (
      typeof body.agentId !== 'string' ||
      !body.agentId.trim() ||
      body.agentId.length > 100 ||
      typeof body.recipient !== 'string' ||
      !body.recipient.trim() ||
      body.recipient.length > 254 ||
      !Number.isFinite(Number(body.amount))
    ) {
      return NextResponse.json(
        { error: 'Valid agent, recipient and amount are required.' },
        { status: 400 }
      );
    }

    const agentId = body.agentId.trim();
    const recipient = body.recipient.trim();
    const amount = Math.round(Number(body.amount) * 100) / 100;

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero.' },
        { status: 400 }
      );
    }

    const highValue = amount > defaultPolicy.requireApprovalAbove;
    let humanApproved = false;

    if (highValue) {
      if (typeof body.approvalRequestId !== 'string') {
        return NextResponse.json(
          {
            error: 'Administrator approval is required. Evaluate the payment and complete PIN approval first.',
          },
          { status: 403 }
        );
      }

      const claimed = claimApproval(body.approvalRequestId, {
        agentId,
        recipient,
        amount,
        currency: 'USD',
      });

      if (!claimed) {
        return NextResponse.json(
          {
            error: 'Approval is missing, expired, already used, or does not match this payment.',
          },
          { status: 403 }
        );
      }

      claimedApprovalId = body.approvalRequestId;
      humanApproved = true;
    }

    const firewall = evaluatePayment({
      agentId,
      recipient,
      amount,
      currency: 'USD',
      recentTransactions: 0,
      approvedByHuman: humanApproved,
    });

    if (firewall.decision !== 'ALLOW') {
      if (claimedApprovalId) {
        releaseApproval(claimedApprovalId);
        claimedApprovalId = null;
      }

      return NextResponse.json(
        {
          error: `Firewall ${firewall.decision.toLowerCase()}: payment was not sent to PayPal.`,
          firewall,
        },
        { status: 403 }
      );
    }

    // Local demo mode: no PayPal API request is made.
    if (!paypalConfigured()) {
      const demoId = `DEMO-${crypto.randomUUID()}`;

      createPaymentIntent({
        agentId,
        recipient,
        amount,
        currency: 'USD',
        humanApproved,
        paypalOrderId: demoId,
      });

      if (
        claimedApprovalId &&
        !consumeApproval(claimedApprovalId)
      ) {
        return NextResponse.json(
          { error: 'Unable to finalize administrator approval.' },
          { status: 409 }
        );
      }

      claimedApprovalId = null;

      return NextResponse.json({
        demo: true,
        id: demoId,
        firewall,
        message: 'Local demo order only. No PayPal request was made.',
      });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const order = await paypalRequest(
      '/v2/checkout/orders',
      'POST',
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: amount.toFixed(2),
            },
            description: 'PayShield authorized agent payment',
            custom_id: agentId.slice(0, 127),
            invoice_id: `PS-${crypto.randomUUID().slice(0, 30)}`,
          },
        ],
        application_context: {
          brand_name: 'PayShield AI Demo',
          user_action: 'PAY_NOW',
          return_url: `${appUrl}/?paypal=success`,
          cancel_url: `${appUrl}/?paypal=cancel`,
        },
      },
      `payshield-${crypto.randomUUID()}`
    );

    if (!order.id) {
      throw new Error('PayPal did not return an order ID.');
    }

    const approvalUrl = order.links?.find(
      (link: { rel: string; href: string }) =>
        link.rel === 'approve'
    )?.href;

    if (!approvalUrl) {
      throw new Error('PayPal approval URL was not returned.');
    }

    // The server stores the authoritative payment details.
    createPaymentIntent({
      agentId,
      recipient,
      amount,
      currency: 'USD',
      humanApproved,
      paypalOrderId: order.id,
    });

    if (
      claimedApprovalId &&
      !consumeApproval(claimedApprovalId)
    ) {
      return NextResponse.json(
        { error: 'Unable to finalize administrator approval.' },
        { status: 409 }
      );
    }

    claimedApprovalId = null;

    return NextResponse.json({
      demo: false,
      id: order.id,
      status: order.status,
      approvalUrl,
      firewall,
    });
  } catch (error) {
    if (claimedApprovalId) {
      releaseApproval(claimedApprovalId);
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Unable to create PayPal order.';

    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
