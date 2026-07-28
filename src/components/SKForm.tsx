import React, { useState, useEffect } from 'react';
import { SKFormInput, SKRecord } from '../types';
import { calculateExpiryDate, formatIndonesianDate, formatPhoneNumber } from '../utils/dateUtils';
import { PlusCircle, Calendar, Mail, Phone, FileText, Clock, Check, Sparkles, Send } from 'lucide-react';

interface SKFormProps {
  onSubmitSK: (newSK: Omit<SKRecord, 'id' | 'statusNotifikasi'>) => Promise<void>;
  isSubmitting: boolean;
}

export const SKForm: React.FC<SKFormProps> = ({ onSubmitSK, isSubmitting }) => {
  const [formData, setFormData] = useState<SKFormInput>({
    noSK: '',
    tanggalBuat: new Date().toISOString().split('T')[0], // Default today
    durasiPilihan: '1 Tahun',
    customTahun: 2,
    emailTujuan: '',
    noWATujuan: ''
  });

  const [calculatedExpiry, setCalculatedExpiry] = useState<string>('');
  const [durasiLabel, setDurasiLabel] = useState<string>('1 Tahun');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Calculate Expiry Date automatically whenever Tanggal Buat, durasiPilihan, or customTahun changes
  useEffect(() => {
    let years = 1;
    let label = '1 Tahun';

    if (formData.durasiPilihan === '1 Tahun') {
      years = 1;
      label = '1 Tahun';
    } else if (formData.durasiPilihan === '3 Tahun') {
      years = 3;
      label = '3 Tahun';
    } else if (formData.durasiPilihan === '5 Tahun') {
      years = 5;
      label = '5 Tahun';
    } else if (formData.durasiPilihan === 'Custom') {
      years = Math.max(1, Number(formData.customTahun) || 1);
      label = `${years} Tahun (Custom)`;
    }

    setDurasiLabel(label);

    if (formData.tanggalBuat) {
      const expiry = calculateExpiryDate(formData.tanggalBuat, years);
      setCalculatedExpiry(expiry);
    } else {
      setCalculatedExpiry('');
    }
  }, [formData.tanggalBuat, formData.durasiPilihan, formData.customTahun]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.noSK.trim()) {
      alert('Silakan isi Nomor SK.');
      return;
    }
    if (!formData.emailTujuan.trim()) {
      alert('Silakan isi Email Tujuan.');
      return;
    }
    if (!formData.noWATujuan.trim()) {
      alert('Silakan isi Nomor WhatsApp Tujuan.');
      return;
    }

    const cleanedWA = formatPhoneNumber(formData.noWATujuan);

    const recordToSubmit = {
      noSK: formData.noSK.trim(),
      tanggalBuat: formData.tanggalBuat,
      durasiBerlaku: durasiLabel,
      tanggalKadaluarsa: calculatedExpiry,
      emailTujuan: formData.emailTujuan.trim(),
      noWATujuan: cleanedWA
    };

    await onSubmitSK(recordToSubmit);

    // Show temporary success feedback & reset form
    setSuccessMsg(`SK ${formData.noSK} berhasil ditambahkan! Expire: ${formatIndonesianDate(calculatedExpiry)}`);
    setTimeout(() => setSuccessMsg(''), 5000);

    setFormData({
      noSK: '',
      tanggalBuat: new Date().toISOString().split('T')[0],
      durasiPilihan: '1 Tahun',
      customTahun: 2,
      emailTujuan: '',
      noWATujuan: ''
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 mb-8" id="sk-form-container">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Tambah Surat Keputusan Baru</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Input data SK untuk disimpan ke Google Sheets & notifikasi otomatis</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Field 1: Nomor SK */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="noSK">
              Nomor SK <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="noSK"
                required
                placeholder="Contoh: 005/SK-DIR/HRD/VII/2026"
                value={formData.noSK}
                onChange={(e) => setFormData({ ...formData, noSK: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Field 2: Tanggal Buat */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="tanggalBuat">
              Tanggal Buat SK <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                id="tanggalBuat"
                required
                value={formData.tanggalBuat}
                onChange={(e) => setFormData({ ...formData, tanggalBuat: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Field 3: Masa Berlaku (Dropdown + Custom) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="durasiPilihan">
              Masa Berlaku <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2 relative">
                <select
                  id="durasiPilihan"
                  value={formData.durasiPilihan}
                  onChange={(e) => setFormData({ ...formData, durasiPilihan: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="1 Tahun">1 Tahun</option>
                  <option value="3 Tahun">3 Tahun</option>
                  <option value="5 Tahun">5 Tahun</option>
                  <option value="Custom">Custom (Isi Jumlah Tahun)</option>
                </select>
              </div>

              {/* Show Custom Input if "Custom" is selected */}
              {formData.durasiPilihan === 'Custom' ? (
                <div className="relative">
                  <input
                    type="number"
                    id="customTahun"
                    min="1"
                    max="50"
                    placeholder="Jumlah Tahun"
                    value={formData.customTahun}
                    onChange={(e) => setFormData({ ...formData, customTahun: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-indigo-400 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-semibold outline-none"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] text-indigo-500 font-medium pointer-events-none">Tahun</span>
                </div>
              ) : (
                <div className="hidden sm:flex items-center justify-center px-2 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-500 text-[11px] border border-slate-200 dark:border-slate-700">
                  <Clock className="w-3 h-3 mr-1" /> {durasiLabel}
                </div>
              )}
            </div>
          </div>

          {/* Field 4: Preview Calculated Expiry Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tanggal Kadaluarsa (Otomatis Hitung)
            </label>
            <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">
                  {calculatedExpiry ? formatIndonesianDate(calculatedExpiry) : 'Menghitung...'}
                </span>
                <span className="text-[10px] text-slate-400 ml-2">({calculatedExpiry})</span>
              </div>
            </div>
          </div>

          {/* Field 5: Email Tujuan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="emailTujuan">
              Email Tujuan Notifikasi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                id="emailTujuan"
                required
                placeholder="contoh: hrd@perusahaan.com"
                value={formData.emailTujuan}
                onChange={(e) => setFormData({ ...formData, emailTujuan: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Field 6: Nomor WA Tujuan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="noWATujuan">
              Nomor WhatsApp Tujuan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="noWATujuan"
                required
                placeholder="contoh: 081234567890 atau 6281234567890"
                value={formData.noWATujuan}
                onChange={(e) => setFormData({ ...formData, noWATujuan: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            id="btn-submit-sk"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan & Mengirim...' : 'Simpan Data SK'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
