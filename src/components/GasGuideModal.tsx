import React, { useState } from 'react';
import { X, Copy, Check, Code, Database, Zap, Clock, ShieldCheck, ExternalLink, HelpCircle, FileSpreadsheet } from 'lucide-react';

interface GasGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GAS_CODE_GS = `/**
 * BACKEND GOOGLE APPS SCRIPT (Code.gs)
 * Dashboard Manajemen SK & Dokumen (KGB, KENPAN, SK Kedinasan)
 * 
 * PENTING: Setiap kali mengubah kode ini, lakukan Deployment Ulang:
 * Deploy > Manage deployments > Edit (Ikon Pensil) > Version: "New version" > Deploy
 */

// KONFIGURASI NAMA SHEET & API WHATSAPP
const SHEET_NAME = "DataSK"; // Nama Sheet tab di Google Sheets
const FONNTE_API_TOKEN = "GANTI_DENGAN_TOKEN_FONNTE_ANDA"; // Token dari fonnte.com (Opsional)
const SENDER_EMAIL_NAME = "Sistem Notifikasi SK Kantor";

/** Helper: Normalisasi No SK untuk pencocokan 100% presisi (abaikan spasi, huruf kecil/besar, slash, strip karakter khusus) */
function normalizeSK(str) {
  if (!str) return "";
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Helper Response JSON dengan MIME type */
function responseJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Helper Sheet Getter / Auto-Create Header 9 Kolom */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "Nama Identitas",
      "Jenis Dokumen",
      "No SK",
      "Tanggal Buat",
      "Durasi Berlaku",
      "Tanggal Kadaluarsa",
      "Email Tujuan",
      "No WA Tujuan",
      "Status Notifikasi"
    ]);
    sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#e2e8f0");
  }
  return sheet;
}

/** Format Tanggal YYYY-MM-DD */
function formatDate(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(val).trim();
}

/**
 * 1. FUNGSI GET API (doGet)
 * Menangani Fetch List SK, serta Delete & Update via GET Parameters
 */
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || "getSKList";

    // A. DELETE SK via GET Parameter
    if (action === "deleteSK") {
      const targetNoSK = params.noSK || "";
      return executeDeleteSK(sheet, targetNoSK);
    }

    // B. UPDATE SK via GET Parameter
    if (action === "updateSK") {
      return executeUpdateSK(sheet, params);
    }

    // C. GET ALL SK LIST
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return responseJSON({ status: "success", data: [] });
    }

    const records = [];
    const is9Col = data[0].length >= 9 && data[0][0] === "Nama Identitas";

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] && !row[2]) continue; // Skip baris kosong
      
      if (is9Col) {
        records.push({
          id: "sk-row-" + (i + 1),
          namaIdentitas: String(row[0] || "").trim(),
          jenisDokumen: String(row[1] || "").trim(),
          noSK: String(row[2] || "").trim(),
          tanggalBuat: formatDate(row[3]),
          durasiBerlaku: String(row[4] || "").trim(),
          tanggalKadaluarsa: formatDate(row[5]),
          emailTujuan: String(row[6] || "").trim(),
          noWATujuan: String(row[7] || "").trim(),
          statusNotifikasi: String(row[8] || "Belum Terkirim").trim()
        });
      } else {
        // Fallback format 7 kolom lama
        records.push({
          id: "sk-row-" + (i + 1),
          namaIdentitas: "-",
          jenisDokumen: "SK Biasa",
          noSK: String(row[0] || "").trim(),
          tanggalBuat: formatDate(row[1]),
          durasiBerlaku: String(row[2] || "").trim(),
          tanggalKadaluarsa: formatDate(row[3]),
          emailTujuan: String(row[4] || "").trim(),
          noWATujuan: String(row[5] || "").trim(),
          statusNotifikasi: String(row[6] || "Belum Terkirim").trim()
        });
      }
    }

    return responseJSON({ status: "success", data: records });
  } catch (error) {
    return responseJSON({ status: "error", message: error.toString() });
  }
}

/**
 * 2. FUNGSI POST API (doPost)
 * Menangani Input (Tambah), Update (Edit), Delete (Hapus), & Trigger Notifikasi
 */
function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    let contents = {};

    if (e && e.postData && e.postData.contents) {
      try {
        contents = JSON.parse(e.postData.contents);
      } catch (err) {
        contents = e.parameter || {};
      }
    } else if (e && e.parameter) {
      contents = e.parameter;
    }

    const params = (e && e.parameter) ? e.parameter : {};
    const action = contents.action || params.action || "createSK";

    // 1. ACTION: DELETE SK
    if (action === "deleteSK") {
      const targetNoSK = contents.noSK || params.noSK || "";
      return executeDeleteSK(sheet, targetNoSK);
    }

    // 2. ACTION: UPDATE SK
    if (action === "updateSK") {
      const payload = {
        namaIdentitas: contents.namaIdentitas || params.namaIdentitas || "",
        jenisDokumen: contents.jenisDokumen || params.jenisDokumen || "",
        noSK: contents.noSK || params.noSK || "",
        tanggalBuat: contents.tanggalBuat || params.tanggalBuat || "",
        durasiBerlaku: contents.durasiBerlaku || params.durasiBerlaku || "",
        tanggalKadaluarsa: contents.tanggalKadaluarsa || params.tanggalKadaluarsa || "",
        emailTujuan: contents.emailTujuan || params.emailTujuan || "",
        noWATujuan: contents.noWATujuan || params.noWATujuan || "",
        statusNotifikasi: contents.statusNotifikasi || params.statusNotifikasi || "Belum Terkirim"
      };
      return executeUpdateSK(sheet, payload);
    }

    // 3. ACTION: TRIGGER NOTIFIKASI
    if (action === "triggerNotification" || action === "sendNotification") {
      const email = contents.emailTujuan || params.emailTujuan || "";
      const noSK = contents.noSK || params.noSK || "";
      const nama = contents.namaIdentitas || params.namaIdentitas || "-";
      const jenis = contents.jenisDokumen || params.jenisDokumen || "SK";
      const tglBuat = contents.tanggalBuat || params.tanggalBuat || "";
      const durasi = contents.durasiBerlaku || params.durasiBerlaku || "";
      const tglKadaluarsa = contents.tanggalKadaluarsa || params.tanggalKadaluarsa || "";
      const noWA = contents.noWATujuan || params.noWATujuan || "";

      if (email) sendEmailNotification(email, nama, jenis, noSK, tglBuat, durasi, tglKadaluarsa);
      if (noWA) sendWhatsAppNotification(noWA, nama, jenis, noSK, tglBuat, durasi, tglKadaluarsa);

      if (noSK) {
        const data = sheet.getDataRange().getValues();
        const normTarget = normalizeSK(noSK);
        for (let i = 1; i < data.length; i++) {
          const colNoSK = data[0][0] === "Nama Identitas" ? data[i][2] : data[i][0];
          if (normalizeSK(colNoSK) === normTarget) {
            const statusColIdx = data[0][0] === "Nama Identitas" ? 9 : 7;
            sheet.getRange(i + 1, statusColIdx).setValue("Terkirim");
            break;
          }
        }
      }

      return responseJSON({
        status: "success",
        message: "Notifikasi untuk Dokumen " + noSK + " berhasil diproses!"
      });
    }

    // 4. ACTION: CREATE / INPUT DATA BARU
    if (action === "createSK" || action === "addSK") {
      const namaIdentitas = contents.namaIdentitas || params.namaIdentitas || "";
      const jenisDokumen = contents.jenisDokumen || params.jenisDokumen || "";
      const noSK = contents.noSK || params.noSK || "";
      const tanggalBuat = contents.tanggalBuat || params.tanggalBuat || "";
      const durasiBerlaku = contents.durasiBerlaku || params.durasiBerlaku || "";
      const tanggalKadaluarsa = contents.tanggalKadaluarsa || params.tanggalKadaluarsa || "";
      const emailTujuan = contents.emailTujuan || params.emailTujuan || "";
      const noWATujuan = contents.noWATujuan || params.noWATujuan || "";
      const statusNotifikasi = contents.statusNotifikasi || params.statusNotifikasi || "Belum Terkirim";

      if (!noSK) {
        return responseJSON({ status: "error", message: "Nomor SK wajib diisi!" });
      }

      // Cek apakah No SK sudah ada, jika ada timpa/update baris tersebut
      const data = sheet.getDataRange().getValues();
      const normTarget = normalizeSK(noSK);
      let existingRow = -1;

      for (let i = 1; i < data.length; i++) {
        const colNoSK = data[0][0] === "Nama Identitas" ? data[i][2] : data[i][0];
        if (normalizeSK(colNoSK) === normTarget) {
          existingRow = i + 1;
          break;
        }
      }

      if (existingRow > 0) {
        return executeUpdateSK(sheet, {
          namaIdentitas, jenisDokumen, noSK, tanggalBuat, durasiBerlaku, tanggalKadaluarsa, emailTujuan, noWATujuan, statusNotifikasi
        });
      } else {
        sheet.appendRow([
          namaIdentitas,
          jenisDokumen,
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
          message: "Data Dokumen " + noSK + " berhasil disimpan ke Google Sheets!"
        });
      }
    }

    return responseJSON({ status: "ignored", message: "Action tidak dikenal: " + action });

  } catch (error) {
    return responseJSON({ status: "error", message: error.toString() });
  }
}

/** Helper: HAPUS (DELETE) Baris SK di Google Sheets */
function executeDeleteSK(sheet, targetNoSK) {
  if (!targetNoSK) {
    return responseJSON({ status: "error", message: "No SK untuk dihapus kosong." });
  }

  const data = sheet.getDataRange().getValues();
  const normTarget = normalizeSK(targetNoSK);
  let deleted = false;

  for (let i = data.length - 1; i >= 1; i--) {
    const colNoSK = data[0][0] === "Nama Identitas" ? data[i][2] : data[i][0];
    if (colNoSK && normalizeSK(colNoSK) === normTarget) {
      sheet.deleteRow(i + 1);
      deleted = true;
      break;
    }
  }

  return responseJSON({
    status: deleted ? "success" : "not_found",
    message: deleted 
      ? "Dokumen SK " + targetNoSK + " berhasil dihapus dari Google Sheets!" 
      : "Dokumen SK " + targetNoSK + " tidak ditemukan di Google Sheets."
  });
}

/** Helper: UPDATE (EDIT) Baris SK di Google Sheets */
function executeUpdateSK(sheet, payload) {
  const targetNoSK = payload.noSK || "";
  if (!targetNoSK) {
    return responseJSON({ status: "error", message: "No SK untuk diperbarui kosong." });
  }

  const data = sheet.getDataRange().getValues();
  const normTarget = normalizeSK(targetNoSK);
  let updated = false;

  for (let i = 1; i < data.length; i++) {
    const colNoSK = data[0][0] === "Nama Identitas" ? data[i][2] : data[i][0];
    if (colNoSK && normalizeSK(colNoSK) === normTarget) {
      const is9Col = data[0][0] === "Nama Identitas";
      
      if (is9Col) {
        if (payload.namaIdentitas) sheet.getRange(i + 1, 1).setValue(payload.namaIdentitas);
        if (payload.jenisDokumen) sheet.getRange(i + 1, 2).setValue(payload.jenisDokumen);
        if (payload.noSK) sheet.getRange(i + 1, 3).setValue(payload.noSK);
        if (payload.tanggalBuat) sheet.getRange(i + 1, 4).setValue(payload.tanggalBuat);
        if (payload.durasiBerlaku) sheet.getRange(i + 1, 5).setValue(payload.durasiBerlaku);
        if (payload.tanggalKadaluarsa) sheet.getRange(i + 1, 6).setValue(payload.tanggalKadaluarsa);
        if (payload.emailTujuan) sheet.getRange(i + 1, 7).setValue(payload.emailTujuan);
        if (payload.noWATujuan) sheet.getRange(i + 1, 8).setValue(payload.noWATujuan);
        if (payload.statusNotifikasi) sheet.getRange(i + 1, 9).setValue(payload.statusNotifikasi);
      } else {
        if (payload.noSK) sheet.getRange(i + 1, 1).setValue(payload.noSK);
        if (payload.tanggalBuat) sheet.getRange(i + 1, 2).setValue(payload.tanggalBuat);
        if (payload.durasiBerlaku) sheet.getRange(i + 1, 3).setValue(payload.durasiBerlaku);
        if (payload.tanggalKadaluarsa) sheet.getRange(i + 1, 4).setValue(payload.tanggalKadaluarsa);
        if (payload.emailTujuan) sheet.getRange(i + 1, 5).setValue(payload.emailTujuan);
        if (payload.noWATujuan) sheet.getRange(i + 1, 6).setValue(payload.noWATujuan);
        if (payload.statusNotifikasi) sheet.getRange(i + 1, 7).setValue(payload.statusNotifikasi);
      }
      updated = true;
      break;
    }
  }

  return responseJSON({
    status: updated ? "success" : "not_found",
    message: updated 
      ? "Dokumen SK " + targetNoSK + " berhasil diperbarui di Google Sheets!" 
      : "Dokumen SK " + targetNoSK + " tidak ditemukan di Google Sheets."
  });
}

/**
 * 3. FUNGSI AUTOMATIC CRON JOB (Jalankan Harian / Sesuai Pemicu Triggers)
 * Pengecekan otomatis kolom 'Tanggal Kadaluarsa'. Jika sisa hari <= 7 hari (termasuk hari ini / H-0),
 * kirim notifikasi Email + WA, lalu update 'Status Notifikasi' menjadi "Terkirim".
 */
function checkAndSendNotifications() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return; // Tidak ada data
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const is9Col = data[0][0] === "Nama Identitas";
  let sentCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    let namaIdentitas = "";
    let jenisDokumen = "";
    let noSK = "";
    let tanggalBuat = "";
    let durasiBerlaku = "";
    let rawKadaluarsa = null;
    let emailTujuan = "";
    let noWATujuan = "";
    let statusNotifikasi = "Belum Terkirim";
    let statusColIndex = 7; // 1-based index untuk update status

    if (is9Col) {
      namaIdentitas = String(row[0] || "").trim();
      jenisDokumen = String(row[1] || "").trim();
      noSK = String(row[2] || "").trim();
      tanggalBuat = formatDate(row[3]);
      durasiBerlaku = String(row[4] || "").trim();
      rawKadaluarsa = row[5];
      emailTujuan = String(row[6] || "").trim();
      noWATujuan = String(row[7] || "").trim();
      statusNotifikasi = String(row[8] || "Belum Terkirim").trim();
      statusColIndex = 9;
    } else {
      noSK = String(row[0] || "").trim();
      tanggalBuat = formatDate(row[1]);
      durasiBerlaku = String(row[2] || "").trim();
      rawKadaluarsa = row[3];
      emailTujuan = String(row[4] || "").trim();
      noWATujuan = String(row[5] || "").trim();
      statusNotifikasi = String(row[6] || "Belum Terkirim").trim();
      statusColIndex = 7;
    }
    
    if (!rawKadaluarsa || !noSK) continue;
    
    let expiryDate;
    if (rawKadaluarsa instanceof Date) {
      expiryDate = new Date(rawKadaluarsa);
    } else {
      const strDate = String(rawKadaluarsa).trim().split("T")[0];
      const parts = strDate.split("-");
      if (parts.length === 3) {
        expiryDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        expiryDate = new Date(rawKadaluarsa);
      }
    }
    expiryDate.setHours(0, 0, 0, 0);
    
    // Hitung selisih hari
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    
    // Kirim jika sisa hari <= 7 (misal H-7, H-3, H-0/Hari ini) dan Status belum "Terkirim"
    if (diffDays <= 7 && statusNotifikasi !== "Terkirim") {
      Logger.log("Mengirim notifikasi otomatis untuk SK: " + noSK + " (Sisa Hari: " + diffDays + ")");
      
      const tglKadaluarsaFormatted = formatDate(expiryDate);
      
      // A. Kirim Email Notifikasi
      if (emailTujuan) {
        sendEmailNotification(emailTujuan, namaIdentitas, jenisDokumen, noSK, tanggalBuat, durasiBerlaku, tglKadaluarsaFormatted);
      }
      
      // B. Kirim WhatsApp Notifikasi (Fonnte API)
      if (noWATujuan) {
        sendWhatsAppNotification(noWATujuan, namaIdentitas, jenisDokumen, noSK, tanggalBuat, durasiBerlaku, tglKadaluarsaFormatted);
      }
      
      // C. Update kolom 'Status Notifikasi' di Google Sheets menjadi "Terkirim"
      sheet.getRange(i + 1, statusColIndex).setValue("Terkirim");
      sentCount++;

      // Jeda 1.5 detik per iterasi untuk menghindari API rate limit & memastikan pengiriman asinkron stabil
      Utilities.sleep(1500);
    }
  }
  
  Logger.log("Selesai mengecek. Total notifikasi terkirim hari ini: " + sentCount);
}

/**
 * 4. HELPER: KIRIM EMAIL NOTIFIKASI
 */
function sendEmailNotification(toEmail, namaIdentitas, jenisDokumen, noSK, tanggalBuat, durasi, tglKadaluarsa) {
  const subject = "[PENGINGAT KADALUARSA] " + (jenisDokumen || "SK") + " No " + noSK + " - " + (namaIdentitas || "");
  
  const htmlBody = '<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 10px;">' +
    '<h2 style="color: #1e3a8a;">Pemberitahuan Kadaluarsa Dokumen / SK</h2>' +
    '<p>Halo, ini adalah pengingat otomatis dari <b>Sistem Monitoring SK & Kepegawaian</b>.</p>' +
    '<div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 6px; margin: 15px 0;">' +
      '<table style="width: 100%; font-size: 14px; border-collapse: collapse;">' +
        '<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0;"><b>Nama Identitas:</b></td><td>' + (namaIdentitas || "-") + '</td></tr>' +
        '<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0;"><b>Jenis Dokumen:</b></td><td>' + (jenisDokumen || "-") + '</td></tr>' +
        '<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0;"><b>Nomor SK:</b></td><td>' + noSK + '</td></tr>' +
        '<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0;"><b>Tanggal Buat / TMT:</b></td><td>' + tanggalBuat + '</td></tr>' +
        '<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 6px 0;"><b>Masa Berlaku:</b></td><td>' + durasi + '</td></tr>' +
        '<tr><td style="padding: 6px 0;"><b>Tanggal Kadaluarsa:</b></td><td><span style="color: #dc2626; font-weight: bold;">' + tglKadaluarsa + '</span></td></tr>' +
      '</table>' +
    '</div>' +
    '<p>Mohon segera lakukan proses perpanjangan atau pembaruan berkas terkait.</p>' +
    '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />' +
    '<p style="font-size: 11px; color: #64748b;">Email ini dikirim otomatis oleh Sistem Serverless Monitoring SK.</p>' +
  '</div>';
  
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
 * 5. HELPER: KIRIM WHATSAPP NOTIFIKASI (Fonnte API Gateway)
 */
function sendWhatsAppNotification(noWA, namaIdentitas, jenisDokumen, noSK, tanggalBuat, durasi, tglKadaluarsa) {
  const message = "⚠️ *PENGINGAT KADALUARSA DOKUMEN* ⚠️\n\n" +
    "👤 Nama: *" + (namaIdentitas || "-") + "*\n" +
    "📁 Jenis Dokumen: *" + (jenisDokumen || "SK") + "*\n" +
    "📄 Nomor SK: *" + noSK + "*\n" +
    "📅 Tanggal Buat: " + tanggalBuat + "\n" +
    "⏳ Masa Berlaku: " + durasi + "\n" +
    "🚨 Tanggal Kadaluarsa: *" + tglKadaluarsa + "*\n\n" +
    "_Mohon segera diproses perpanjangannya._\n" +
    "*Sistem Monitoring SK & Kepegawaian*";
  
  // Format nomor HP ke 628xxx (JANGAN sertakan countryCode jika nomor sudah diawali 62)
  let cleanWA = String(noWA).replace(/[^0-9]/g, '');
  if (cleanWA.startsWith('0')) {
    cleanWA = '62' + cleanWA.substring(1);
  } else if (cleanWA.startsWith('8')) {
    cleanWA = '62' + cleanWA;
  }
  
  if (FONNTE_API_TOKEN === "hknvP2hZXsbcnmpNgiBn" || FONNTE_API_TOKEN === "GANTI_DENGAN_TOKEN_FONNTE_ANDA" || !FONNTE_API_TOKEN) {
    Logger.log("[WA SIMULASI] Pesan WA siap dikirim ke " + cleanWA + ": " + message);
    return;
  }
  
  try {
    const payload = {
      target: cleanWA,
      message: message,
      delay: '2'
      // CATATAN FONNTE: Karena target sudah diawali '62', JANGAN kirim countryCode: '62'
      // agar Fonnte tidak mengubahnya menjadi 62628... yang membuat status: sent tapi state: 0 di Fonnte dashboard.
    };
    
    const options = {
      method: 'post',
      headers: {
        'Authorization': FONNTE_API_TOKEN
      },
      payload: payload,
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch('https://api.fonnte.com/send', options);
    const statusCode = response.getResponseCode();
    const resText = response.getContentText();
    Logger.log("Fonnte HTTP " + statusCode + " Response: " + resText);

    if (statusCode >= 200 && statusCode < 300) {
      Logger.log("✅ Pesan WA berhasil dikirim via Fonnte Gateway ke " + cleanWA);
    } else {
      Logger.log("⚠️ Fonnte merespon error code: " + statusCode + " - " + resText);
    }
  } catch (err) {
    Logger.log("❌ Error fatal UrlFetchApp Fonnte WA: " + err.toString());
  }
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
              {/* Important update banner */}
              <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200 text-[11px] leading-relaxed flex items-start space-x-2.5 shadow">
                <span className="text-amber-400 font-bold text-sm shrink-0">⚠️</span>
                <div>
                  <strong className="font-bold text-amber-300">PENTING (Update Deployment Web App):</strong> Jika Anda pernah mendeploy Web App ini sebelumnya, harapkan <strong>copy ulang seluruh kode Code.gs</strong> di bawah ini, lalu di editor Apps Script klik: 
                  <span className="font-mono bg-amber-900/50 px-1 py-0.5 rounded ml-1">Deploy &gt; Manage deployments &gt; Edit (Pensil) &gt; Version: "New version" &gt; Deploy</span>. Langkah ini wajib dilakukan agar Google Sheets mengenali perintah <strong>HAPUS SK</strong> dan <strong>EDIT SK</strong>.
                </div>
              </div>

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
