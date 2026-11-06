export type Policy = {
  perTransactionLimit: number;
  dailyLimit: number;
  approvedRecipients: string[];
  blockedRecipients: string[];
  requireApprovalAbove: number;
  maxTransactionsPerHour: number;
};
export type PaymentRequest = {
  agentId: string;
  recipient: string;
  amount: number;
  currency: string;
  recentTransactions: number;
  approvedByHuman?: boolean;
};
export type Decision = { decision: 'ALLOW' | 'REVIEW' | 'BLOCK'; reasons: string[]; policy: Policy };

// Keep the policy engine in TypeScript so Next.js does not depend on a
// default import from the ESM .mjs module (which was undefined at runtime).
export const defaultPolicy: Policy = {
  perTransactionLimit: 500,
  dailyLimit: 1500,
  approvedRecipients: ['studio@northstar.test', 'merchant@demo.test'],
  blockedRecipients: ['suspicious@fraud.test'],
  requireApprovalAbove: 250,
  maxTransactionsPerHour: 5,
};

export function evaluatePayment(req: PaymentRequest, policy: Policy = defaultPolicy): Decision {
  const reasons: string[] = [];
  if (!Number.isFinite(req.amount) || req.amount <= 0) reasons.push('Amount must be a positive number');
  if (req.amount > policy.perTransactionLimit) reasons.push(`Amount exceeds per-transaction limit (${policy.perTransactionLimit} ${req.currency})`);
  if (policy.blockedRecipients.some(x => x.toLowerCase() === req.recipient.toLowerCase())) reasons.push('Recipient is explicitly blocked');
  if (req.recentTransactions >= policy.maxTransactionsPerHour) reasons.push('Hourly transaction frequency limit reached');
  if (reasons.length) return { decision: 'BLOCK', reasons, policy };
  if (!policy.approvedRecipients.some(x => x.toLowerCase() === req.recipient.toLowerCase())) reasons.push('Recipient is not on the approved list');
  if (req.amount > policy.requireApprovalAbove && !req.approvedByHuman) reasons.push('Human approval required above configured threshold');
  if (reasons.length) return { decision: 'REVIEW', reasons, policy };
  return { decision: 'ALLOW', reasons: ['All deterministic spending policies passed'], policy };
}
