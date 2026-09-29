import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { MerchantInfo, PagedResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { LoadingState } from '../components/LoadingState';
import { Store, ArrowUpRight } from 'lucide-react';

export const MerchantsList: React.FC = () => {
  const [data, setData] = useState<PagedResponse<MerchantInfo> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const res = await apiClient.get<PagedResponse<MerchantInfo>>('/merchants?page=0&size=20');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load merchants', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMerchants();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Monitored UPI Merchants
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Registered business entities monitored for transaction structuring patterns.
        </p>
      </div>

      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <LoadingState message="Loading monitored merchants..." />
        ) : data?.content && data.content.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/70 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Merchant Name</th>
                  <th className="py-3 px-4">UPI VPA</th>
                  <th className="py-3 px-4">Aggregate Risk Score</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.content.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-100 flex items-center gap-2.5">
                      <Store className="w-4 h-4 text-indigo-400" />
                      <span>{m.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{m.upiId}</td>
                    <td className="py-3.5 px-4">
                      <RiskBadge score={m.aggregateRiskScore} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/merchants/${m.id}`}
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Profile <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-sm">
            No merchants registered yet. Merchants are auto-registered upon incoming transaction events.
          </div>
        )}
      </div>
    </div>
  );
};
