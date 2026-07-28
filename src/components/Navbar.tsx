import React from 'react';
import { FileText, Code, Settings, Bell, ExternalLink, Database, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

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
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg text-slate-100 leading-tight">Dashboard SK</h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Serverless
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Manajemen Surat Keputusan & Notifikasi Otomatis</p>
            </div>
          </div>

          {/* Connection Status Badge & Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Connection Status */}
            <button
              onClick={onOpenSettings}
              id="btn-connection-status"
              className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                webAppUrl && source === 'GAS'
                  ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-amber-950/40 border-amber-700/50 text-amber-300 hover:bg-amber-900/40'
              }`}
              title="Klik untuk mengatur URL Google Apps Script Web App"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{source === 'GAS' ? 'Google Sheets Sync' : 'Penyimpanan Lokal'}</span>
              <div className={`w-2 h-2 rounded-full ${source === 'GAS' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </button>

            {/* Simulated Notification Cron Tester */}
            <button
              onClick={onOpenTester}
              id="btn-simulasi-cron"
              className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition-all shadow-sm"
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

            {/* Code.gs & GAS Guide Modal Button */}
            <button
              onClick={onOpenGasGuide}
              id="btn-gas-guide"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Backend Code.gs</span>
            </button>

            {/* Export index.html Modal Button */}
            <button
              onClick={onOpenCodeExport}
              id="btn-export-html"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
              title="Ekspor file index.html lengkap untuk GitHub Pages"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden lg:inline">GitHub Pages Code</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              id="btn-settings"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
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
