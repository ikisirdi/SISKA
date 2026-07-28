import React, { useState, useEffect } from 'react';
import { SKRecord, SKStats, StatusFilter } from './types';
import { GASService } from './services/gasService';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { SKForm } from './components/SKForm';
import { SKTable } from './components/SKTable';
import { GasGuideModal } from './components/GasGuideModal';
import { CodeExportModal } from './components/CodeExportModal';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { NotificationTesterModal } from './components/NotificationTesterModal';
import { Database, AlertCircle, Globe } from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<SKRecord[]>([]);
  const [webAppUrl, setWebAppUrl] = useState<string>('');
  const [source, setSource] = useState<'GAS' | 'Local'>('Local');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('Semua');

  // Modals state
  const [isGasGuideOpen, setIsGasGuideOpen] = useState<boolean>(false);
  const [isCodeExportOpen, setIsCodeExportOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTesterOpen, setIsTesterOpen] = useState<boolean>(false);

  // Load records and URL on mount
  useEffect(() => {
    const savedUrl = GASService.getWebAppUrl();
    setWebAppUrl(savedUrl);
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setIsLoading(true);
    setErrorMessage('');
    const res = await GASService.fetchSKRecords();
    setRecords(res.data);
    setSource(res.source);
    if (res.error) {
      setErrorMessage(res.error);
    }
    setIsLoading(false);
  };

  const handleCreateSK = async (newSK: Omit<SKRecord, 'id' | 'statusNotifikasi'>) => {
    setIsSubmitting(true);
    await GASService.createSKRecord(newSK);
    setIsSubmitting(false);
    // Refresh list
    await loadRecords();
  };

  const handleDeleteSK = (id: string) => {
    const updated = GASService.deleteSKRecord(id);
    setRecords(updated);
  };

  const handleUpdateNotificationStatus = (id: string, status: 'Belum Terkirim' | 'Terkirim') => {
    const updated = GASService.updateNotificationStatus(id, status);
    setRecords(updated);
  };

  const handleSaveWebAppUrl = (newUrl: string) => {
    GASService.setWebAppUrl(newUrl);
    setWebAppUrl(newUrl);
    loadRecords();
  };

  const stats: SKStats = GASService.calculateStats(records);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top High Density Navbar Header */}
      <Navbar
        webAppUrl={webAppUrl}
        source={source}
        isConnecting={isLoading}
        onOpenGasGuide={() => setIsGasGuideOpen(true)}
        onOpenCodeExport={() => setIsCodeExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTester={() => setIsTesterOpen(true)}
        segeraCount={stats.segeraKadaluarsa}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Connection Notice / Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-amber-100 font-bold whitespace-nowrap transition-all cursor-pointer"
            >
              Atur URL Web App
            </button>
          </div>
        )}

        {!webAppUrl && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-blue-400 font-bold uppercase tracking-wide">
                <Database className="w-4 h-4 text-blue-400" />
                <span>Status Storage: Data Lokal (Vercel Ready)</span>
              </div>
              <p className="text-slate-300">
                Aplikasi siap didaftarkan di <b>Vercel.com</b>. Untuk menghubungkan dengan Google Sheets secara permanen, masukkan Web App URL Google Apps Script di Pengaturan API atau di Environment Variable Vercel (<code>VITE_GAS_WEB_APP_URL</code>).
              </p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setIsCodeExportOpen(true)}
                className="px-3.5 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Panduan Vercel</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-3.5 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-all cursor-pointer"
              >
                Input Web App URL
              </button>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <StatsOverview
          stats={stats}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
        />

        {/* Form Input SK */}
        <SKForm
          onSubmitSK={handleCreateSK}
          isSubmitting={isSubmitting}
        />

        {/* Summary Table */}
        <SKTable
          records={records}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          onRefresh={loadRecords}
          onDeleteRecord={handleDeleteSK}
          onTriggerManualNotification={() => setIsTesterOpen(true)}
          isLoading={isLoading}
        />
      </main>

      {/* High Density Footer Status Bar */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 px-6 text-[10px] font-mono text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-6">
            <span>DATABASE: {source === 'GAS' ? 'cloud_google_sheets_live' : 'local_browser_cache'}</span>
            <span className="hidden sm:inline">DEPLOYMENT: VERCEL_READY</span>
            <span className="hidden md:inline">CRON_JOB: DAILY_00:00_WIB</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-emerald-400 font-bold">SYSTEM_READY</span>
            </div>
            <button onClick={() => setIsCodeExportOpen(true)} className="hover:text-blue-400 transition-colors cursor-pointer underline">
              Panduan Vercel & Export
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GasGuideModal
        isOpen={isGasGuideOpen}
        onClose={() => setIsGasGuideOpen(false)}
      />

      <CodeExportModal
        isOpen={isCodeExportOpen}
        onClose={() => setIsCodeExportOpen(false)}
        webAppUrl={webAppUrl}
      />

      <ApiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        webAppUrl={webAppUrl}
        onSaveUrl={handleSaveWebAppUrl}
      />

      <NotificationTesterModal
        isOpen={isTesterOpen}
        onClose={() => setIsTesterOpen(false)}
        records={records}
        onUpdateStatus={handleUpdateNotificationStatus}
      />
    </div>
  );
}
