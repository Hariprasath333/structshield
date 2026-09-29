import React from 'react';

interface RiskBadgeProps {
  score: number;
  showText?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score, showText = true }) => {
  let colorClasses = 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30';
  let label = 'Low Risk';

  if (score >= 80) {
    colorClasses = 'bg-rose-950/80 text-rose-400 border-rose-500/30 animate-pulse';
    label = 'Critical Risk';
  } else if (score >= 70) {
    colorClasses = 'bg-amber-950/80 text-amber-400 border-amber-500/30';
    label = 'High Risk';
  } else if (score >= 40) {
    colorClasses = 'bg-yellow-950/80 text-yellow-400 border-yellow-500/30';
    label = 'Moderate';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      <span>{score.toFixed(1)}</span>
      {showText && <span className="opacity-80 font-normal">({label})</span>}
    </span>
  );
};
