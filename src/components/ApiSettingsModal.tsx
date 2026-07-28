import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertTriangle, Link, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';
import { GASService } from '../services/gasService';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  webAppUrl: string;
  onSaveUrl: (url: string) => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  webAppUrl,
  onSaveUrl
}) => {
  const [inputUrl, setInputUrl] = useState(webAppUrl);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!inputUrl.trim()) {
      setTestResult({
        status: 'error',
        message: 'Masukkan URL Google Apps Script Web App terlebih dahulu.'
      });
      return;
    }

    if (!inputUrl.includes('script.google.com')) {
      setTestResult({
        status: 'error',
        message: 'URL tidak valid. URL Google Apps Script harus berawalan "https://script.google.com/macros/s/.../exec"'
      });
      return;
    }

    setTestResult({ status: 'testing', message: 'Mencoba menghubungkan ke Google Apps Script...' });

    // Temporarily save to test
    GASService.setWebAppUrl(inputUrl);
    const result = await GASService.fetchSKRecords();

    if (result.source === 'GAS') {
      setTestResult({
        status: 'success',
        message: `Terhubung! Ditemukan ${result.data.length} data SK di Google Sheets.`
      });
    } else {
      setTestResult({
        status: 'error',
        message: result.error || 'Gagal tersambung ke Google Apps Script Web App. Pastikan Web App dideploy dengan akses "Anyone".'
      });
    }
  };

  const handleSave = () => {
    onSaveUrl(inputUrl.trim());
    onClose();
  };

  const handleUseMock = () => {
    setInputUrl('');
    onSaveUrl('');
    setTestResult({
      status: 'success',
      message: 'Beralih ke mode Penyimpanan Lokal (Offline Demo Mode).'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Pengaturan API Google Apps Script</h3>
              <p className="text-xs text-slate-400">Hubungkan Dashboard dengan Google Sheets Anda</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-xs space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="input-gas-url">
              Google Apps Script Web App URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Link className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="input-gas-url"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs font-mono rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Dapatkan URL ini dari menu <b>Deploy &gt; New deployment &gt; Web app (Who has access: Anyone)</b> di Apps Script.
            </p>
          </div>

          {/* Test Status Banner */}
          {testResult.status !== 'idle' && (
            <div
              className={`p-3.5 rounded-xl border flex items-start space-x-2.5 ${
                testResult.status === 'testing'
                  ? 'bg-blue-950/50 border-blue-800/80 text-blue-200'
                  : testResult.status === 'success'
                  ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-200'
                  : 'bg-rose-950/50 border-rose-800/80 text-rose-200'
              }`}
            >
              {testResult.status === 'testing' && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin shrink-0 mt-0.5" />}
              {testResult.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {testResult.status === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              <span className="text-xs leading-relaxed">{testResult.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              id="btn-test-gas-connection"
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tes Koneksi API</span>
            </button>

            <button
              type="button"
              onClick={handleUseMock}
              id="btn-use-local-mock"
              className="w-full sm:w-auto text-slate-400 hover:text-slate-200 text-xs underline cursor-pointer"
            >
              Gunakan Penyimpanan Lokal
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer">
            Batal
          </button>
          <button
            onClick={handleSave}
            id="btn-save-gas-url"
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
};
