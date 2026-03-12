import React from 'react';

interface RiskDisplayProps {
  risk: number;
  hidden?: boolean;
}

export function RiskDisplay({ risk, hidden = false }: RiskDisplayProps) {
  if (hidden) return null;

  return (
    <div className="risk-display">
      <span className="risk-label">RISK</span>
      <span className="risk-value">{risk}</span>
    </div>
  );
}

