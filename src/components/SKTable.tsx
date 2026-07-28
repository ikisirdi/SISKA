import React, { useState } from 'react';
import { SKRecord, StatusFilter } from '../types';
import { getSKStatus, formatIndonesianDate } from '../utils/dateUtils';
import { Search, Filter, RefreshCw, Trash2, Edit3, Mail, Phone, Send, Copy, Check, AlertCircle, FileText, ExternalLink } from 'lucide-react';

interface SKTableProps {
  records: SKRecord[];
  activeFilter: StatusFilter;
  onSelectFilter: (filter: StatusFilter) => void;
  onRefresh: () => void;
  onEditRecord: (record: SKRecord) => void;
  onDeleteRecord: (id: string, noSK?: string) => void;
  onTriggerManualNotification: (record: SKRecord) => void;
  isLoading: boolean;
}

export const SKTable: React.FC<SKTableProps> = ({
  records,
  activeFilter,
  onSelectFilter,
  onRefresh,
  onEditRecord,
  onDeleteRecord,
  onTriggerManualNotification,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter records based on search query and active tab filter
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.noSK.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.emailTujuan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.noWATujuan.includes(searchQuery);

    if (!matchesSearch) return false;

    const statusInfo = getSKStatus(r.tanggalKadaluarsa);

    if (activeFilter === 'Semua') return true;
    if (activeFilter === 'Aktif') return statusInfo.status === 'Aktif';
    if (activeFilter === 'Segera Kadaluarsa') return statusInfo.status === 'Segera Kadaluarsa';
    if (activeFilter === 'Kadaluarsa') return statusInfo.status === 'Kadaluarsa';
    if (activeFilter === 'Terkirim') return r.statusNotifikasi === 'Terkirim';

    return true;
  });

  const handleCopyNoSK = (id: string, noSK: string) => {
    navigator.clipboard.writeText(noSK);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden" id="sk-summary-table">
      {/* Header & Filter Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Ringkasan Data SK</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan {filteredRecords.length} dari total {records.length} Surat Keputusan
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              id="btn-refresh-sk-table"
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              title="Refresh data dari Google Sheets / Local Storage"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="input-search-sk"
              placeholder="Cari No SK, Email, atau No WA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {(['Semua', 'Aktif', 'Segera Kadaluarsa', 'Kadaluarsa', 'Terkirim'] as StatusFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => onSelectFilter(tab)}
                id={`filter-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4">No SK</th>
              <th className="py-3.5 px-4">Tanggal Buat</th>
              <th className="py-3.5 px-4">Durasi</th>
              <th className="py-3.5 px-4">Tanggal Kadaluarsa & Status</th>
              <th className="py-3.5 px-4">Kontak Tujuan (Email & WA)</th>
              <th className="py-3.5 px-4">Status Notifikasi</th>
              <th className="py-3.5 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">Tidak ada data SK ditemukan</p>
                    <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau ganti filter status.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => {
                const statusInfo = getSKStatus(r.tanggalKadaluarsa);
                const isTerkirim = r.statusNotifikasi === 'Terkirim';

                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    {/* No SK */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span>{r.noSK}</span>
                        <button
                          onClick={() => handleCopyNoSK(r.id || '', r.noSK)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                          title="Salin No SK"
                        >
                          {copiedId === r.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Tanggal Buat */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatIndonesianDate(r.tanggalBuat)}
                    </td>

                    {/* Durasi Berlaku */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {r.durasiBerlaku}
                      </span>
                    </td>

                    {/* Tanggal Kadaluarsa & Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                          {formatIndonesianDate(r.tanggalKadaluarsa)}
                        </span>
                        <span
                          className={`inline-flex items-center w-max px-2 py-0.5 rounded-md text-[11px] font-bold border ${statusInfo.badgeColor}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                    </td>

                    {/* Email & WA */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-slate-700 dark:text-slate-300">
                          <Mail className="w-3.5 h-3.5 mr-1.5 text-blue-500 shrink-0" />
                          <span className="truncate max-w-[180px]">{r.emailTujuan}</span>
                        </div>
                        <div className="flex items-center text-slate-700 dark:text-slate-300">
                          <Phone className="w-3.5 h-3.5 mr-1.5 text-emerald-500 shrink-0" />
                          <span className="font-mono">{r.noWATujuan}</span>
                        </div>
                      </div>
                    </td>

                    {/* Status Notifikasi */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          isTerkirim
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            isTerkirim ? 'bg-blue-500' : 'bg-slate-400'
                          }`}
                        />
                        {r.statusNotifikasi || 'Belum Terkirim'}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        {/* Send Manual Notification */}
                        <button
                          onClick={() => onTriggerManualNotification(r)}
                          id={`btn-manual-notif-${r.id}`}
                          className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
                          title="Kirim / Tes Notifikasi Email & WA"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Record */}
                        <button
                          onClick={() => onEditRecord(r)}
                          id={`btn-edit-${r.id}`}
                          className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-all cursor-pointer"
                          title="Edit Data SK"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Record */}
                        <button
                          onClick={() => {
                            if (confirm(`Hapus SK ${r.noSK}?`)) {
                              onDeleteRecord(r.id || '', r.noSK);
                            }
                          }}
                          id={`btn-delete-${r.id}`}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
                          title="Hapus Data SK"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
