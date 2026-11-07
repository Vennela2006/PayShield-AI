'use client';

import { AgStudio } from 'ag-studio-react';

type Transaction = {
  id: string;
  time: string;
  agent: string;
  recipient: string;
  amount: number;
  status: string;
  risk: number;
  source: string;
};

type AnalyticsStudioProps = {
  rows: Transaction[];
};

export default function AnalyticsStudio({ rows }: AnalyticsStudioProps) {
  const studioData = {
    description:
      'PayShield AI transaction ledger. Explore payment amounts, risk scores, decisions, agents, recipients and transaction sources. Data is synthetic or sandbox data.',
    sources: [
      {
        id: 'payshield_transactions',
        name: 'PayShield Transactions',
        data: rows,
      },
    ],
  };

  return (
    <div
      style={{
        width: '100%',
        height: '720px',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <AgStudio
        data={studioData}
        mode="edit"
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
