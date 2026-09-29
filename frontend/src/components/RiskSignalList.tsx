import React from 'react';
import { RiskSignal } from '../types';
import { Layers, Clock, AlertTriangle, CircleDollarSign, Smartphone } from 'lucide-react';

interface RiskSignalListProps {
  signals: RiskSignal[];
}

export const RiskSignalList: React.FC<RiskSignalListProps> = ({ signals }) => {
  const getSignalIcon = (name: string) => {
    switch (name) {
      case 'CLUSTER_SIZE':
        return <Layers className="w-5 h-5 text-indigo-400" />;
      case 'TIME_SPACING':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'NEAR_THRESHOLD':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'ROUND_TOTAL':
        return <CircleDollarSign className="w-5 h-5 text-purple-400" />;
      case 'DEVICE_CONSISTENCY':
        return <Smartphone className="w-5 h-5 text-cyan-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getSignalTitle = (name: string) => {
    switch (name) {
      case 'CLUSTER_SIZE':
        return 'Micro-Payment Cluster Density';
      case 'TIME_SPACING':
        return 'Velocity & Rapid Timing Spacing';
      case 'NEAR_THRESHOLD':
        return 'Near ₹2,000 Threshold Proximity';
      case 'ROUND_TOTAL':
        return 'Round Invoice Amount Resemblance';
      case 'DEVICE_CONSISTENCY':
        return 'Hardware Device Fingerprint Consistency';
      default:
        return name;
    }
  };

  return (
    <div className="space-y-3">
      {signals.map((signal, idx) => {
        const percentage = Math.min(100, Math.round((signal.points / signal.maxPoints) * 100));
        const isTriggered = signal.points > 0;

        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border transition-all ${
              isTriggered
                ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                : 'bg-slate-900/40 border-slate-800/40 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-slate-800/80">
                  {getSignalIcon(signal.name)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">
                    {getSignalTitle(signal.name)}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{signal.explanation}</p>
                </div>
              </div>
              <div className="text-right whitespace-nowrap">
                <span className={`text-sm font-bold ${isTriggered ? 'text-indigo-400' : 'text-slate-500'}`}>
                  +{signal.points.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 font-normal"> / {signal.maxPoints.toFixed(0)} pts</span>
              </div>
            </div>

            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  percentage > 75 ? 'bg-rose-500' : percentage > 40 ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
