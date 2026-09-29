import React from 'react';
import { TransactionItem } from '../types';
import { Hash, Smartphone } from 'lucide-react';

interface ClusterTimelineProps {
  transactions: TransactionItem[];
}

export const ClusterTimeline: React.FC<ClusterTimelineProps> = ({ transactions }) => {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {sorted.map((tx, idx) => {
        const time = new Date(tx.occurredAt).toLocaleTimeString();
        let gapText = '';
        if (idx > 0) {
          const prevTime = new Date(sorted[idx - 1].occurredAt).getTime();
          const currTime = new Date(tx.occurredAt).getTime();
          const diffSec = Math.round((currTime - prevTime) / 1000);
          gapText = `+${diffSec}s later`;
        }

        return (
          <div key={tx.id} className="relative group">
            {/* Timeline bullet */}
            <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-indigo-500 bg-slate-950 group-hover:scale-125 transition-transform" />

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Tx #{idx + 1}
                  </span>
                  <span className="text-xs text-slate-400">{time}</span>
                  {gapText && (
                    <span className="text-xs font-medium text-amber-400 bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.5 rounded">
                      {gapText}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-slate-100">
                    ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-500" />
                  <span>Invoice: {tx.invoiceRef || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">Device: {tx.deviceHash ? tx.deviceHash.substring(0, 16) + '...' : 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
