import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { FlagDetail } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { RiskSignalList } from '../components/RiskSignalList';
import { ClusterTimeline } from '../components/ClusterTimeline';
import { ComplianceReviewModal, ReviewCluster } from '../components/ComplianceReviewModal';
import { LoadingState } from '../components/LoadingState';
import {
  ArrowLeft,
  Store,
  User,
  Clock,
  CircleDollarSign,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

export const ClusterDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [cluster, setCluster] = useState<FlagDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await apiClient.get<FlagDetail>(`/flags/${id}`);
      setCluster(res.data);
    } catch (err) {
      console.error('Failed to load cluster details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const reviewClusterData: ReviewCluster | null = cluster ? {
    id: cluster.id,
    merchantName: cluster.merchant.name,
    payerHandle: cluster.payer.upiHandle,
    totalAmount: cluster.totalAmount,
    transactionCount: cluster.transactionCount,
    windowStart: cluster.windowStart,
    windowEnd: cluster.windowEnd,
    riskScore: cluster.riskScore,
    status: cluster.status,
    signals: cluster.signals || [],
    transactions: (cluster.transactions || []).map(t => ({
      id: t.id,
      amount: t.amount,
      occurredAt: t.occurredAt
    }))
  } : null;

  const handleConfirmReview = async (clusterId: string, note: string) => {
    try {
      await apiClient.patch(`/flags/${clusterId}/review`, { status: 'REVIEWED', reviewNotes: note });
      fetchDetail();
    } catch (err) {
      console.error('Failed to submit review', err);
    } finally {
      setIsReviewModalOpen(false);
    }
  };

  const handleDismissReview = async (clusterId: string, note: string) => {
    try {
      await apiClient.patch(`/flags/${clusterId}/review`, { status: 'DISMISSED', reviewNotes: note });
      fetchDetail();
    } catch (err) {
      console.error('Failed to dismiss review', err);
    } finally {
      setIsReviewModalOpen(false);
    }
  };

  if (loading) {
    return <LoadingState message="Reconstructing cluster evidence & signal timeline..." />;
  }

  if (!cluster) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <p className="text-slate-400">Cluster not found.</p>
        <Link to="/flags" className="mt-4 inline-block text-indigo-400 hover:underline text-sm">
          ← Back to Registry
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation & Header */}
      <div>
        <Link
          to="/flags"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Flag Registry</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <RiskBadge score={cluster.riskScore} />
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                cluster.status === 'OPEN'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : cluster.status === 'REVIEWED'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              }`}>
                {cluster.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Cluster Investigation #{cluster.id.substring(0, 8)}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Detected on {new Date(cluster.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Decision</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Banner if Reviewed */}
      {cluster.status !== 'OPEN' && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">
              Decision Recorded by {cluster.reviewedBy || 'Analyst'} on{' '}
              {cluster.reviewedAt ? new Date(cluster.reviewedAt).toLocaleString() : 'N/A'}:
            </span>
            <p className="text-slate-400 mt-1 italic">
              "{cluster.reviewNotes || 'No notes provided'}"
            </p>
          </div>
        </div>
      )}

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Store className="w-4 h-4 text-indigo-400" />
            <span>Target Merchant</span>
          </div>
          <div className="text-sm font-bold text-slate-100 truncate">{cluster.merchant.name}</div>
          <div className="text-xs font-mono text-slate-500 truncate">{cluster.merchant.upiId}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <User className="w-4 h-4 text-cyan-400" />
            <span>Originating Payer</span>
          </div>
          <div className="text-sm font-mono font-semibold text-slate-200 truncate">{cluster.payer.upiHandle}</div>
          <div className="text-xs text-slate-500 truncate">Device: {cluster.payer.deviceHash ? cluster.payer.deviceHash.substring(0, 14) + '...' : 'N/A'}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <CircleDollarSign className="w-4 h-4 text-emerald-400" />
            <span>Total Clustered Amount</span>
          </div>
          <div className="text-sm font-extrabold text-slate-100">
            ₹{cluster.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500">{cluster.transactionCount} micro-payments</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Rolling Window</span>
          </div>
          <div className="text-sm font-semibold text-slate-200">
            {new Date(cluster.windowStart).toLocaleTimeString()} – {new Date(cluster.windowEnd).toLocaleTimeString()}
          </div>
          <div className="text-xs text-slate-500">5-minute sliding bracket</div>
        </div>
      </div>

      {/* Main 2-Column Section: Left = Explainable Signals, Right = Transaction Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Signals Breakdown */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Explainable Risk Signals</h2>
              <p className="text-xs text-slate-400 mt-0.5">Mathematical contributions to the {cluster.riskScore.toFixed(1)} risk score</p>
            </div>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <RiskSignalList signals={cluster.signals} />
        </div>

        {/* Right Column: Transaction Timeline */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Constituent Transactions Timeline</h2>
              <p className="text-xs text-slate-400 mt-0.5">Micro-payments ordered chronologically within window</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
              {cluster.transactions.length} Events
            </span>
          </div>

          <ClusterTimeline transactions={cluster.transactions} />
        </div>
      </div>

      {/* Internal Compliance Review Modal */}
      {isReviewModalOpen && (
        <ComplianceReviewModal
          cluster={reviewClusterData}
          onClose={() => setIsReviewModalOpen(false)}
          onConfirm={handleConfirmReview}
          onDismiss={handleDismissReview}
        />
      )}
    </div>
  );
};
