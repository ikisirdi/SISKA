import React, { useState, useEffect } from 'react';
import { SKFormInput, SKRecord } from '../types';
import { calculateExpiryDate, formatIndonesianDate, formatPhoneNumber } from '../utils/dateUtils';
import { PlusCircle, Calendar, Mail, Phone, FileText, Clock, Check, Sparkles, Send, User, Layers } from 'lucide-react';

interface SKFormProps {
  onSubmitSK: (newSK: Omit<SKRecord, 'id' | 'statusNotifikasi'>) => Promise<void>;
  isSubmitting: boolean;
}

export const SKForm: React.FC<SKFormProps> = ({ onSubmitSK, isSubmitting }) => {
  const [formData, setFormData] = useState<SKFormInput>({
    namaIdentitas: '',
    jenisDokumen: 'KGB (Kenaikan Gaji Berkala)',
    noSK: '',
    tanggalBuat: new Date().toISOString().split('T')[0], // Default today (TMT)
    durasiPilihan: '2 Tahun' as any,
    customTahun: 2,
    emailTujuan: '',
    noWATujuan: ''
  });

  const [calculatedExpiry, setCalculatedExpiry] = useState<string>('');
  const [durasiLabel, setDurasiLabel] = useState<string>('2 Tahun');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Auto-switch duration based on Jenis Dokumen
  const handleJenisDokumenChange = (jenis: 'KGB (Kenaikan Gaji Berkala)' | 'KENPAN (Kenaikan Pangkat)' | 'Lainnya') => {
    if (jenis === 'KGB (Kenaikan Gaji Berkala)') {
      setFormData(prev => ({
        ...prev,
        jenisDokumen: jenis,
        durasiPilihan: '2 Tahun' as any
      }));
    } else if (jenis === 'KENPAN (Kenaikan Pangkat)') {
      setFormData(prev => ({
        ...prev,
        jenisDokumen: jenis,
        durasiPilihan: '4 Tahun' as any
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        jenisDokumen: jenis,
        durasiPilihan: '1 Tahun' as any
      }));
    }
  };

  // Calculate Expiry Date automatically whenever Tanggal Buat (TMT), durasiPilihan, or customTahun changes
  useEffect(() => {
    let years = 2;
    let label = '2 Tahun';

    if (formData.jenisDokumen === 'KGB (Kenaikan Gaji Berkala)') {
      years = 2;
      label = '2 Tahun (KGB)';
    } else if (formData.jenisDokumen === 'KENPAN (Kenaikan Pangkat)') {
      years = 4;
      label = '4 Tahun (KENPAN)';
    } else {
      if (formData.durasiPilihan === ('1 Tahun' as any)) {
        years = 1;
        label = '1 Tahun';
      } else if (formData.durasiPilihan === ('2 Tahun' as any)) {
        years = 2;
        label = '2 Tahun';
      } else if (formData.durasiPilihan === ('3 Tahun' as any)) {
        years = 3;
        label = '3 Tahun';
      } else if (formData.durasiPilihan === ('4 Tahun' as any)) {
        years = 4;
        label = '4 Tahun';
      } else if (formData.durasiPilihan === ('5 Tahun' as any)) {
        years = 5;
        label = '5 Tahun';
      } else if (formData.durasiPilihan === 'Custom') {
        years = Math.max(1, Number(formData.customTahun) || 1);
        label = `${years} Tahun (Custom)`;
      }
    }

    setDurasiLabel(label);

    if (formData.tanggalBuat) {
      const expiry = calculateExpiryDate(formData.tanggalBuat, years);
      setCalculatedExpiry(expiry);
    } else {
      setCalculatedExpiry('');
    }
  }, [formData.tanggalBuat, formData.jenisDokumen, formData.durasiPilihan, formData.customTahun]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaIdentitas.trim()) {
      alert('Silakan isi Nama Identitas.');
      return;
    }
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
      namaIdentitas: formData.namaIdentitas.trim(),
      jenisDokumen: formData.jenisDokumen,
      noSK: formData.noSK.trim(),
      tanggalBuat: formData.tanggalBuat,
      durasiBerlaku: durasiLabel,
      tanggalKadaluarsa: calculatedExpiry,
      emailTujuan: formData.emailTujuan.trim(),
      noWATujuan: cleanedWA
    };

    await onSubmitSK(recordToSubmit);

    // Show temporary success feedback & reset form
    setSuccessMsg(`Data SK (${formData.jenisDokumen}) untuk "${formData.namaIdentitas}" berhasil ditambahkan! Kadaluarsa: ${formatIndonesianDate(calculatedExpiry)}`);
    setTimeout(() => setSuccessMsg(''), 5000);

    setFormData({
      namaIdentitas: '',
      jenisDokumen: 'KGB (Kenaikan Gaji Berkala)',
      noSK: '',
      tanggalBuat: new Date().toISOString().split('T')[0],
      durasiPilihan: '2 Tahun' as any,
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
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Tambah Data SK & Dokumen Baru</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pilih jenis dokumen (KGB / KENPAN) untuk hitung otomatis masa berlaku dan tanggal kadaluarsa</p>
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
          {/* Field 1: Nama Identitas */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="namaIdentitas">
              Nama Identitas / Pegawai / NIP <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="namaIdentitas"
                required
                placeholder="Contoh: Dra. Ani Suryani, M.Si / NIP. 198005122008012003"
                value={formData.namaIdentitas}
                onChange={(e) => setFormData({ ...formData, namaIdentitas: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Field 2: Jenis Dokumen */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="jenisDokumen">
              Jenis Dokumen <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Layers className="w-4 h-4" />
              </div>
              <select
                id="jenisDokumen"
                value={formData.jenisDokumen}
                onChange={(e) => handleJenisDokumenChange(e.target.value as any)}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="KGB (Kenaikan Gaji Berkala)">KGB (Kenaikan Gaji Berkala) - Otomatis 2 Tahun</option>
                <option value="KENPAN (Kenaikan Pangkat)">KENPAN (Kenaikan Pangkat) - Otomatis 4 Tahun</option>
                <option value="Lainnya">Lainnya / SK Biasa (Atur Masa Berlaku Manual)</option>
              </select>
            </div>
          </div>

          {/* Field 3: Nomor SK */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="noSK">
              Nomor SK / Dokumen <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="noSK"
                required
                placeholder="Contoh: 800/015/KGB/2026"
                value={formData.noSK}
                onChange={(e) => setFormData({ ...formData, noSK: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Field 4: TMT (Terhitung Mulai Tanggal) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="tanggalBuat">
              TMT (Terhitung Mulai Tanggal) <span className="text-rose-500">*</span>
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

          {/* Field 5: Masa Berlaku (Dynamic for Lainnya) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="durasiPilihan">
              Masa Berlaku
            </label>
            {formData.jenisDokumen === 'Lainnya' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  id="durasiPilihan"
                  value={formData.durasiPilihan}
                  onChange={(e) => setFormData({ ...formData, durasiPilihan: e.target.value as any })}
                  className="sm:col-span-2 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="1 Tahun">1 Tahun</option>
                  <option value="2 Tahun">2 Tahun</option>
                  <option value="3 Tahun">3 Tahun</option>
                  <option value="4 Tahun">4 Tahun</option>
                  <option value="5 Tahun">5 Tahun</option>
                  <option value="Custom">Custom (Isi Jumlah Tahun)</option>
                </select>

                {formData.durasiPilihan === 'Custom' && (
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
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center px-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700">
                <Clock className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                <span>{durasiLabel} (Otomatis berdasarkan jenis {formData.jenisDokumen.split(' ')[0]})</span>
              </div>
            )}
          </div>

          {/* Field 6: Preview Calculated Expiry Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tanggal Kadaluarsa (Otomatis dari TMT + Masa Berlaku)
            </label>
            <div className="flex items-center space-x-2 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 ml-1" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">
                  {calculatedExpiry ? formatIndonesianDate(calculatedExpiry) : 'Menghitung...'}
                </span>
                <span className="text-[10px] text-slate-400 ml-2">({calculatedExpiry})</span>
              </div>
            </div>
          </div>

          {/* Field 7: Email Tujuan */}
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
                placeholder="contoh: pegawai@instansi.go.id"
                value={formData.emailTujuan}
                onChange={(e) => setFormData({ ...formData, emailTujuan: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Field 8: Nomor WA Tujuan */}
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
                placeholder="contoh: 081234567890"
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
            <span>{isSubmitting ? 'Menyimpan & Mengirim...' : 'Simpan Data Dokumen'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

