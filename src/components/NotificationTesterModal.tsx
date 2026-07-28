import React, { useState } from 'react';
import { SKRecord } from '../types';
import { getSKStatus, formatIndonesianDate } from '../utils/dateUtils';
import { X, Bell, Mail, Phone, Send, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface NotificationTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SKRecord[];
  onUpdateStatus: (id: string, status: 'Belum Terkirim' | 'Terkirim') => void;
}

export const NotificationTesterModal: React.FC<NotificationTesterModalProps> = ({
  isOpen,
  onClose,
  records,
  onUpdateStatus
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string>(records[0]?.id || '');
  const [sentLog, setSentLog] = useState<string | null>(null);

  if (!isOpen) return null;

  const expiringRecords = records.filter(r => {
    const status = getSKStatus(r.tanggalKadaluarsa);
    return status.status === 'Segera Kadaluarsa' || status.status === 'Kadaluarsa' || r.statusNotifikasi === 'Belum Terkirim';
  });

  const selectedRecord = records.find(r => r.id === selectedRecordId) || records[0];

  const handleSimulateCron = () => {
    if (!selectedRecord) return;

    onUpdateStatus(selectedRecord.id || '', 'Terkirim');
    setSentLog(
      `[SIMULASI CRON BERHASIL] Notifikasi Email dikirim ke ${selectedRecord.emailTujuan} & WhatsApp dikirim ke ${selectedRecord.noWATujuan} untuk SK ${selectedRecord.noSK}. Status Notifikasi diperbarui menjadi "Terkirim".`
    );

    setTimeout(() => {
      setSentLog(null);
    }, 6000);
  };

  const statusInfo = selectedRecord ? getSKStatus(selectedRecord.tanggalKadaluarsa) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl text-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Simulator Cron Job Notifikasi (7 Hari)</h3>
              <p className="text-xs text-slate-400">Pengujian otomatisasi pengiriman Email (MailApp) & WhatsApp Gateway</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-xs space-y-5">
          {sentLog && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{sentLog}</span>
            </div>
          )}

          {/* Select SK to Test */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="select-sk-tester">
              Pilih SK untuk Pengujian Notifikasi:
            </label>
            <select
              id="select-sk-tester"
              value={selectedRecordId}
              onChange={(e) => setSelectedRecordId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
            >
              {records.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.noSK} — Expire: {r.tanggalKadaluarsa} ({r.statusNotifikasi})
                </option>
              ))}
            </select>
          </div>

          {selectedRecord && (
            <div className="space-y-4">
              {/* Target Metadata Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-indigo-300">{selectedRecord.noSK}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusInfo?.badgeColor}`}>
                    {statusInfo?.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                  <div>
                    <b>Tanggal Buat:</b> {formatIndonesianDate(selectedRecord.tanggalBuat)}
                  </div>
                  <div>
                    <b>Masa Berlaku:</b> {selectedRecord.durasiBerlaku}
                  </div>
                  <div>
                    <b>Email Tujuan:</b> {selectedRecord.emailTujuan}
                  </div>
                  <div>
                    <b>No WA Tujuan:</b> {selectedRecord.noWATujuan}
                  </div>
                </div>
              </div>

              {/* Email Preview Payload */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-slate-300 font-semibold">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>Preview Payload Email (MailApp.sendEmail):</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 font-mono text-[11px] leading-relaxed">
                  <p className="text-blue-300 font-bold mb-1">Subject: [PENGINGAT] SK No {selectedRecord.noSK} Akan Kadaluarsa dalam 7 Hari!</p>
                  <p className="text-slate-400">To: {selectedRecord.emailTujuan}</p>
                  <p className="mt-2 text-slate-300">
                    Pemberitahuan Kadaluarsa SK: No {selectedRecord.noSK} yang dibuat pada {formatIndonesianDate(selectedRecord.tanggalBuat)} akan kadaluarsa pada {formatIndonesianDate(selectedRecord.tanggalKadaluarsa)}. Mohon perpanjang.
                  </p>
                </div>
              </div>

              {/* WhatsApp Preview Payload */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-slate-300 font-semibold">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Preview Payload WhatsApp (Fonnte / Wablas API):</span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-100 font-mono text-[11px] leading-relaxed">
                  ⚠️ *PENGINGAT KADALUARSA SK* ⚠️<br />
                  Nomor SK: *{selectedRecord.noSK}*<br />
                  Tanggal Buat: {selectedRecord.tanggalBuat}<br />
                  Tanggal Kadaluarsa: *{selectedRecord.tanggalKadaluarsa} (7 Hari Lagi)*<br />
                  Target WA: {selectedRecord.noWATujuan}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Akan mengubah Status Notifikasi menjadi "Terkirim"
          </span>
          <button
            onClick={handleSimulateCron}
            id="btn-run-simulated-cron"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Jalankan Simulasi Notifikasi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
