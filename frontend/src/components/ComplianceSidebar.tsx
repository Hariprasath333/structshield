import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Radar, 
  Activity, 
  AlertOctagon, 
  Clock, 
  CheckCheck, 
  Network, 
  Store, 
  Users, 
  Terminal, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface ComplianceSidebarProps {
  onOpenReview?: (clusterId?: string) => void;
}

export const ComplianceSidebar: React.FC<ComplianceSidebarProps> = ({
  onOpenReview,
}) => {
  const location = useLocation();

  const isNetwork = location.pathname.startsWith('/network');
  const isFlags = location.pathname.startsWith('/flags') && !isNetwork;
  const isMerchants = location.pathname.startsWith('/merchants');
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <aside className="w-64 bg-white dark:bg-[#111622] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 select-none overflow-y-auto">
      <div className="p-4 space-y-6">

        {/* Section 1: COMPLIANCE MONITORING */}
        <div>
          <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-2 px-2.5">
            COMPLIANCE MONITORING
          </div>
          <div className="space-y-1">
            <Link
              to="/flags"
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isFlags
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Radar className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span>Live Cluster Stream</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                34
              </span>
            </Link>

            <Link
              to="/dashboard"
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isDashboard
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-slate-400" />
                <span>Velocity Trends</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </Link>
          </div>
        </div>

        {/* Section 2: RISK DISPOSITION */}
        <div>
          <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-2 px-2.5">
            RISK DISPOSITION
          </div>
          <div className="space-y-1">
            <Link
              to="/flags?status=OPEN"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="w-4 h-4 text-rose-500" />
                <span>Flagged Structuring</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900/50">
                24
              </span>
            </Link>

            <Link
              to="/flags?status=OPEN"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Pending Review</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-900/50">
                7
              </span>
            </Link>

            <Link
              to="/flags?status=REVIEWED"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <CheckCheck className="w-4 h-4 text-slate-400" />
                <span>Audited / Closed</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                137
              </span>
            </Link>
          </div>
        </div>

        {/* Section 3: INVESTIGATION WORKBENCH */}
        <div>
          <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-2 px-2.5">
            INVESTIGATION WORKBENCH
          </div>
          <div className="space-y-1">
            {/* Linked Accounts Graph - Replaces Mule Ring Network Graph */}
            <Link
              to="/network"
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isNetwork
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-1 ring-blue-500'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Network className="w-4 h-4 text-white" />
                <span>Linked Accounts Graph</span>
              </div>
              <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded-md ${
                isNetwork 
                  ? 'bg-white/20 text-white' 
                  : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
              }`}>
                LIVE
              </span>
            </Link>

            <Link
              to="/merchants"
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isMerchants
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4 text-slate-400" />
                <span>Monitored Merchants</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                12
              </span>
            </Link>

            <Link
              to="/flags"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Payer Directory</span>
              </div>
              <span className="text-slate-400">›</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Bottom Compliance Intelligence Widget */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0e131d]">
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161c28] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-500" /> Structuring Alert
            </span>
            <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 font-bold">
              NEEDS REVIEW
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
            Cluster detected with multiple micro-payments near ceiling within rolling 5min window.
          </p>
          <button
            onClick={() => onOpenReview && onOpenReview()}
            className="mt-2.5 w-full text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 uppercase tracking-wider cursor-pointer"
          >
            <span>REVIEW CLUSTER</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ComplianceSidebar;
