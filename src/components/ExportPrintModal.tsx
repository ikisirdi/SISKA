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

  // Export to XLSX spreadsheet
  const handleExportExcel = () => {
    const excelData = records.map((r, index) => {
      const statusInfo = getSKStatus(r.tanggalKadaluarsa);
      return {
        'No': index + 1,
        'Nama Identitas / Pegawai': r.namaIdentitas || '-',
        'Jenis Dokumen': r.jenisDokumen || '-',
        'Nomor SK / Dokumen': r.noSK,
        'TMT (Terhitung Mulai Tanggal)': r.tanggalBuat,
        'Masa Berlaku': r.durasiBerlaku,
        'Tanggal Kadaluarsa': r.tanggalKadaluarsa,
        'Status Masa Berlaku': statusInfo.status,
        'Sisa Hari': statusInfo.daysRemaining,
        'Email Tujuan': r.emailTujuan,
        'No WhatsApp': r.noWATujuan,
        'Status Notifikasi': r.statusNotifikasi || 'Belum Terkirim'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set auto column width
    const colWidths = [
      { wch: 5 },
      { wch: 30 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 10 },
      { wch: 28 },
      { wch: 16 },
      { wch: 18 }
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Monitoring SK');

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Laporan_Monitoring_SK_${dateStr}.xlsx`);
  };

  // Trigger Print Laporan
  const handlePrint = () => {
    window.print();
  };

  const currentDateFormatted = formatIndonesianDate(new Date().toISOString().split('T')[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden my-auto print:border-0 print:shadow-none print:w-full print:max-w-none print:rounded-none print:bg-white print:text-black">
        
        {/* Modal Header (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Cetak Laporan & Export Excel</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pratinjau dokumen resmi dengan Kop Surat & opsi unduh Excel (.xlsx)</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download File Excel (.xlsx)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Print PDF</span>
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
          
          {/* Gambar Kop Surat */}
          <div className="w-full flex flex-col items-center justify-center mb-4 border-b border-slate-300 dark:border-slate-700 pb-3 print:border-black">
            <img
              src="/kop_surat.png"
              alt="Kop Surat Resmi"
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
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-slate-900 dark:text-white print:text-black">
                PEMERINTAH REPUBLIK INDONESIA
              </h1>
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 print:text-black mt-0.5">
                KANTOR DINAS KEDINASAN & MANAJEMEN KEPEGAWAIAN
              </h2>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 print:text-slate-700 mt-1">
                Jalan Utama Perkantoran No. 01 | Telp: (021) 555-0199 | Email: sekretariat@dinas.go.id
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
