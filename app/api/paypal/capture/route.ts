
import { NextResponse } from 'next/server';
import {
  beginCapture,
  completeCapture,
  failCapture,
  getPaymentIntent,
} from '@/lib/payment-store';
import { paypalConfigured, paypalRequest } from '@/lib/paypal';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let activeOrderId: string | undefined;

  try {
    if (!paypalConfigured()) {
      return NextResponse.json(
        { error: 'Configure PayPal Sandbox credentials first.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const orderId = body?.orderId;

    if (typeof orderId !== 'string' || !orderId.trim()) {
      return NextResponse.json(
        { error: 'A valid orderId is required.' },
        { status: 400 }
      );
    }

    activeOrderId = orderId;

    // Retrieve payment details from the server-side store.
    const intent = getPaymentIntent(orderId);

    if (!intent) {
      return NextResponse.json(
        { error: 'Payment intent not found. Create a new order.' },
        { status: 404 }
      );
    }

    // Prevent duplicate or concurrent captures.
    const captureLock = beginCapture(orderId);

    if (!captureLock.ok) {
      return NextResponse.json(
        {
          error: `Capture rejected: ${captureLock.reason}`,
        },
        { status: 409 }
      );
    }

    // Retrieve the order directly from PayPal.
    const order = await paypalRequest(
      `/v2/checkout/orders/${encodeURIComponent(orderId)}`,
      'GET'
    );

    const purchase = order.purchase_units?.[0];
    const paypalAmount = Number(purchase?.amount?.value);
    const currency = purchase?.amount?.currency_code;

    // Verify the PayPal order against the stored payment intent.
    if (
      order.status !== 'APPROVED' ||
      !Number.isFinite(paypalAmount) ||
      Math.abs(paypalAmount - intent.amount) > 0.00001 ||
      currency !== intent.currency ||
      purchase?.custom_id !== intent.agentId
    ) {
      failCapture(orderId);

      return NextResponse.json(
        {
          error: 'PayPal order does not match the stored payment intent.',
        },
        { status: 409 }
      );
    }

    // Capture the approved PayPal order.
    const result = await paypalRequest(
      `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      'POST',
      {},
      `payshield-capture-${orderId}`
    );

    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];

    if (
      result.status !== 'COMPLETED' ||
      capture?.status !== 'COMPLETED'
    ) {
      failCapture(orderId);

      return NextResponse.json(
        {
          error: 'PayPal did not confirm a completed capture.',
          paypalStatus: result.status,
          captureStatus: capture?.status,
        },
        { status: 502 }
      );
    }

    completeCapture(orderId, capture.id);

    return NextResponse.json({
      success: true,
      result,
      firewall: {
        decision: 'ALLOW',
        reasons: ['Server-side payment intent and PayPal order verified.'],
      },
      transaction: {
        orderId,
        status: 'COMPLETED',
        captureId: capture.id,
        amount: paypalAmount,
        currency,
        agentId: intent.agentId,
        recipient: intent.recipient,
        humanApproved: intent.humanApproved,
      },
    });
  } catch (error: any) {
    if (activeOrderId) {
      failCapture(activeOrderId);
    }

    console.error('PayPal capture error:', error);

    return NextResponse.json(
      { error: error.message || 'Capture failed.' },
      { status: 502 }
    );
  }
}
