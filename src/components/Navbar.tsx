import React from 'react';
import { Settings, Bell, Code } from 'lucide-react';

interface NavbarProps {
  webAppUrl: string;
  source: 'GAS' | 'Local';
  isConnecting: boolean;
  onOpenGasGuide: () => void;
  onOpenCodeExport: () => void;
  onOpenSettings: () => void;
  onOpenTester: () => void;
  segeraCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  webAppUrl,
  source,
  onOpenGasGuide,
  onOpenSettings,
  onOpenTester,
  segeraCount
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Clean Dashbord Monitoring Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-md shadow-blue-500/20">
              DM
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">Dashbord Monitoring</h1>
            </div>
          </div>

          {/* Clean Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Status Indicator Badge */}
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                webAppUrl && source === 'GAS'
                  ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-400'
                  : 'bg-amber-950/60 border-amber-600/50 text-amber-400'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${source === 'GAS' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="hidden sm:inline">{source === 'GAS' ? 'Terhubung Google Sheets' : 'Mode Penyimpanan Lokal'}</span>
            </div>

            {/* Notification Tester */}
            <button
              onClick={onOpenTester}
              id="btn-simulasi-cron"
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
              title="Simulasi Notifikasi"
            >
              <Bell className="w-4 h-4 text-indigo-300" />
              {segeraCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full flex items-center justify-center">
                  {segeraCount}
                </span>
              )}
            </button>

            {/* Backend Code.gs Guide */}
            <button
              onClick={onOpenGasGuide}
              id="btn-gas-guide"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
              title="Backend Script (Code.gs)"
            >
              <Code className="w-4 h-4 text-blue-400" />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              id="btn-settings"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
              title="Pengaturan API"
            >
              <Settings className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

