import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Search, 
  Bell, 
  User as UserIcon, 
  LogOut,
  SlidersHorizontal,
  Activity
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AppHeaderProps {
  onOpenReview?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenReview }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isNetwork = location.pathname.startsWith('/network');
  const isFlags = location.pathname.startsWith('/flags') && !isNetwork;
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <header className="bg-white dark:bg-[#12161f] border-b border-slate-200 dark:border-slate-800 shrink-0 z-30 select-none">
      {/* 1. Mac-style Titlebar */}
      <div className="h-11 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#0f131c]">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 group" title="Return to Dashboard Home">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
              StructShield
            </span>
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
              COMPLIANCE DESK
            </span>
          </Link>
        </div>

        {/* Center: System Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px] font-mono text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">Kafka Ingestion Stream</span>
          <span className="text-slate-400 dark:text-slate-600">•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">ONLINE</span>
          <span className="text-slate-400 dark:text-slate-600">•</span>
          <span className="text-slate-500 dark:text-slate-400">24ms p95</span>
        </div>

        {/* Right: Search, Notifications & User */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search merchant, VPA, UUID..."
              className="w-56 pl-8 pr-10 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono bg-white dark:bg-slate-700 px-1 py-0.5 rounded text-slate-400 border border-slate-200 dark:border-slate-600">
              ⌘K
            </span>
          </div>

          {/* Alert Bell */}
          <button 
            onClick={onOpenReview}
            className="relative p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Pending Flag Reviews"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
              3
            </span>
          </button>

          {/* Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs">
              V
            </div>
            <div className="hidden lg:block text-left">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                Officer V.
              </span>
              <span className="text-[10px] text-slate-400 block leading-tight">
                Compliance Desk
              </span>
            </div>

            <button
              onClick={() => logout()}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Secondary Navigation Tabs Bar */}
      <div className="h-11 px-6 flex items-center justify-between bg-white dark:bg-[#12161f]">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1">
          <Link
            to="/flags"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isFlags
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            Cluster List
          </Link>

          <Link
            to="/network"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              isNetwork
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <span>Network Graph</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${isNetwork ? 'bg-white/20 text-white' : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'}`}>
              LIVE
            </span>
          </Link>

          <Link
            to="/dashboard"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isDashboard
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            Flow Metrics
          </Link>
        </div>

        {/* Active Inspection Breadcrumb */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Network Inspection:</span>
          <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/60">
            Apex Luxury Retailers
          </span>
        </div>
      </div>
    </header>
  );
};
