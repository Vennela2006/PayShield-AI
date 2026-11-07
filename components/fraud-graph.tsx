
'use client';

import { useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

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

type GraphNodeData = {
  label: string;
  subtitle: string;
  risk?: number;
  transaction?: Transaction;
};

function EntityNode({ data }: NodeProps<Node<GraphNodeData>>) {
  const isHighRisk = (data.risk ?? 0) >= 70;

  return (
    <div style={{
      background: '#101e30',
      border: `1px solid ${isHighRisk ? '#ef5350' : '#20d9b1'}`,
      borderRadius: 8,
      padding: '12px 16px',
      minWidth: 150,
      color: '#eef4fb',
      boxShadow: '0 4px 18px #0005',
    }}>
      <Handle type="target" position={Position.Left} />
      <strong style={{ fontSize: 12 }}>{data.label}</strong>
      <div style={{ color: '#9aacc0', fontSize: 10, marginTop: 5 }}>
        {data.subtitle}
      </div>
      {data.risk !== undefined && (
        <div style={{
          color: isHighRisk ? '#ef5350' : '#20d9b1',
          fontSize: 10,
          marginTop: 6,
        }}>
          Risk: {data.risk}/100
        </div>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { entity: EntityNode };

export default function FraudGraph({ rows }: { rows: Transaction[] }) {
  const [selected, setSelected] = useState<Transaction | null>(null);

  const { nodes, edges } = useMemo(() => {
    const agents = [...new Set(rows.map(row => row.agent))];
    const recipients = [...new Set(rows.map(row => row.recipient))];

    const graphNodes: Node<GraphNodeData>[] = [
      ...agents.map((agent, index) => ({
        id: `agent-${agent}`,
        type: 'entity',
        position: { x: 60, y: 60 + index * 150 },
        data: {
          label: agent,
          subtitle: 'Payment agent',
        },
      })),
      ...recipients.map((recipient, index) => {
        const related = rows.filter(row => row.recipient === recipient);
        const highestRisk = Math.max(...related.map(row => row.risk));

        return {
          id: `recipient-${recipient}`,
          type: 'entity',
          position: { x: 420, y: 60 + index * 130 },
          data: {
            label: recipient,
            subtitle: `${related.length} transaction(s)`,
            risk: highestRisk,
            transaction: related[0],
          },
        };
      }),
    ];

    const graphEdges: Edge[] = rows.map((row, index) => ({
      id: `edge-${row.id}`,
      source: `agent-${row.agent}`,
      target: `recipient-${row.recipient}`,
      label: `${row.id} · $${row.amount.toFixed(2)}`,
      animated: row.risk >= 70,
      style: {
        stroke: row.risk >= 70 ? '#ef5350' : '#20d9b1',
        strokeWidth: row.risk >= 70 ? 2.5 : 1.5,
      },
    }));

    return { nodes: graphNodes, edges: graphEdges };
  }, [rows]);

  const onNodeClick = (_: React.MouseEvent, node: Node<GraphNodeData>) => {
    setSelected(node.data.transaction ?? null);
  };

  return (
    <div>
      <div style={{
        height: 560,
        border: '1px solid #26384d',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          colorMode="dark"
        >
          <Background color="#26384d" gap={22} />
          <Controls />
          <MiniMap
            nodeColor={node => node.id.startsWith('recipient-') ? '#20d9b1' : '#8b7cff'}
            style={{ background: '#0b1523' }}
          />
        </ReactFlow>
      </div>

      {selected && (
        <div className="case-detail" style={{ marginTop: 12 }}>
          <strong>Selected transaction: {selected.id}</strong>
          <p>Agent: {selected.agent}</p>
          <p>Recipient: {selected.recipient}</p>
          <p>Amount: ${selected.amount.toFixed(2)}</p>
          <p>Risk: {selected.risk}/100</p>
          <p>Decision: {selected.status}</p>
          <button
            className="outline-btn"
            onClick={() => setSelected(null)}
          >
            Close details
          </button>
        </div>
      )}
    </div>
  );
}
