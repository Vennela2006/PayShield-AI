
import { randomUUID } from 'node:crypto';

export type PaymentIntentStatus =
  | 'ORDER_CREATED'
  | 'CAPTURING'
  | 'CAPTURED'
  | 'CAPTURE_FAILED';

export type PaymentIntent = {
  id: string;
  agentId: string;
  recipient: string;
  amount: number;
  currency: string;
  humanApproved: boolean;
  paypalOrderId: string;
  status: PaymentIntentStatus;
  createdAt: string;
  captureId?: string;
};

type Store = {
  intents: Map<string, PaymentIntent>;
};

const globalStore = globalThis as typeof globalThis & {
  __payshieldPaymentStore?: Store;
};

const store =
  globalStore.__payshieldPaymentStore ??
  (globalStore.__payshieldPaymentStore = {
    intents: new Map<string, PaymentIntent>(),
  });

export function createPaymentIntent(
  data: Omit<PaymentIntent, 'id' | 'status' | 'createdAt'>
): PaymentIntent {
  const intent: PaymentIntent = {
    ...data,
    id: randomUUID(),
    status: 'ORDER_CREATED',
    createdAt: new Date().toISOString(),
  };

  store.intents.set(intent.paypalOrderId, intent);
  return intent;
}

export function getPaymentIntent(
  paypalOrderId: string
): PaymentIntent | undefined {
  return store.intents.get(paypalOrderId);
}

export function beginCapture(paypalOrderId: string) {
  const intent = getPaymentIntent(paypalOrderId);

  if (!intent) {
    return { ok: false as const, reason: 'NOT_FOUND' as const };
  }

  if (intent.status === 'CAPTURED') {
    return { ok: false as const, reason: 'ALREADY_CAPTURED' as const, intent };
  }

  if (intent.status === 'CAPTURING') {
    return { ok: false as const, reason: 'CAPTURE_IN_PROGRESS' as const, intent };
  }

  intent.status = 'CAPTURING';
  return { ok: true as const, intent };
}

export function completeCapture(
  paypalOrderId: string,
  captureId?: string
) {
  const intent = getPaymentIntent(paypalOrderId);
  if (!intent) return false;

  intent.status = 'CAPTURED';
  intent.captureId = captureId;
  return true;
}

export function failCapture(paypalOrderId: string) {
  const intent = getPaymentIntent(paypalOrderId);
  if (!intent) return false;

  intent.status = 'CAPTURE_FAILED';
  return true;
}
