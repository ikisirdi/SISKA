import React, { useState } from 'react';
import { X, Copy, Check, Code, Database, Zap, Clock, ShieldCheck, ExternalLink, HelpCircle, FileSpreadsheet } from 'lucide-react';

interface GasGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GAS_CODE_GS = `/**
 * BACKEND GOOGLE APPS SCRIPT (Code.gs)
 * Dashboard Manajemen SK (Surrat Keputusan) - Serverless Backend
 * 
 * Fitur:
 * 1. Web App API (doGet & doPost) untuk integrasi Frontend
 * 2. Cron Job Harian (checkAndSendNotifications) untuk notifikasi otomatis 7 hari sebelum kadaluarsa
 * 3. Email Integration via MailApp & WhatsApp Integration via Fonnte / Wablas API
 * 4. Update Status Notifikasi menjadi "Terkirim" agar tidak ganda
 */

// KONFIGURASI NAMA SHEET & API WHATSAPP
const SHEET_NAME = "DataSK"; // Nama Sheet tab di Google Sheets
const FONNTE_API_TOKEN = "GANTI_DENGAN_TOKEN_FONNTE_ANDA"; // Token dari fonnte.com (Opsional)
const SENDER_EMAIL_NAME = "Sistem Notifikasi SK Kantor";

/**
 * 1. FUNGSI GET API (doGet)
 * Mengambil seluruh daftar SK dari Google Sheets untuk ditampilkan di Frontend Dashboard
 */
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    // Jika tidak ada data atau hanya header
    if (data.length <= 1) {
      return responseJSON({ status: "success", data: [] });
    }
    
    // Convert array 2D ke Array of Object
    const headers = data[0]; // [No SK, Tanggal Buat, Durasi Berlaku, Tanggal Kadaluarsa, Email Tujuan, No WA Tujuan, Status Notifikasi]
    const records = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue; // Skip baris kosong
      
      records.push({
        id: "sk-row-" + (i + 1),
        noSK: String(row[0]),
        tanggalBuat: formatDate(row[1]),
        durasiBerlaku: String(row[2]),
        tanggalKadaluarsa: formatDate(row[3]),
        emailTujuan: String(row[4]),
        noWATujuan: String(row[5]),
        statusNotifikasi: String(row[6] || "Belum Terkirim")
      });
    }
    
    return responseJSON({ status: "success", data: records });
  } catch (error) {
    return responseJSON({ status: "error", message: error.toString() });
  }
}

/**
 * 2. FUNGSI POST API (doPost)
 * Menerima input data SK baru dari Frontend dan menambahkannya ke baris baru Google Sheets
 */
function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    let contents;
    
    // Parsing payload body JSON
    if (e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    } else {
      contents = e.parameter;
    }

    const action = contents.action || "createSK";

    // Opsi A: Trigger langsung pengiriman notifikasi Email & WA untuk SK spesifik
    if (action === "triggerNotification" || action === "sendNotification") {
      const email = contents.emailTujuan || "";
      const noSK = contents.noSK || "";
      const tglBuat = contents.tanggalBuat || "";
      const durasi = contents.durasiBerlaku || "";
      const tglKadaluarsa = contents.tanggalKadaluarsa || "";
      const noWA = contents.noWATujuan || "";

      if (email) {
        sendEmailNotification(email, noSK, tglBuat, durasi, tglKadaluarsa);
      }
      if (noWA) {
        sendWhatsAppNotification(noWA, noSK, tglBuat, durasi, tglKadaluarsa);
      }

      // Update status notifikasi di Google Sheets menjadi "Terkirim"
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(noSK)) {
          sheet.getRange(i + 1, 7).setValue("Terkirim");
          break;
        }
      }

      return responseJSON({
        status: "success",
        message: "Notifikasi Email & WA untuk SK " + noSK + " berhasil diproses!"
      });
    }
    
    const noSK = contents.noSK || "";
    const tanggalBuat = contents.tanggalBuat || "";
    const durasiBerlaku = contents.durasiBerlaku || "";
    const tanggalKadaluarsa = contents.tanggalKadaluarsa || "";
    const emailTujuan = contents.emailTujuan || "";
    const noWATujuan = contents.noWATujuan || "";
    const statusNotifikasi = contents.statusNotifikasi || "Belum Terkirim";
    
    if (!noSK || !tanggalKadaluarsa) {
      return responseJSON({ status: "error", message: "No SK dan Tanggal Kadaluarsa wajib diisi!" });
    }
    
    // Tambah baris baru ke sheet
    sheet.appendRow([
      noSK,
      tanggalBuat,
      durasiBerlaku,
      tanggalKadaluarsa,
      emailTujuan,
      noWATujuan,
      statusNotifikasi
    ]);
    
    return responseJSON({
      status: "success",
      message: "Data SK " + noSK + " berhasil disimpan ke Google Sheets!",
      data: contents
    });
  } catch (error) {
    return responseJSON({ status: "error", message: error.toString() });
  }
}

/**
 * 3. FUNGSI AUTOMATIC CRON JOB (Jalankan Harian)
 * Pengecekan otomatis kolom 'Tanggal Kadaluarsa'. Jika persis 7 hari dari hari ini,
 * kirim notifikasi Email + WA, lalu update 'Status Notifikasi' menjadi "Terkirim".
 */
function checkAndSendNotifications() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return; // Tidak ada data
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Target = 7 hari dari hari ini
  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() + 7);
  
  let sentCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const noSK = String(row[0]);
    const tanggalBuat = formatDate(row[1]);
    const durasiBerlaku = String(row[2]);
    const rawKadaluarsa = row[3];
    const emailTujuan = String(row[4]);
    const noWATujuan = String(row[5]);
    const statusNotifikasi = String(row[6]);
    
    if (!rawKadaluarsa || !noSK) continue;
    
    const expiryDate = new Date(rawKadaluarsa);
    expiryDate.setHours(0, 0, 0, 0);
    
    // Hitung selisih hari
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    
    // Jika persis 7 hari lagi (atau <= 7 hari dan Belum Terkirim)
    if (diffDays === 7 && statusNotifikasi !== "Terkirim") {
      Logger.log("Mengirim notifikasi untuk SK: " + noSK);
      
      const tglKadaluarsaFormatted = formatDate(expiryDate);
      
      // A. Kirim Email Notifikasi
      if (emailTujuan) {
        sendEmailNotification(emailTujuan, noSK, tanggalBuat, durasiBerlaku, tglKadaluarsaFormatted);
      }
      
      // B. Kirim WhatsApp Notifikasi (Fonnte / Wablas)
      if (noWATujuan) {
        sendWhatsAppNotification(noWATujuan, noSK, tanggalBuat, durasiBerlaku, tglKadaluarsaFormatted);
      }
      
      // C. Update kolom 'Status Notifikasi' (Kolom G / Kolom 7) di Google Sheets menjadi "Terkirim"
      sheet.getRange(i + 1, 7).setValue("Terkirim");
      sentCount++;
    }
  }
  
  Logger.log("Selesai mengecek. Total notifikasi terkirim hari ini: " + sentCount);
}

/**
 * 4. HELPER: KIRIM EMAIL NOTIFIKASI
 */
function sendEmailNotification(toEmail, noSK, tanggalBuat, durasi, tglKadaluarsa) {
  const subject = "[PENGINGAT] SK No " + noSK + " Akan Kadaluarsa dalam 7 Hari!";
  
  const htmlBody = \`
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 10px;">
      <h2 style="color: #1e3a8a;">Pemberitahuan Kadaluarsa Surat Keputusan (SK)</h2>
      <p>Halo, ini adalah pengingat otomatis dari <b>Sistem Manajemen SK</b>.</p>
      <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 6px; margin: 15px 0;">
        <table style="width: 100%; font-size: 14px;">
          <tr><td><b>Nomor SK:</b></td><td>\${noSK}</td></tr>
          <tr><td><b>Tanggal Buat:</b></td><td>\${tanggalBuat}</td></tr>
          <tr><td><b>Masa Berlaku:</b></td><td>\${durasi}</td></tr>
          <tr><td><b>Tanggal Kadaluarsa:</b></td><td><span style="color: #dc2626; font-weight: bold;">\${tglKadaluarsa} (7 Hari Lagi)</span></td></tr>
        </table>
      </div>
      <p>Mohon segera lakukan perpanjangan atau pembaruan SK terkait sebelum tanggal kadaluarsa tiba.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #64748b;">Email ini dikirim otomatis oleh Sistem Serverless Dashboard SK.</p>
    </div>
  \`;
  
  try {
    MailApp.sendEmail({
      to: toEmail,
      subject: subject,
      htmlBody: htmlBody,
      name: SENDER_EMAIL_NAME
    });
    Logger.log("Email berhasil dikirim ke: " + toEmail);
  } catch (err) {
    Logger.log("Gagal mengirim email: " + err.toString());
  }
}

/**
 * 5. HELPER: KIRIM WHATSAPP NOTIFIKASI (Fonnte API Kerangka)
 */
function sendWhatsAppNotification(noWA, noSK, tanggalBuat, durasi, tglKadaluarsa) {
  const message = \`⚠️ *PENGINGAT KADALUARSA SK* ⚠️\n\nNomor SK: *\${noSK}*\nTanggal Buat: \${tanggalBuat}\nMasa Berlaku: \${durasi}\nTanggal Kadaluarsa: *\${tglKadaluarsa} (7 Hari Lagi)*\n\nMohon segera diproses perpanjangannya.\n_Sistem Manajemen SK_\`;
  
  // Format nomor HP ke 628xxx
  let cleanWA = String(noWA).replace(/[^0-9]/g, '');
  if (cleanWA.startsWith('0')) {
    cleanWA = '62' + cleanWA.substring(1);
  }
  
  if (FONNTE_API_TOKEN === "GANTI_DENGAN_TOKEN_FONNTE_ANDA") {
    Logger.log("[WA SIMULASI] Notifikasi WA siap dikirim ke " + cleanWA + ": " + message);
    return;
  }
  
  try {
    const payload = {
      target: cleanWA,
      message: message,
      countryCode: '62'
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': FONNTE_API_TOKEN
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch('https://api.fonnte.com/send', options);
    Logger.log("Respon Fonnte WA: " + response.getContentText());
  } catch (err) {
    Logger.log("Gagal kirim WA: " + err.toString());
  }
}

/**
 * 6. HELPER: GET OR CREATE SHEET WITH HEADERS
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Masukkan Header Kolom
    sheet.appendRow([
      "No SK",
      "Tanggal Buat",
      "Durasi Berlaku",
      "Tanggal Kadaluarsa",
      "Email Tujuan",
      "No WA Tujuan",
      "Status Notifikasi"
    ]);
    sheet.getRange("A1:G1").setFontWeight("bold").setBackground("#e2e8f0");
  }
  
  return sheet;
}

/**
 * 7. HELPER: FORMAT DATE YYYY-MM-DD
 */
function formatDate(dateVal) {
  if (!dateVal) return "";
  if (dateVal instanceof Date) {
    const year = dateVal.getFullYear();
    const month = String(dateVal.getMonth() + 1).padStart(2, '0');
    const day = String(dateVal.getDate()).padStart(2, '0');
    return year + "-" + month + "-" + day;
  }
  return String(dateVal);
}

/**
 * 8. HELPER: RESPONSE JSON WITH CORS HEADERS
 */
function responseJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const GasGuideModal: React.FC<GasGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'tutorial' | 'sheets'>('code');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GAS_CODE_GS);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Kode Backend Google Apps Script (Code.gs)</h3>
              <p className="text-xs text-slate-400">Panduan Lengkap Setup Web App API, Google Sheets & Cron Notifikasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-900/80 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'code'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Kode Code.gs Lengkap</span>
          </button>

          <button
            onClick={() => setActiveTab('tutorial')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'tutorial'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Panduan Deploy Web App (Langkah demi Langkah)</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'sheets'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Struktur Google Sheets</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-6">
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">
                    Salin seluruh kode di bawah ini lalu tempelkan ke editor Google Apps Script Anda.
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  id="btn-copy-code-gs"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Tersalin!' : 'Salin Kode.gs'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 max-h-[500px]">
                {GAS_CODE_GS}
              </pre>
            </div>
          )}

          {activeTab === 'tutorial' && (
            <div className="space-y-6 text-slate-300">
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/50 space-y-2">
                <h4 className="font-bold text-sm text-blue-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  Panduan Deploy Google Apps Script Web App (Akses Publik / CORS Enabled)
                </h4>
                <p className="text-slate-300">
                  Ikuti langkah demi langkah di bawah ini untuk mengaktifkan Web App API Google Sheets Anda agar bisa berkomunikasi langsung dengan Dashboard ini.
                </p>
              </div>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-start space-x-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-white text-sm">Buka Google Sheets Baru</h5>
                    <p className="text-slate-300">
                      Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-400 underline">sheets.new</a>. Beri nama spreadsheet Anda, misalnya <b>"Database SK Perusahaan"</b>.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-white text-sm">Buka Apps Script Editor</h5>
                    <p className="text-slate-300">
                      Di menu Google Sheets, klik menu <b>Extensions (Ekstensi)</b> &gt; <b>Apps Script</b>.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-white text-sm">Tempel Kode Code.gs</h5>
                    <p className="text-slate-300">
                      Hapus semua kode bawaan di file <code>Code.gs</code>, lalu salin dan tempelkan kode lengkap dari tab <b>"Kode Code.gs Lengkap"</b>. Lalu tekan ikon Simpan (Ctrl+S).
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start space-x-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-white text-sm">Deploy sebagai Web App (PENTING!)</h5>
                    <p className="text-slate-300">
                      Di pojok kanan atas Apps Script Editor:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-300 mt-2">
                      <li>Klik tombol <b>Deploy</b> &gt; <b>New deployment (Penerapan baru)</b>.</li>
                      <li>Klik ikon roda gigi (Select type) &gt; pilih <b>Web app</b>.</li>
                      <li><b>Description:</b> "API Dashboard SK"</li>
                      <li><b>Execute as (Jalankan sebagai):</b> <code className="text-amber-300 font-bold">Me (Saya / Email Anda)</code></li>
                      <li><b>Who has access (Siapa yang memiliki akses):</b> <code className="text-emerald-300 font-bold">Anyone (Siapa saja)</code></li>
                      <li>Klik <b>Deploy</b>, lalu berikan izin akses (Authorize access) dengan email Google Anda.</li>
                    </ul>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start space-x-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    5
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-white text-sm">Salin Web App URL & Tempel di Dashboard</h5>
                    <p className="text-slate-300">
                      Setelah berhasil dideploy, Anda akan mendapatkan <b>Web App URL</b> (berawalan <code>https://script.google.com/macros/s/.../exec</code>). Salin URL tersebut, lalu buka tombol <b>Pengaturan (ikon roda gigi)</b> di Dashboard ini dan tempelkan URL tersebut!
                    </p>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="flex items-start space-x-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    6
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-white text-sm">Atur Cron Job Harian (Trigger Otomatis)</h5>
                    <p className="text-slate-300">
                      Agar notifikasi email/WA terkirim otomatis tiap hari 7 hari sebelum kadaluarsa:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-300 mt-2">
                      <li>Di Apps Script, klik menu <b>Triggers (ikon jam di panel kiri)</b>.</li>
                      <li>Klik <b>Add Trigger (Pemicu Baru)</b> di kanan bawah.</li>
                      <li>Pilih fungsi: <code className="text-blue-300">checkAndSendNotifications</code></li>
                      <li>Select event source: <code className="text-blue-300">Time-driven (Berdasarkan waktu)</code></li>
                      <li>Select type of time based trigger: <code className="text-blue-300">Day timer (Pemicu harian)</code></li>
                      <li>Select time of day: <code className="text-blue-300">8am to 9am (Jam 8 sampai 9 pagi)</code></li>
                      <li>Klik <b>Save</b>. Mulai sekarang, Google akan mengecek otomatis seluruh SK tiap jam 8 pagi!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sheets' && (
            <div className="space-y-4">
              <p className="text-slate-300">
                Google Apps Script akan secara otomatis membuatkan tab sheet bernama <code>DataSK</code> jika belum ada, dengan urutan kolom sebagai berikut:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
                  <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3 border-r border-slate-800">Kolom</th>
                      <th className="p-3 border-r border-slate-800">Nama Header</th>
                      <th className="p-3 border-r border-slate-800">Tipe Data</th>
                      <th className="p-3">Contoh Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-3 font-mono border-r border-slate-800 font-bold text-blue-400">A (1)</td>
                      <td className="p-3 border-r border-slate-800 font-semibold">No SK</td>
                      <td className="p-3 border-r border-slate-800">Teks</td>
                      <td className="p-3 font-mono">001/SK-DIR/HRD/I/2026</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono border-r border-slate-800 font-bold text-blue-400">B (2)</td>
                      <td className="p-3 border-r border-slate-800 font-semibold">Tanggal Buat</td>
                      <td className="p-3 border-r border-slate-800">Tanggal (YYYY-MM-DD)</td>
                      <td className="p-3 font-mono">2026-01-15</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono border-r border-slate-800 font-bold text-blue-400">C (3)</td>
                      <td className="p-3 border-r border-slate-800 font-semibold">Durasi Berlaku</td>
                      <td className="p-3 border-r border-slate-800">Teks</td>
                      <td className="p-3">3 Tahun</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono border-r border-slate-800 font-bold text-blue-400">D (4)</td>
                      <td className="p-3 border-r border-slate-800 font-semibold">Tanggal Kadaluarsa</td>
                      <td className="p-3 border-r border-slate-800">Tanggal (YYYY-MM-DD)</td>
                      <td className="p-3 font-mono">2029-01-15</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono border-r border-slate-800 font-bold text-blue-400">E (5)</td>
                      <td className="p-3 border-r border-slate-800 font-semibold">Email Tujuan</td>
                      <td className="p-3 border-r border-slate-800">Teks Email</td>
                      <td className="p-3 font-mono">hrd@perusahaan.co.id</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono border-r border-slate-800 font-bold text-blue-400">F (6)</td>
                      <td className="p-3 border-r border-slate-800 font-semibold">No WA Tujuan</td>
                      <td className="p-3 border-r border-slate-800">Teks Nomor Telepon</td>
                      <td className="p-3 font-mono">081234567890</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono border-r border-slate-800 font-bold text-blue-400">G (7)</td>
                      <td className="p-3 border-r border-slate-800 font-semibold">Status Notifikasi</td>
                      <td className="p-3 border-r border-slate-800">Teks Status</td>
                      <td className="p-3 font-semibold text-emerald-400">Belum Terkirim / Terkirim</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all cursor-pointer"
          >
            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? 'Tersalin ke Clipboard!' : 'Salin Kode Code.gs'}</span>
          </button>

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
