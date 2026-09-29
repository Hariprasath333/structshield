import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Smartphone, 
  Building2, 
  User, 
  Landmark, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
  Filter
} from 'lucide-react';

interface LinkedAccountsGraphProps {
  onOpenReview?: () => void;
}

interface NodeData {
  id: string;
  label: string;
  sublabel: string;
  type: 'merchant' | 'payer' | 'device' | 'escrow';
  x: number;
  y: number;
  amount?: string;
  status?: string;
  details: Record<string, string>;
}

export const LinkedAccountsGraph: React.FC<LinkedAccountsGraphProps> = ({
  onOpenReview,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [selectedNode, setSelectedNode] = useState<string | null>('merchant');
  const [showDeviceRing, setShowDeviceRing] = useState<boolean>(true);

  const nodes: NodeData[] = [
    {
      id: 'merchant',
      label: 'Apex Retail Services',
      sublabel: 'apexretail@upi • MCC 5944',
      type: 'merchant',
      x: 450,
      y: 280,
      amount: '₹42,85,910.00',
      status: 'UNDER REVIEW',
      details: {
        'Merchant VPA': 'apexretail@upi',
        'Category': 'MCC 5944 (Retail Goods)',
        'Settlement A/c': 'Nodal Escrow 0021-XXXX',
        'Window Volume': '₹5,500.00 (#CL-9082)',
        'Flagged Structuring': '3 split transactions near ₹2,000 threshold',
        'Risk Status': 'Elevated Cluster Risk (87.3/100)'
      }
    },
    {
      id: 'payer1',
      label: 'Payer Account P1',
      sublabel: 'payer.alpha@okhdfcbank',
      type: 'payer',
      x: 200,
      y: 160,
      amount: '₹1,950.00',
      details: {
        'Payer Handle': 'payer.alpha@okhdfcbank',
        'Transaction ID': 'ade1d11e-84b2-4912',
        'Amount': '₹1,950.00 (Near ₹2,000 threshold)',
        'Timestamp': '14:02:11 IST',
        'Velocity Spacing': '22s average gap',
        'Device Fingerprint': 'df_ios_8b2a19f9'
      }
    },
    {
      id: 'payer2',
      label: 'Payer Account P2',
      sublabel: 'payer.beta@paytm',
      type: 'payer',
      x: 200,
      y: 400,
      amount: '₹1,920.00',
      details: {
        'Payer Handle': 'payer.beta@paytm',
        'Transaction ID': 'a4933e35-9011-4fa2',
        'Amount': '₹1,920.00 (Near ₹2,000 threshold)',
        'Timestamp': '14:03:04 IST',
        'Velocity Spacing': '18s average gap',
        'Device Fingerprint': 'df_ios_8b2a19f9 (Match P1)'
      }
    },
    {
      id: 'payer3',
      label: 'Payer Account P3',
      sublabel: 'payer.gamma@axisbank',
      type: 'payer',
      x: 700,
      y: 160,
      amount: '₹1,630.00',
      details: {
        'Payer Handle': 'payer.gamma@axisbank',
        'Transaction ID': '389bf006-2189-4bc1',
        'Amount': '₹1,630.00',
        'Timestamp': '14:04:22 IST',
        'Sum Target': 'Combined total: ₹5,500.00 (Multiple of ₹500)'
      }
    },
    {
      id: 'device',
      label: 'Hardware Fingerprint Node',
      sublabel: 'UUID: df_ios_8b2a19f9',
      type: 'device',
      x: 80,
      y: 280,
      status: 'CO-LOCATED DEVICE MATCH',
      details: {
        'Hardware Model': 'Mobile Client (iOS/Android)',
        'OS Version': 'App Build 21E236',
        'Device Hash': 'df_ios_8b2a19f9',
        'Linked Accounts': '2 VPAs linked through common device header',
        'Risk Signal Weight': '+10.0 pts (Device Consistency)'
      }
    },
    {
      id: 'escrow',
      label: 'Settlement Escrow Pool',
      sublabel: 'Nodal Settlement Account',
      type: 'escrow',
      x: 700,
      y: 400,
      amount: '₹42,85,910.00',
      details: {
        'Escrow Account': 'Nodal Pool 0021-XXXX',
        'Gross Batch Balance': '₹42,85,910.00',
        'Status': 'Operational Internal Pool'
      }
    }
  ];

  const activeNodeData = nodes.find(n => n.id === selectedNode) || nodes[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] dark:bg-[#0d1117] text-slate-900 dark:text-slate-100 overflow-hidden font-['Inter',sans-serif]">
      {/* Top Topology Context Bar */}
      <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#12161f]/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
            Cluster Topology Graph
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Apex Retail Services · Cluster #CL-9082
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900/50">
            RISK: 87.3
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenReview && (
            <button
              onClick={onOpenReview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Review Cluster</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas & Inspector Split */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* SVG Network Graph Canvas */}
        <div className="flex-1 relative overflow-hidden bg-slate-900/5 dark:bg-slate-950/40">
          {/* Controls Overlay */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 bg-white dark:bg-[#161c28] border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-lg">
            <button
              onClick={() => setZoom(prev => Math.min(prev + 0.15, 1.8))}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.6))}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="w-full h-[1px] bg-slate-200 dark:bg-slate-800 my-0.5" />
            <button
              onClick={() => setShowDeviceRing(prev => !prev)}
              className={`p-1.5 rounded-lg transition-colors ${
                showDeviceRing 
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-400 hover:bg-slate-100'
              }`}
              title="Toggle Shared Hardware Ring"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Legend / Risk Flag Chip */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/90 dark:bg-[#161c28]/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-md">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
              Linked Accounts: 3 Payments • Shared Hardware Hash
            </span>
          </div>

          {/* Interactive SVG Diagram */}
          <svg 
            className="w-full h-full cursor-grab active:cursor-grabbing" 
            viewBox="0 0 900 560"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
          >
            <defs>
              <linearGradient id="edgeGradRed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="edgeGradDevice" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.7" />
              </linearGradient>
            </defs>

            {/* Connecting Edges */}
            {showDeviceRing && (
              <>
                <line x1="80" y1="280" x2="200" y2="160" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 4" opacity="0.7" />
                <line x1="80" y1="280" x2="200" y2="400" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 4" opacity="0.7" />
              </>
            )}

            {/* Payer 1 -> Merchant */}
            <line x1="200" y1="160" x2="450" y2="280" stroke="url(#edgeGradRed)" strokeWidth="3" opacity="0.85" />
            <circle cx="325" cy="220" r="14" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
            <text x="325" y="224" textAnchor="middle" fill="#f8fafc" fontSize="9" fontFamily="monospace" fontWeight="bold">₹1,950</text>

            {/* Payer 2 -> Merchant */}
            <line x1="200" y1="400" x2="450" y2="280" stroke="url(#edgeGradRed)" strokeWidth="3" opacity="0.85" />
            <circle cx="325" cy="340" r="14" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
            <text x="325" y="344" textAnchor="middle" fill="#f8fafc" fontSize="9" fontFamily="monospace" fontWeight="bold">₹1,920</text>

            {/* Payer 3 -> Merchant */}
            <line x1="700" y1="160" x2="450" y2="280" stroke="url(#edgeGradRed)" strokeWidth="2.5" opacity="0.85" />
            <circle cx="575" cy="220" r="14" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="575" y="224" textAnchor="middle" fill="#f8fafc" fontSize="9" fontFamily="monospace" fontWeight="bold">₹1,630</text>

            {/* Merchant -> Escrow */}
            <line x1="450" y1="280" x2="700" y2="400" stroke="#64748b" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />

            {/* Nodes */}
            {/* 1. Device Node */}
            {showDeviceRing && (
              <g 
                transform="translate(80, 280)" 
                className="cursor-pointer"
                onClick={() => setSelectedNode('device')}
              >
                <circle r="36" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="2.5" opacity="0.9" />
                <Smartphone x="-12" y="-12" width="24" height="24" className="text-violet-400" />
                <text y="48" textAnchor="middle" fill="#c4b5fd" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                  Hardware Hash
                </text>
                <text y="62" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontFamily="monospace">
                  df_ios_8b2a19f9
                </text>
              </g>
            )}

            {/* 2. Payer 1 Node */}
            <g 
              transform="translate(200, 160)" 
              className="cursor-pointer"
              onClick={() => setSelectedNode('payer1')}
            >
              <circle r="32" fill="#1e293b" stroke="#ef4444" strokeWidth={selectedNode === 'payer1' ? 4 : 2} />
              <User x="-10" y="-10" width="20" height="20" className="text-rose-400" />
              <text y="44" textAnchor="middle" fill="#f1f5f9" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                Payer Account P1
              </text>
              <text y="58" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                ₹1,950 · 14:02:11
              </text>
            </g>

            {/* 3. Payer 2 Node */}
            <g 
              transform="translate(200, 400)" 
              className="cursor-pointer"
              onClick={() => setSelectedNode('payer2')}
            >
              <circle r="32" fill="#1e293b" stroke="#ef4444" strokeWidth={selectedNode === 'payer2' ? 4 : 2} />
              <User x="-10" y="-10" width="20" height="20" className="text-rose-400" />
              <text y="44" textAnchor="middle" fill="#f1f5f9" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                Payer Account P2
              </text>
              <text y="58" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                ₹1,920 · 14:03:04
              </text>
            </g>

            {/* 4. Payer 3 Node */}
            <g 
              transform="translate(700, 160)" 
              className="cursor-pointer"
              onClick={() => setSelectedNode('payer3')}
            >
              <circle r="32" fill="#1e293b" stroke="#f59e0b" strokeWidth={selectedNode === 'payer3' ? 4 : 2} />
              <User x="-10" y="-10" width="20" height="20" className="text-amber-400" />
              <text y="44" textAnchor="middle" fill="#f1f5f9" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                Payer Account P3
              </text>
              <text y="58" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                ₹1,630 · 14:04:22
              </text>
            </g>

            {/* 5. Center Merchant Node */}
            <g 
              transform="translate(450, 280)" 
              className="cursor-pointer"
              onClick={() => setSelectedNode('merchant')}
            >
              <circle r="52" fill="#0f172a" stroke="#3b82f6" strokeWidth={selectedNode === 'merchant' ? 5 : 3} />
              <Building2 x="-14" y="-14" width="28" height="28" className="text-blue-400" />
              <text y="68" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
                Apex Retail Services
              </text>
              <text y="82" textAnchor="middle" fill="#60a5fa" fontSize="10" fontFamily="monospace">
                apexretail@upi
              </text>
            </g>

            {/* 6. Settlement Escrow Node */}
            <g 
              transform="translate(700, 400)" 
              className="cursor-pointer"
              onClick={() => setSelectedNode('escrow')}
            >
              <circle r="34" fill="#0f172a" stroke="#64748b" strokeWidth={selectedNode === 'escrow' ? 4 : 2} strokeDasharray="3 3" />
              <Landmark x="-11" y="-11" width="22" height="22" className="text-slate-400" />
              <text y="46" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="semibold" fontFamily="sans-serif">
                Settlement Escrow
              </text>
              <text y="60" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                Nodal Pool
              </text>
            </g>
          </svg>

          {/* Bottom Status Ribbon */}
          <div className="absolute bottom-0 left-0 right-0 h-10 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#12161f]/90 backdrop-blur-md px-6 flex items-center justify-between z-10 text-xs font-mono">
            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300 truncate">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                apexretail@upi
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>Total Structuring: <strong className="text-rose-600 dark:text-rose-400">₹5,500.00</strong></span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>Linked Accounts: <strong>3 Transactions</strong></span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="hidden sm:inline">Device: <strong>df_ios_8b2a19f9</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 font-bold text-[10px]">
                UNDER REVIEW
              </span>
            </div>
          </div>
        </div>

        {/* Right Side Entity Inspector Drawer */}
        <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-5 flex flex-col justify-between overflow-y-auto shrink-0 z-10 shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Entity Intelligence
                </h4>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {activeNodeData.type}
              </span>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {activeNodeData.label}
              </h3>
              <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-0.5 break-all">
                {activeNodeData.sublabel}
              </p>
              {activeNodeData.amount && (
                <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Flagged Exposure</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                    {activeNodeData.amount}
                  </span>
                </div>
              )}
            </div>

            {/* Attribute List */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Cluster Attributes
              </span>
              {Object.entries(activeNodeData.details).map(([key, value]) => (
                <div key={key} className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-mono">{key}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 break-words mt-0.5 block">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800">
            {onOpenReview && (
              <button
                onClick={onOpenReview}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Open Compliance Review</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedAccountsGraph;
