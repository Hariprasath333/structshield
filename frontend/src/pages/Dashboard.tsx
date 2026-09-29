import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { DashboardSummary } from '../types';
import { StatCard } from '../components/StatCard';
import { RiskBadge } from '../components/RiskBadge';
import { LoadingState } from '../components/LoadingState';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Store,
  Gauge,
  Play,
  ArrowUpRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [injecting, setInjecting] = useState(false);
  const [injectMessage, setInjectMessage] = useState('');

  const fetchSummary = async () => {
    try {
      const response = await apiClient.get<DashboardSummary>('/dashboard/summary');
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 6000); // 6s polling for live stream updates
    return () => clearInterval(interval);
  }, []);

  const handleInjectSynthetic = async () => {
    setInjecting(true);
    setInjectMessage('');
    try {
      const res = await apiClient.post('/simulation/inject?count=25&structuringRatio=0.30');
      setInjectMessage(`Successfully injected ${res.data.totalInjected} transactions (${res.data.structuredTransactions} structured)! Stream detector evaluating...`);
      setTimeout(fetchSummary, 1500);
    } catch (err) {
      setInjectMessage('Failed to trigger simulation injection.');
    } finally {
      setInjecting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading StructShield compliance intelligence..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950/40 p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Near-Real-Time Stream Surveillance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Structuring Compliance Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Surfacing high-risk artificial micro-payment splits across UPI Person-to-Merchant (P2M) transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSummary}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleInjectSynthetic}
            disabled={injecting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            {injecting ? 'Injecting Stream...' : 'Inject Test Structuring Stream'}
          </button>
        </div>
      </div>

      {injectMessage && (
        <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-800 text-xs text-indigo-200 flex items-center justify-between animate-fadeIn">
          <span>{injectMessage}</span>
          <button onClick={() => setInjectMessage('')} className="text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Clusters"
          value={summary?.totalClusters || 0}
          icon={ShieldAlert}
          color="indigo"
        />
        <StatCard
          title="Open Flags"
          value={summary?.openFlags || 0}
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Reviewed"
          value={summary?.reviewedFlags || 0}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Dismissed"
          value={summary?.dismissedFlags || 0}
          icon={XCircle}
          color="amber"
        />
        <StatCard
          title="Monitored Merchants"
          value={summary?.monitoredMerchants || 0}
          icon={Store}
          color="indigo"
        />
        <StatCard
          title="Avg Risk Score"
          value={summary?.averageRiskScore ? `${summary.averageRiskScore}` : '0.0'}
          icon={Gauge}
          color="amber"
        />
      </div>

      {/* Recent Flags Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Recent Suspicious Clusters</h2>
            <p className="text-xs text-slate-400 mt-0.5">High-scoring candidates awaiting compliance verification</p>
          </div>
          <Link
            to="/flags"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View All Flags</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {summary?.recentFlags && summary.recentFlags.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4">Payer VPA</th>
                  <th className="py-3 px-4">Transactions</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {summary.recentFlags.map((flag) => (
                  <tr key={flag.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{flag.merchant.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{flag.merchant.upiId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                      {flag.payer.upiHandle}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-200">{flag.transactionCount} payments</span>
                      <span className="block text-[11px] text-slate-500">in rolling window</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      ₹{flag.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge score={flag.riskScore} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        flag.status === 'OPEN'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : flag.status === 'REVIEWED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {flag.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/flags/${flag.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold transition-colors"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-sm">
            No clusters currently flagged. Click "Inject Test Structuring Stream" to simulate high-risk traffic.
          </div>
        )}
      </div>
    </div>
  );
};
