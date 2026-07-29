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
import { EditSKModal } from './components/EditSKModal';
import { ExportPrintModal } from './components/ExportPrintModal';
import { Database, AlertCircle, Globe, CheckCircle2, Loader2, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export default function App() {
  const [records, setRecords] = useState<SKRecord[]>([]);
  const [webAppUrl, setWebAppUrl] = useState<string>('');
  const [source, setSource] = useState<'GAS' | 'Local'>('Local');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('Semua');

  // Loading animation modal state for CRUD
  const [processLoading, setProcessLoading] = useState<{ isBusy: boolean; text: string }>({
    isBusy: false,
    text: ''
  });

  // Corner Toast Notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modals state
  const [isGasGuideOpen, setIsGasGuideOpen] = useState<boolean>(false);
  const [isCodeExportOpen, setIsCodeExportOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTesterOpen, setIsTesterOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Edit SK Modal state
  const [editingRecord, setEditingRecord] = useState<SKRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Helper Toast Notification
  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
    setProcessLoading({ isBusy: true, text: 'Menyimpan Data SK Baru...' });
    setIsSubmitting(true);
    try {
      await GASService.createSKRecord(newSK);
      await loadRecords();
      showToast('success', 'Berhasil Menyimpan', `Data SK (${newSK.noSK}) telah tersimpan.`);
    } catch (err) {
      showToast('error', 'Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsSubmitting(false);
      setProcessLoading({ isBusy: false, text: '' });
    }
  };

  const handleDeleteSK = async (id: string, noSK?: string) => {
    setProcessLoading({ isBusy: true, text: 'Menghapus Data SK...' });
    try {
      const res = await GASService.deleteSKRecord(id, noSK);
      setRecords(res.records);
      showToast('success', 'Berhasil Dihapus', `Data SK (${noSK || ''}) telah dihapus dari sistem.`);
      if (webAppUrl) {
        setTimeout(() => {
          loadRecords();
        }, 1500);
      }
    } catch (err) {
      showToast('error', 'Gagal Menghapus', 'Terjadi kesalahan saat menghapus data.');
    } finally {
      setProcessLoading({ isBusy: false, text: '' });
    }
  };

  const handleEditSK = async (updatedSK: SKRecord) => {
    setProcessLoading({ isBusy: true, text: 'Memperbarui Data SK...' });
    try {
      const res = await GASService.updateSKRecord(updatedSK);
      setRecords(res.records);
      showToast('success', 'Berhasil Diperbarui', `Data SK (${updatedSK.noSK}) telah diperbarui.`);
      if (webAppUrl) {
        setTimeout(() => {
          loadRecords();
        }, 1500);
      }
    } catch (err) {
      showToast('error', 'Gagal Memperbarui', 'Terjadi kesalahan saat memperbarui data.');
    } finally {
      setProcessLoading({ isBusy: false, text: '' });
    }
  };

  const handleUpdateNotificationStatus = (id: string, status: 'Belum Terkirim' | 'Terkirim') => {
    const updated = GASService.updateNotificationStatus(id, status);
    setRecords(updated);
    showToast('info', 'Status Disimulasikan', `Status notifikasi diubah menjadi ${status}.`);
  };

  const handleSaveWebAppUrl = (newUrl: string) => {
    GASService.setWebAppUrl(newUrl);
    setWebAppUrl(newUrl);
    loadRecords();
    showToast('success', 'Pengaturan Disimpan', 'URL Web App Google Apps Script telah diperbarui.');
  };

  const stats: SKStats = GASService.calculateStats(records);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white relative">
      {/* Top Navbar Header */}
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
                Aplikasi berjalan di mode lokal. Untuk menghubungkan dengan Google Sheets secara permanen, masukkan Web App URL Google Apps Script.
              </p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-3.5 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md cursor-pointer"
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
          onEditRecord={(record) => {
            setEditingRecord(record);
            setIsEditModalOpen(true);
          }}
          onDeleteRecord={handleDeleteSK}
          onTriggerManualNotification={() => setIsTesterOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          isLoading={isLoading}
        />
      </main>

      {/* Footer with copyright by Idris */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-400 font-medium tracking-wide">
        Copyright by Idris
      </footer>

      {/* Process Loading Overlay Animation Modal */}
      {processLoading.isBusy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center space-y-4 text-center max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-ping"></div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Memproses Perintah</h4>
              <p className="text-xs text-slate-400 font-medium">{processLoading.text}</p>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full w-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Corner Toast Notifications Stack */}
      <div className="fixed top-20 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-start justify-between space-x-3 transition-all duration-300 animate-in slide-in-from-top-3 ${
              toast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/20'
                : toast.type === 'error'
                ? 'bg-slate-900/95 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/20'
                : 'bg-slate-900/95 border-blue-500/50 text-blue-300 ring-1 ring-blue-500/20'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`p-1.5 rounded-xl mt-0.5 ${
                toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                toast.type === 'error' ? 'bg-rose-500/20 text-rose-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-white">{toast.title}</h5>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

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

      <EditSKModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRecord(null);
        }}
        record={editingRecord}
        onSave={handleEditSK}
      />

      <ExportPrintModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        records={records}
      />
    </div>
  );
}

