
import { randomUUID } from 'node:crypto';

export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'CLAIMED'
  | 'CONSUMED'
  | 'REJECTED';

export type ApprovalRequest = {
  id: string;
  agentId: string;
  recipient: string;
  amount: number;
  currency: string;
  status: ApprovalStatus;
  createdAt: number;
  expiresAt: number;
};

const REQUEST_TTL_MS = 5 * 60 * 1000;

type ApprovalStore = {
  requests: Map<string, ApprovalRequest>;
};

const globalApprovalStore = globalThis as typeof globalThis & {
  __payshieldApprovalStore?: ApprovalStore;
};

const store =
  globalApprovalStore.__payshieldApprovalStore ??
  (globalApprovalStore.__payshieldApprovalStore = {
    requests: new Map<string, ApprovalRequest>(),
  });

export function createApprovalRequest(data: {
  agentId: string;
  recipient: string;
  amount: number;
  currency: string;
}): ApprovalRequest {
  const now = Date.now();

  const request: ApprovalRequest = {
    ...data,
    id: randomUUID(),
    status: 'PENDING',
    createdAt: now,
    expiresAt: now + REQUEST_TTL_MS,
  };

  store.requests.set(request.id, request);
  return request;
}

export function getApprovalRequest(id: string) {
  const request = store.requests.get(id);

  if (!request) return undefined;

  if (Date.now() > request.expiresAt) {
    store.requests.delete(id);
    return undefined;
  }

  return request;
}

export function approveRequest(id: string) {
  const request = getApprovalRequest(id);

  if (!request || request.status !== 'PENDING') {
    return false;
  }

  request.status = 'APPROVED';
  return true;
}

export function claimApproval(
  id: string,
  expected: {
    agentId: string;
    recipient: string;
    amount: number;
    currency: string;
  }
) {
  const request = getApprovalRequest(id);

  if (!request || request.status !== 'APPROVED') {
    return false;
  }

  const matches =
    request.agentId === expected.agentId &&
    request.recipient.toLowerCase() === expected.recipient.toLowerCase() &&
    request.amount === expected.amount &&
    request.currency === expected.currency;

  if (!matches) return false;

  request.status = 'CLAIMED';
  return true;
}

export function consumeApproval(id: string) {
  const request = getApprovalRequest(id);

  if (!request || request.status !== 'CLAIMED') {
    return false;
  }

  request.status = 'CONSUMED';
  return true;
}

export function releaseApproval(id: string) {
  const request = getApprovalRequest(id);

  if (!request || request.status !== 'CLAIMED') {
    return false;
  }

  request.status = 'APPROVED';
  return true;
}
