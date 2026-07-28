import React from 'react';
import { SKStats, StatusFilter } from '../types';
import { FileCheck, ShieldAlert, AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface StatsOverviewProps {
  stats: SKStats;
  activeFilter: StatusFilter;
  onSelectFilter: (filter: StatusFilter) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, activeFilter, onSelectFilter }) => {
  const cards = [
    {
      key: 'Semua' as StatusFilter,
      label: 'Total Surat Keputusan',
      value: stats.total,
      icon: FileCheck,
      color: 'blue',
      activeBorder: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
    },
    {
      key: 'Aktif' as StatusFilter,
      label: 'SK Masih Aktif',
      value: stats.aktif,
      icon: Clock,
      color: 'emerald',
      activeBorder: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
    },
    {
      key: 'Segera Kadaluarsa' as StatusFilter,
      label: 'Segera Kadaluarsa (≤7 Hari)',
      value: stats.segeraKadaluarsa,
      icon: AlertCircle,
      color: 'amber',
      badge: stats.segeraKadaluarsa > 0 ? 'Penting' : undefined,
      activeBorder: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-amber-500/20'
    },
    {
      key: 'Kadaluarsa' as StatusFilter,
      label: 'Kadaluarsa / Expired',
      value: stats.kadaluarsa,
      icon: ShieldAlert,
      color: 'rose',
      activeBorder: 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 ring-2 ring-rose-500/20'
    },
    {
      key: 'Terkirim' as StatusFilter,
      label: 'Notifikasi Terkirim',
      value: stats.terkirim,
      icon: CheckCircle,
      color: 'indigo',
      activeBorder: 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 my-6" id="stats-overview-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.key;

        return (
          <button
            key={card.key}
            onClick={() => onSelectFilter(card.key)}
            id={`stat-card-${card.key.toLowerCase().replace(/\s+/g, '-')}`}
            className={`text-left p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all shadow-xs hover:shadow-md cursor-pointer relative overflow-hidden ${
              isActive ? card.activeBorder : 'hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                {card.label}
              </span>
              <div className={`p-2 rounded-lg bg-${card.color}-500/10 text-${card.color}-600 dark:text-${card.color}-400`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {card.value}
              </span>
              {card.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500 text-slate-950">
                  {card.badge}
                </span>
              )}
            </div>

            {/* Bottom active indicator bar */}
            {isActive && (
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-${card.color}-500`} />
            )}
          </button>
        );
      })}
    </div>
  );
};
