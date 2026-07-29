import React, { useRef } from 'react';
import { SKRecord } from '../types';
import { formatIndonesianDate, getSKStatus } from '../utils/dateUtils';
import { X, Printer, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SKRecord[];
}

export const ExportPrintModal: React.FC<ExportPrintModalProps> = ({
  isOpen,
  onClose,
  records
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Export to MS Word (.doc/.docx) format with Kop Surat
  const handleExportWord = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const tableRowsHtml = records.map((r, index) => {
      const statusInfo = getSKStatus(r.tanggalKadaluarsa);
      return `
        <tr>
          <td style="border:1px solid #333; padding:6px; text-align:center;">${index + 1}</td>
          <td style="border:1px solid #333; padding:6px;"><b>${r.namaIdentitas || '-'}</b></td>
          <td style="border:1px solid #333; padding:6px;">${r.jenisDokumen || '-'}</td>
          <td style="border:1px solid #333; padding:6px; font-family:monospace;">${r.noSK}</td>
          <td style="border:1px solid #333; padding:6px; text-align:center;">${formatIndonesianDate(r.tanggalBuat)}</td>
          <td style="border:1px solid #333; padding:6px; text-align:center;">${r.durasiBerlaku}</td>
          <td style="border:1px solid #333; padding:6px; text-align:center;"><b>${formatIndonesianDate(r.tanggalKadaluarsa)}</b></td>
          <td style="border:1px solid #333; padding:6px; text-align:center;">${statusInfo.status}</td>
        </tr>
      `;
    }).join('');

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Laporan Rekapitulasi SK</title>
        <style>
          @page { size: A4 portrait; margin: 20mm 15mm 20mm 15mm; }
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #000; }
          h1 { font-size: 13pt; text-align: center; margin: 0; padding: 0; }
          h2 { font-size: 11pt; text-align: center; margin: 4px 0; }
          p { margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10pt; }
          th { background-color: #e2e8f0; border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold; }
          td { border: 1px solid #333; padding: 6px; }
          .signature-table { width: 100%; margin-top: 35px; border: none; }
          .signature-table td { border: none; text-align: center; }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 12px;">
          <img src="${window.location.origin}/kop%20surat.png" style="width: 100%; max-height: 140px; object-fit: contain;" alt="Kop Surat Resmi" />
          <div style="border-bottom: 3px double #000; margin-top: 8px;"></div>
        </div>

        <h1 style="text-transform: uppercase;">LAPORAN REKAPITULASI MONITORING SURAT KEPUTUSAN (SK)</h1>
        <h2 style="font-weight: normal; font-size: 10pt;">Dokumen KGB (Kenaikan Gaji Berkala), KENPAN, dan SK Kedinasan</h2>
        <p style="text-align: center; font-size: 9pt; color: #444;">Tanggal Cetak Laporan: ${currentDateFormatted} | Total Records: ${records.length} Dokumen</p>

        <table>
          <thead>
            <tr>
              <th width="5%">No</th>
              <th width="24%">Nama Identitas / NIP</th>
              <th width="15%">Jenis Dokumen</th>
              <th width="18%">Nomor SK</th>
              <th width="10%">TMT</th>
              <th width="7%">Masa</th>
              <th width="11%">Kadaluarsa</th>
              <th width="10%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <table class="signature-table">
          <tr>
            <td width="50%">
              <p>Mengetahui,</p>
              <p><b>Pengelola SK & Monitoring</b></p>
              <br/><br/><br/>
              <p><u><b>Idris</b></u></p>
              <p style="font-size: 9pt; color: #555;">NIP. Administrative Specialist</p>
            </td>
            <td width="50%">
              <p>Dicetak Pada,</p>
              <p><b>${currentDateFormatted}</b></p>
              <br/><br/><br/>
              <p><u><b>Sistem Monitoring SK</b></u></p>
              <p style="font-size: 9pt; color: #555;">Verifikasi Digital Verified</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordHtml], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Monitoring_SK_${dateStr}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Trigger Print Laporan Resmi A4 (Modal Content)
  const handlePrint = () => {
    window.print();
  };

  // Trigger Print Tampilan Aplikasi / Dashboard Screenshot View
  const handlePrintDashboard = () => {
    onClose();
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const currentDateFormatted = formatIndonesianDate(new Date().toISOString().split('T')[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden my-auto print:border-0 print:shadow-none print:w-full print:max-w-none print:rounded-none print:bg-white print:text-black">
        
        {/* Modal Header (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Cetak Laporan A4 & Export Word</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pilih format cetak resmi A4 (Kop Surat) atau screenshot tampilan dashboard aplikasi</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportWord}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-700/20 transition-all cursor-pointer"
              title="Unduh sebagai file dokumen Microsoft Word"
            >
              <FileText className="w-4 h-4" />
              <span>Cetak Word (.doc)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              title="Cetak Laporan Format Resmi A4 (Dokumen Kop Surat)"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak PDF Laporan A4</span>
            </button>

            <button
              onClick={handlePrintDashboard}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              title="Cetak Screenshot / Tampilan Halaman Dashboard Aplikasi"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Tampilan Aplikasi</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Document Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0" ref={printRef}>
          
          {/* Gambar Kop Surat Pengadilan Agama Paniai */}
          <div className="w-full flex flex-col items-center justify-center mb-4 border-b border-slate-300 dark:border-slate-700 pb-3 print:border-black">
            <img
              src="/kop_surat.png"
              alt="Kop Surat Pengadilan Agama Paniai"
              className="w-full max-h-40 object-contain print:max-h-44 print:w-full print:block"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedEscaped) {
                  target.dataset.triedEscaped = 'true';
                  target.src = '/kop%20surat.png';
                } else {
                  target.style.display = 'none';
                  const fallbackEl = document.getElementById('kop-fallback-header');
                  if (fallbackEl) fallbackEl.style.display = 'block';
                }
              }}
            />
            {/* Fallback Kop Surat Header jika gambar tidak dapat dimuat */}
            <div id="kop-fallback-header" className="hidden text-center w-full py-2">
              <h1 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 print:text-black">
                MAHKAMAH AGUNG REPUBLIK INDONESIA
              </h1>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 print:text-black mt-0.5">
                DIREKTORAT JENDERAL BADAN PERADILAN AGAMA
              </h2>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 print:text-black mt-0.5">
                PENGADILAN TINGGI AGAMA JAYAPURA
              </h2>
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900 dark:text-white print:text-black mt-1">
                PENGADILAN AGAMA PANIAI
              </h1>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 print:text-slate-700 mt-1">
                Kompleks Kantor Bupati Paniai, Paniai Timur, Paniai | Telp. 085244544676
              </p>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 print:text-black">
                www.pa-paniai.go.id, pengadilan.agama.paniai@gmail.com
              </p>
              <div className="w-full border-b-4 border-double border-slate-900 dark:border-slate-100 print:border-black mt-2"></div>
            </div>
          </div>

          {/* Document Header Text */}
          <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900 dark:border-slate-100 print:border-black">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white print:text-black">
              LAPORAN REKAPITULASI MONITORING SURAT KEPUTUSAN (SK)
            </h2>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 print:text-slate-700">
              Dokumen KGB (Kenaikan Gaji Berkala), KENPAN (Kenaikan Pangkat), dan SK Kedinasan
            </p>
            <p className="text-[11px] font-mono text-slate-500 print:text-slate-600">
              Tanggal Cetak Laporan: {currentDateFormatted} | Total Records: {records.length} Dokumen
            </p>
          </div>

          {/* Document Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse border border-slate-300 dark:border-slate-700 print:border-black">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 print:bg-gray-200 print:text-black font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-2 border border-slate-300 dark:border-slate-700 print:border-black text-center w-8">No</th>
                  <th className="py-2.5 px-3 border border-slate-300 dark:border-slate-700 print:border-black">Nama Identitas / NIP</th>
                  <th className="py-2.5 px-3 border border-slate-300 dark:border-slate-700 print:border-black">Jenis Dokumen</th>
                  <th className="py-2.5 px-3 border border-slate-300 dark:border-slate-700 print:border-black">Nomor SK</th>
                  <th className="py-2.5 px-3 border border-slate-300 dark:border-slate-700 print:border-black text-center">TMT</th>
                  <th className="py-2.5 px-2 border border-slate-300 dark:border-slate-700 print:border-black text-center">Masa</th>
                  <th className="py-2.5 px-3 border border-slate-300 dark:border-slate-700 print:border-black text-center">Kadaluarsa</th>
                  <th className="py-2.5 px-3 border border-slate-300 dark:border-slate-700 print:border-black text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-black">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      Tidak ada data SK tercatat.
                    </td>
                  </tr>
                ) : (
                  records.map((r, index) => {
                    const statusInfo = getSKStatus(r.tanggalKadaluarsa);
                    return (
                      <tr key={r.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-850 print:bg-white">
                        <td className="py-2 px-2 border border-slate-300 dark:border-slate-700 print:border-black text-center font-bold">
                          {index + 1}
                        </td>
                        <td className="py-2 px-3 border border-slate-300 dark:border-slate-700 print:border-black font-semibold text-slate-900 dark:text-white print:text-black">
                          {r.namaIdentitas || '-'}
                        </td>
                        <td className="py-2 px-3 border border-slate-300 dark:border-slate-700 print:border-black font-medium text-blue-700 dark:text-blue-300 print:text-black">
                          {r.jenisDokumen || '-'}
                        </td>
                        <td className="py-2 px-3 border border-slate-300 dark:border-slate-700 print:border-black font-mono font-medium">
                          {r.noSK}
                        </td>
                        <td className="py-2 px-3 border border-slate-300 dark:border-slate-700 print:border-black text-center whitespace-nowrap">
                          {formatIndonesianDate(r.tanggalBuat)}
                        </td>
                        <td className="py-2 px-2 border border-slate-300 dark:border-slate-700 print:border-black text-center font-bold">
                          {r.durasiBerlaku}
                        </td>
                        <td className="py-2 px-3 border border-slate-300 dark:border-slate-700 print:border-black text-center font-mono font-bold whitespace-nowrap">
                          {formatIndonesianDate(r.tanggalKadaluarsa)}
                        </td>
                        <td className="py-2 px-3 border border-slate-300 dark:border-slate-700 print:border-black text-center font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            statusInfo.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-800 print:bg-transparent print:text-black'
                              : statusInfo.status === 'Segera Kadaluarsa'
                              ? 'bg-amber-100 text-amber-800 print:bg-transparent print:text-black'
                              : 'bg-rose-100 text-rose-800 print:bg-transparent print:text-black'
                          }`}>
                            {statusInfo.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Official Signature Section */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs print:pt-12 print:text-black">
            <div>
              <p className="text-slate-500 print:text-black">Mengetahui,</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 print:text-black mt-1">Pengelola SK & Monitoring</p>
              <div className="h-16"></div>
              <p className="font-bold underline text-slate-900 dark:text-white print:text-black">Idris</p>
              <p className="text-[10px] text-slate-500 print:text-black">NIP. Administrative Specialist</p>
            </div>

            <div>
              <p className="text-slate-500 print:text-black">Dicetak Pada,</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 print:text-black mt-1">{currentDateFormatted}</p>
              <div className="h-16"></div>
              <p className="font-bold underline text-slate-900 dark:text-white print:text-black">Sistem Monitoring SK</p>
              <p className="text-[10px] text-slate-500 print:text-black">Verifikasi Digital Verified</p>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden on Print) */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center print:hidden">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gunakan tombol <span className="font-semibold text-blue-600 dark:text-blue-400">Cetak / Print PDF</span> untuk mencetak dokumen resmi lengkap dengan Kop Surat.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
