import React from 'react';
import { FileText, Code, Settings, Bell, ExternalLink, Database, Globe } from 'lucide-react';

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
  isConnecting,
  onOpenGasGuide,
  onOpenCodeExport,
  onOpenSettings,
  onOpenTester,
  segeraCount
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & High-Density Monospace Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-sm shadow-sm">
              SK
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold tracking-tight uppercase leading-none">Dashboard Manajemen SK</h1>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Vercel Ready
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-1">
                Serverless Infrastructure // Apps Script v2.4 & Vercel
              </p>
            </div>
          </div>

          {/* Connection Status Badge & Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Connection Status Indicator */}
            <button
              onClick={onOpenSettings}
              id="btn-connection-status"
              className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded border text-[11px] font-mono transition-all cursor-pointer ${
                webAppUrl && source === 'GAS'
                  ? 'bg-slate-950 border-emerald-500/60 text-emerald-400'
                  : 'bg-slate-950 border-amber-500/60 text-amber-400'
              }`}
              title="Klik untuk mengatur URL Google Apps Script Web App"
            >
              <div className={`w-2 h-2 rounded-full ${source === 'GAS' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="uppercase">
                {source === 'GAS' ? 'API: GOOGLE_SHEETS_DB_v1' : 'LOCAL_STORAGE_CACHE'}
              </span>
            </button>

            {/* Simulated Notification Cron Tester */}
            <button
              onClick={onOpenTester}
              id="btn-simulasi-cron"
              className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 text-xs font-semibold transition-all cursor-pointer"
              title="Uji coba otomatisasi pengecekan & pengiriman notifikasi (7 Hari)"
            >
              <Bell className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">Simulasi Cron</span>
              {segeraCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full">
                  {segeraCount}
                </span>
              )}
            </button>

            {/* Backend Code.gs Modal Button */}
            <button
              onClick={onOpenGasGuide}
              id="btn-gas-guide"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Backend Code.gs</span>
            </button>

            {/* Vercel Deploy Guide Button */}
            <button
              onClick={onOpenCodeExport}
              id="btn-export-html"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold transition-all cursor-pointer"
              title="Panduan Deploy Vercel.com & Code Export"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden lg:inline">Deploy Vercel</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              id="btn-settings"
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              title="Pengaturan API Google Apps Script"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
