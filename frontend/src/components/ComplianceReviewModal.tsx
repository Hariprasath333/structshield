import React, { useState } from 'react';
import {
  ShieldAlert,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react';

// Mirrors the backend's RiskSignal record (detection/RiskSignal.java) —
// keep this in sync with SignalType.java if you add/remove signals there.
export type SignalName =
  | 'CLUSTER_SIZE'
  | 'TIME_SPACING'
  | 'NEAR_THRESHOLD'
  | 'ROUND_TOTAL'
  | 'DEVICE_CONSISTENCY';

export interface RiskSignal {
  name: SignalName;
  points: number;
  maxPoints: number;
  explanation: string;
}

export interface ClusterTransaction {
  id: string;
  amount: number;
  occurredAt: string;
}

export interface ReviewCluster {
  id: string;
  merchantName: string;
  payerHandle: string; // masked/display UPI handle only — no real personal identity claims
  totalAmount: number;
  transactionCount: number;
  windowStart: string;
  windowEnd: string;
  riskScore: number;
  status: 'OPEN' | 'REVIEWED' | 'DISMISSED';
  signals: RiskSignal[];
  transactions: ClusterTransaction[];
}

const SIGNAL_LABELS: Record<SignalName, string> = {
  CLUSTER_SIZE: 'Cluster size',
  TIME_SPACING: 'Time spacing',
  NEAR_THRESHOLD: 'Near-threshold amounts',
  ROUND_TOTAL: 'Round total',
  DEVICE_CONSISTENCY: 'Single device',
};

interface ComplianceReviewModalProps {
  cluster: ReviewCluster | null;
  onClose: () => void;
  // Both actions are internal status changes only — this modal makes no
  // external bank calls, generates no documents, and takes no enforcement
  // action itself. Any real freeze/escalation is a decision + process for
  // your compliance team to carry out outside this tool.
  onConfirm: (clusterId: string, note: string) => void;
  onDismiss: (clusterId: string, note: string) => void;
}

export const ComplianceReviewModal: React.FC<ComplianceReviewModalProps> = ({
  cluster,
  onClose,
  onConfirm,
  onDismiss,
}) => {
  const [note, setNote] = useState('');

  if (!cluster) return null;

  const riskLevel =
    cluster.riskScore >= 80 ? { label: 'Critical', classes: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50' } :
    cluster.riskScore >= 60 ? { label: 'High', classes: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' } :
                               { label: 'Medium', classes: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' };

  const sortedTxns = [...cluster.transactions].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#111622] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <ShieldAlert className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Review flagged cluster
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {cluster.merchantName} · payer {cluster.payerHandle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Total amount</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ₹{cluster.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Payments</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {cluster.transactionCount}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Risk score</span>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${riskLevel.classes}`}>
                {riskLevel.label} · {cluster.riskScore.toFixed(0)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Window</span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {new Date(cluster.windowStart).toLocaleTimeString()} – {new Date(cluster.windowEnd).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Signal breakdown — the actual "why" behind the score */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
              Why this was flagged
            </h3>
            <div className="space-y-1.5">
              {cluster.signals.map((signal) => (
                <div
                  key={signal.name}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"
                >
                  <div className="w-24 shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {SIGNAL_LABELS[signal.name]}
                  </div>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${Math.min((signal.points / signal.maxPoints) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="w-14 shrink-0 text-right text-xs font-mono text-slate-500 dark:text-slate-400">
                    +{signal.points.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Genuinely separate purchases (e.g. splitting a bill among friends) can trigger
              several of these signals too — that's why every flag goes through review
              before any action is taken.
            </p>
          </div>

          {/* Transaction timeline */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
              Payments in this cluster
            </h3>
            <ol className="space-y-1">
              {sortedTxns.map((t, i) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-1.5"
                >
                  <span className="text-slate-500 dark:text-slate-400">Payment {i + 1}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    ₹{t.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono">
                    {new Date(t.occurredAt).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Reviewer note */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5 block">
              Reviewer note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Optional — record your reasoning for the audit trail"
              className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Footer actions — both are internal status changes, nothing external */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            onClick={() => onDismiss(cluster.id, note)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            Dismiss (false positive)
          </button>
          <button
            onClick={() => onConfirm(cluster.id, note)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirm & escalate to compliance team
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComplianceReviewModal;
