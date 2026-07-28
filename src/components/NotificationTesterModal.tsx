import React, { useState } from 'react';
import { SKRecord } from '../types';
import { getSKStatus, formatIndonesianDate } from '../utils/dateUtils';
import { GASService } from '../services/gasService';
import { X, Bell, Mail, Phone, Send, CheckCircle2, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';

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
  const [isSendingGas, setIsSendingGas] = useState<boolean>(false);

  if (!isOpen) return null;

  const selectedRecord = records.find(r => r.id === selectedRecordId) || records[0];

  // 1. Direct WhatsApp Web / App Launch (1-Click Real WA Message)
  const handleSendWhatsAppDirect = () => {
    if (!selectedRecord) return;

    let cleanWA = selectedRecord.noWATujuan.replace(/[^0-9]/g, '');
    if (cleanWA.startsWith('0')) {
      cleanWA = '62' + cleanWA.substring(1);
    }

    const message = `⚠️ *PENGINGAT KADALUARSA SK* ⚠️\n\nNomor SK: *${selectedRecord.noSK}*\nTanggal Buat: ${selectedRecord.tanggalBuat}\nMasa Berlaku: ${selectedRecord.durasiBerlaku}\nTanggal Kadaluarsa: *${selectedRecord.tanggalKadaluarsa}*\nEmail Tujuan: ${selectedRecord.emailTujuan}\n\n_Mohon segera diproses perpanjangannya._\n*Sistem Manajemen SK Perusahaan*`;

    const waUrl = `https://wa.me/${cleanWA}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    onUpdateStatus(selectedRecord.id || '', 'Terkirim');
    setSentLog(`[WHATSAPP TERBUKA] Membuka WhatsApp Web / App untuk nomor ${selectedRecord.noWATujuan}. Status notifikasi diperbarui menjadi "Terkirim".`);
  };

  // 2. Direct Email Client Launch (1-Click Real Mailto)
  const handleSendEmailDirect = () => {
    if (!selectedRecord) return;

    const subject = `[PENGINGAT] SK No ${selectedRecord.noSK} Akan Kadaluarsa!`;
    const body = `Halo,\n\nIni adalah pengingat otomatis mengenai Surat Keputusan (SK):\n- Nomor SK: ${selectedRecord.noSK}\n- Tanggal Buat: ${formatIndonesianDate(selectedRecord.tanggalBuat)}\n- Masa Berlaku: ${selectedRecord.durasiBerlaku}\n- Tanggal Kadaluarsa: ${formatIndonesianDate(selectedRecord.tanggalKadaluarsa)}\n- Kontak WA: ${selectedRecord.noWATujuan}\n\nMohon segera dilakukan proses perpanjangan SK sebelum tanggal kadaluarsa.\n\nTerima Kasih,\nSistem Manajemen SK`;

    const mailtoUrl = `mailto:${selectedRecord.emailTujuan}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');

    onUpdateStatus(selectedRecord.id || '', 'Terkirim');
    setSentLog(`[EMAIL CLIENT TERBUKA] Membuka aplikasi Email untuk tujuan ${selectedRecord.emailTujuan}. Status notifikasi diperbarui menjadi "Terkirim".`);
  };

  // 3. Trigger Real Email & WA via Google Apps Script Web App
  const handleSendViaGAS = async () => {
    if (!selectedRecord) return;
    setIsSendingGas(true);

    const res = await GASService.triggerRemoteNotification(selectedRecord);
    setIsSendingGas(false);

    onUpdateStatus(selectedRecord.id || '', 'Terkirim');
    setSentLog(`[GAS SERVER API] ${res.message}`);
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
              <h3 className="font-bold text-base text-white">Eksekusi & Simulasi Pengiriman Notifikasi SK</h3>
              <p className="text-xs text-slate-400">Kirim WhatsApp Langsung, Email Client, atau trigger Serverless Google Apps Script</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-xs space-y-5">
          {sentLog && (
            <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-800 text-emerald-200 flex items-start space-x-2.5 shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-semibold">{sentLog}</span>
            </div>
          )}

          {/* Select SK to Test */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="select-sk-tester">
              Pilih SK yang Akan Dikirim Notifikasi:
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
                  <span className="font-bold font-mono text-indigo-300 text-sm">{selectedRecord.noSK}</span>
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
                    <b>Email Tujuan:</b> <span className="text-blue-300 font-mono">{selectedRecord.emailTujuan}</span>
                  </div>
                  <div>
                    <b>No WA Tujuan:</b> <span className="text-emerald-300 font-mono">{selectedRecord.noWATujuan}</span>
                  </div>
                </div>
              </div>

              {/* 3 Quick Action Cards for Sending */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: WhatsApp Direct */}
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-1">
                      <Phone className="w-4 h-4" />
                      <span>Kirim WhatsApp (1-Click)</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Membuka WhatsApp Web / App dengan pesan pengingat yang sudah terformat rapi untuk nomor WA target.
                    </p>
                  </div>
                  <button
                    onClick={handleSendWhatsAppDirect}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka WhatsApp Web</span>
                  </button>
                </div>

                {/* Option 2: Email Client Direct */}
                <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/60 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center space-x-2 text-blue-400 font-bold mb-1">
                      <Mail className="w-4 h-4" />
                      <span>Kirim Email Client (1-Click)</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Membuka aplikasi Email (Gmail/Outlook) dengan Subject & Body pengingat SK terisi otomatis.
                    </p>
                  </div>
                  <button
                    onClick={handleSendEmailDirect}
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Client Email</span>
                  </button>
                </div>
              </div>

              {/* Serverless GAS Dispatch */}
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-300 font-bold">
                    <Send className="w-4 h-4 text-indigo-400" />
                    <span>Otomatisasi Server: Google Apps Script (MailApp & Trigger)</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Pemicu harian otomatis (Cron Job) dijalankan di cloud Google pada jam 08.00 pagi. Untuk mengirim pesan email langsung via server Google detik ini juga:
                </p>
                <button
                  onClick={handleSendViaGAS}
                  disabled={isSendingGas}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow"
                >
                  <Send className={`w-3.5 h-3.5 ${isSendingGas ? 'animate-spin' : ''}`} />
                  <span>{isSendingGas ? 'Mengirim via GAS...' : 'Trigger Kirim Email via Server Google Apps Script'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Mengubah Status Notifikasi SK menjadi "Terkirim"
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

