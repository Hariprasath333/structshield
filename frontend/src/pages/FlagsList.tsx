import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { FlagItem, PagedResponse, ClusterStatus, FlagDetail } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { LoadingState } from '../components/LoadingState';
import { ComplianceReviewModal, ReviewCluster } from '../components/ComplianceReviewModal';
import { Filter, ArrowUpDown, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';

export const FlagsList: React.FC = () => {
  const [data, setData] = useState<PagedResponse<FlagItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<ClusterStatus | ''>('');
  const [minRisk, setMinRisk] = useState<number | ''>('');
  const [sort, setSort] = useState('riskScore,desc');

  // Review modal state
  const [reviewClusterData, setReviewClusterData] = useState<ReviewCluster | null>(null);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', '15');
      params.append('sort', sort);
      if (status) params.append('status', status);
      if (minRisk !== '') params.append('minRisk', minRisk.toString());

      const res = await apiClient.get<PagedResponse<FlagItem>>(`/flags?${params.toString()}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load flags', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [page, status, minRisk, sort]);

  const handleOpenReviewModal = async (flag: FlagItem) => {
    try {
      const res = await apiClient.get<FlagDetail>(`/flags/${flag.id}`);
      const d = res.data;
      setReviewClusterData({
        id: d.id,
        merchantName: d.merchant.name,
        payerHandle: d.payer.upiHandle,
        totalAmount: d.totalAmount,
        transactionCount: d.transactionCount,
        windowStart: d.windowStart,
        windowEnd: d.windowEnd,
        riskScore: d.riskScore,
        status: d.status,
        signals: d.signals || [],
        transactions: (d.transactions || []).map(t => ({
          id: t.id,
          amount: t.amount,
          occurredAt: t.occurredAt
        }))
      });
    } catch {
      setReviewClusterData({
        id: flag.id,
        merchantName: flag.merchant.name,
        payerHandle: flag.payer.upiHandle,
        totalAmount: flag.totalAmount,
        transactionCount: flag.transactionCount,
        windowStart: flag.windowStart,
        windowEnd: flag.windowEnd,
        riskScore: flag.riskScore,
        status: flag.status,
        signals: [],
        transactions: []
      });
    }
  };

  const handleConfirmReview = async (clusterId: string, note: string) => {
    try {
      await apiClient.patch(`/flags/${clusterId}/review`, { status: 'REVIEWED', reviewNotes: note });
      fetchFlags();
    } catch (err) {
      console.error('Failed to submit review', err);
    } finally {
      setReviewClusterData(null);
    }
  };

  const handleDismissReview = async (clusterId: string, note: string) => {
    try {
      await apiClient.patch(`/flags/${clusterId}/review`, { status: 'DISMISSED', reviewNotes: note });
      fetchFlags();
    } catch (err) {
      console.error('Failed to dismiss review', err);
    } finally {
      setReviewClusterData(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Compliance Flag Registry
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review, investigate, and record decisions on clusters flagged by the structuring detection engine.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>Filters:</span>
          </div>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as ClusterStatus | ''); setPage(0); }}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN Only</option>
            <option value="REVIEWED">REVIEWED Only</option>
            <option value="DISMISSED">DISMISSED Only</option>
          </select>

          <select
            value={minRisk}
            onChange={(e) => { setMinRisk(e.target.value === '' ? '' : Number(e.target.value)); setPage(0); }}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Any Risk Score</option>
            <option value="80">Critical Risk (≥ 80)</option>
            <option value="70">Threshold Crossed (≥ 70)</option>
            <option value="50">Moderate (≥ 50)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="riskScore,desc">Highest Risk First</option>
            <option value="createdAt,desc">Most Recent First</option>
            <option value="totalAmount,desc">Largest Total Amount</option>
            <option value="transactionCount,desc">Most Transactions</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <LoadingState message="Fetching flagged clusters..." />
        ) : data?.content && data.content.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-950/70 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Merchant</th>
                    <th className="py-3 px-4">Payer VPA</th>
                    <th className="py-3 px-4">Transactions</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Risk Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Detected At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.content.map((flag) => (
                    <tr key={flag.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link to={`/merchants/${flag.merchant.id}`} className="font-semibold text-slate-100 hover:text-indigo-400 transition-colors">
                          {flag.merchant.name}
                        </Link>
                        <div className="text-xs text-slate-400 font-mono">{flag.merchant.upiId}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                        {flag.payer.upiHandle}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-200">{flag.transactionCount} payments</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        ₹{flag.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <RiskBadge score={flag.riskScore} />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          flag.status === 'OPEN'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : flag.status === 'REVIEWED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {flag.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {new Date(flag.createdAt).toLocaleDateString()} {new Date(flag.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenReviewModal(flag)}
                          title="Review Cluster"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium border border-blue-500/30 transition-colors cursor-pointer"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          Review
                        </button>
                        <Link
                          to={`/flags/${flag.id}`}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                Showing page <span className="font-semibold text-slate-200">{data.page + 1}</span> of{' '}
                <span className="font-semibold text-slate-200">{data.totalPages}</span> ({data.totalElements} total clusters)
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={data.page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={data.last}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-slate-500 text-sm">
            No clusters match the selected filter criteria.
          </div>
        )}
      </div>

      {/* Internal Compliance Review Modal */}
      <ComplianceReviewModal
        cluster={reviewClusterData}
        onClose={() => setReviewClusterData(null)}
        onConfirm={handleConfirmReview}
        onDismiss={handleDismissReview}
      />
    </div>
  );
};
