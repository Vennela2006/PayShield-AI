'use client';

import { useEffect, useState } from 'react';

type EvidenceFields = {
  amount?: number | string | null;
  transactionId?: string | null;
  date?: string | null;
  recipient?: string | null;
  sourceFile?: string | null;
};

type EvidenceData = {
  evidenceId?: string;
  mode?: string;
  message?: string;
  fields?: EvidenceFields;
};

type ReviewedFields = {
  amount: string;
  transactionId: string;
  date: string;
  recipient: string;
};

export default function EvidenceReview({
  evidence,
  onVerify,
  onInvalidate,
}: {
  evidence: EvidenceData | null;
  onVerify: (fields: ReviewedFields) => Promise<boolean>;
  onInvalidate: () => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [date, setDate] = useState('');
  const [recipient, setRecipient] = useState('');
  const [verified, setVerified] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const fields = evidence?.fields;

    setAmount(fields?.amount == null ? '' : String(fields.amount));
    setTransactionId(fields?.transactionId ?? '');
    setDate(fields?.date ?? '');
    setRecipient(fields?.recipient ?? '');
    setVerified(false);
    setAcknowledged(false);
    setSaving(false);
    setDraft('');
  }, [evidence]);

  async function invalidateVerification() {
    const wasAcknowledged = acknowledged || verified;

    setVerified(false);
    setAcknowledged(false);
    setDraft('');

    if (wasAcknowledged) {
      await onInvalidate();
    }
  }

  async function verifyEvidence() {
    if (
      !acknowledged ||
      !amount.trim() ||
      !transactionId.trim() ||
      !date.trim() ||
      !recipient.trim() ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return;
    }

    setSaving(true);

    try {
      const saved = await onVerify({
        amount,
        transactionId: transactionId.trim(),
        date: date.trim(),
        recipient: recipient.trim(),
      });

      setVerified(saved);
    } finally {
      setSaving(false);
    }
  }

  function generateDraft() {
    if (!verified) return;

    setDraft(
      `Subject: Request for investigation of payment ${transactionId}\n\n` +
      `Dear Support Team,\n\n` +
      `I am requesting an investigation of the following payment:\n\n` +
      `Transaction ID: ${transactionId}\n` +
      `Amount: USD ${Number(amount).toFixed(2)}\n` +
      `Transaction date: ${date}\n` +
      `Recipient: ${recipient}\n\n` +
      `Please review this transaction and advise me on the available dispute or reporting process. ` +
      `I can provide the original receipt and any additional supporting evidence required.\n\n` +
      `Thank you.`
    );
  }

  if (!evidence) {
    return (
      <div className="extract-result">
        <small>Upload evidence to begin reviewing transaction details.</small>
      </div>
    );
  }

  return (
    <div className="extract-result">
      <b>Extraction result · {evidence.mode || 'UNKNOWN'}</b>
      <p>{evidence.message || 'Review the extracted candidate fields below.'}</p>

      <div className="form-grid">
        <label>
          Transaction ID
          <input
            value={transactionId}
            onChange={e => {
              setTransactionId(e.target.value);
              void invalidateVerification();
            }}
          />
        </label>

        <label>
          Amount (USD)
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={e => {
              setAmount(e.target.value);
              void invalidateVerification();
            }}
          />
        </label>

        <label>
          Transaction date
          <input
            value={date}
            onChange={e => {
              setDate(e.target.value);
              void invalidateVerification();
            }}
          />
        </label>

        <label>
          Recipient
          <input
            value={recipient}
            onChange={e => {
              setRecipient(e.target.value);
              void invalidateVerification();
            }}
          />
        </label>
      </div>

      <small>Source file: {evidence.fields?.sourceFile || 'Not available'}</small>

      <div style={{ marginTop: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={e => {
              const checked = e.target.checked;
              setAcknowledged(checked);

              if (!checked) {
                setVerified(false);
                setDraft('');
                void onInvalidate();
              }
            }}
          />
          I checked these values against the original evidence.
        </label>
      </div>

      {verified && (
        <p style={{ color: '#20d9b1', marginTop: 10 }}>
          Evidence fields manually verified and saved by the analyst.
        </p>
      )}

      <div className="button-row" style={{ marginTop: 14 }}>
        <button
          type="button"
          className="primary-btn"
          onClick={verifyEvidence}
          disabled={
            saving ||
            !acknowledged ||
            !amount.trim() ||
            !transactionId.trim() ||
            !date.trim() ||
            !recipient.trim()
          }
        >
          {saving ? 'Saving verification...' : 'Verify evidence'}
        </button>

        <button
          type="button"
          className="outline-btn"
          onClick={generateDraft}
          disabled={!verified}
        >
          Generate complaint draft
        </button>
      </div>

      {draft && (
        <div style={{ marginTop: 18 }}>
          <b>Complaint draft · Not submitted</b>
          <textarea
            rows={12}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            style={{ width: '100%', marginTop: 10 }}
          />
          <small>
            Review the draft and submit it yourself through the appropriate official support channel.
            PayShield does not submit complaints or guarantee reimbursement.
          </small>
        </div>
      )}
    </div>
  );
}
