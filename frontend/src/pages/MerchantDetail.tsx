import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { MerchantDetail as MerchantDetailType } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { LoadingState } from '../components/LoadingState';
import { ArrowLeft, Store, ArrowUpRight } from 'lucide-react';

export const MerchantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [merchant, setMerchant] = useState<MerchantDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMerchant = async () => {
      try {
        const res = await apiClient.get<MerchantDetailType>(`/merchants/${id}/risk`);
        setMerchant(res.data);
      } catch (err) {
        console.error('Failed to load merchant', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMerchant();
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading merchant risk profile..." />;
  }

  if (!merchant) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <p className="text-slate-400">Merchant not found.</p>
        <Link to="/merchants" className="mt-4 inline-block text-indigo-400 hover:underline text-sm">
          ← Back to Merchants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Link
          to="/merchants"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Monitored Merchants</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{merchant.name}</h1>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{merchant.upiId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">
                Aggregate Risk
              </span>
              <RiskBadge score={merchant.aggregateRiskScore} />
            </div>
          </div>
        </div>
      </div>

      {/* Historical Flagged Clusters */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-lg font-bold text-slate-100 mb-1">Historical Flagged Clusters</h2>
        <p className="text-xs text-slate-400 mb-6">Past structuring detections associated with this merchant VPA</p>

        {merchant.recentClusters && merchant.recentClusters.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Payer VPA</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Transactions</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Detected At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {merchant.recentClusters.map((cluster) => (
                  <tr key={cluster.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                      {cluster.payer.upiHandle}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      ₹{cluster.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">{cluster.transactionCount} payments</td>
                    <td className="py-3.5 px-4"><RiskBadge score={cluster.riskScore} /></td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        cluster.status === 'OPEN'
                          ? 'bg-rose-500/10 text-rose-400'
                          : cluster.status === 'REVIEWED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {cluster.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(cluster.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/flags/${cluster.id}`}
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Inspect <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-sm">
            No historical flags recorded for this merchant.
          </div>
        )}
      </div>
    </div>
  );
};
