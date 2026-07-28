import React, { useState, useEffect } from 'react';
import { SKRecord } from '../types';
import { calculateExpiryDate } from '../utils/dateUtils';
import { X, Edit3, Save, Calendar, Mail, Phone, Clock, FileText, CheckCircle2 } from 'lucide-react';

interface EditSKModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: SKRecord | null;
  onSave: (updatedRecord: SKRecord) => Promise<void>;
}

export const EditSKModal: React.FC<EditSKModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave
}) => {
  const [noSK, setNoSK] = useState('');
  const [tanggalBuat, setTanggalBuat] = useState('');
  const [durasiPilihan, setDurasiPilihan] = useState<'1 Tahun' | '3 Tahun' | '5 Tahun' | 'Custom'>('1 Tahun');
  const [customTahun, setCustomTahun] = useState<number>(2);
  const [tanggalKadaluarsa, setTanggalKadaluarsa] = useState('');
  const [emailTujuan, setEmailTujuan] = useState('');
  const [noWATujuan, setNoWATujuan] = useState('');
  const [statusNotifikasi, setStatusNotifikasi] = useState<'Belum Terkirim' | 'Terkirim'>('Belum Terkirim');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setNoSK(record.noSK || '');
      setTanggalBuat(record.tanggalBuat || '');
      setEmailTujuan(record.emailTujuan || '');
      setNoWATujuan(record.noWATujuan || '');
      setStatusNotifikasi((record.statusNotifikasi as any) === 'Terkirim' ? 'Terkirim' : 'Belum Terkirim');

      // Parse duration
      const dur = record.durasiBerlaku || '1 Tahun';
      if (dur.includes('1 Tahun')) setDurasiPilihan('1 Tahun');
      else if (dur.includes('3 Tahun')) setDurasiPilihan('3 Tahun');
      else if (dur.includes('5 Tahun')) setDurasiPilihan('5 Tahun');
      else {
        setDurasiPilihan('Custom');
        const match = dur.match(/\d+/);
        if (match) setCustomTahun(parseInt(match[0], 10));
      }

      setTanggalKadaluarsa(record.tanggalKadaluarsa || '');
    }
  }, [record]);

  // Recalculate expiry date whenever creation date or duration changes
  const handleTanggalBuatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setTanggalBuat(newDate);
    recalculateExpiry(newDate, durasiPilihan, customTahun);
  };

  const handleDurasiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDur = e.target.value as '1 Tahun' | '3 Tahun' | '5 Tahun' | 'Custom';
    setDurasiPilihan(newDur);
    recalculateExpiry(tanggalBuat, newDur, customTahun);
  };

  const handleCustomTahunChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
    setCustomTahun(val);
    recalculateExpiry(tanggalBuat, 'Custom', val);
  };

  const recalculateExpiry = (tglBuat: string, dur: string, years: number) => {
    if (!tglBuat) return;
    let durYears = 1;
    if (dur === '1 Tahun') durYears = 1;
    else if (dur === '3 Tahun') durYears = 3;
    else if (dur === '5 Tahun') durYears = 5;
    else if (dur === 'Custom') durYears = years;

    const expiry = calculateExpiryDate(tglBuat, durYears);
    setTanggalKadaluarsa(expiry);
  };

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noSK || !tanggalBuat || !emailTujuan || !noWATujuan) return;

    let durasiText = durasiPilihan;
    if (durasiPilihan === 'Custom') {
      durasiText = `${customTahun} Tahun (Custom)` as any;
    }

    const updated: SKRecord = {
      ...record,
      noSK,
      tanggalBuat,
      durasiBerlaku: durasiText,
      tanggalKadaluarsa,
      emailTujuan,
      noWATujuan,
      statusNotifikasi
    };

    setIsSubmitting(true);
    await onSave(updated);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl text-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-600/20 text-amber-400 ring-1 ring-amber-500/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Edit Data Surat Keputusan (SK)</h3>
              <p className="text-xs text-slate-400 font-mono">No SK: {record.noSK}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 text-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* No SK */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                No SK Surat Keputusan *
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={noSK}
                  onChange={(e) => setNoSK(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  placeholder="001/SK-DIR/2026"
                />
              </div>
            </div>

            {/* Tanggal Buat */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tanggal Dibuat *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={tanggalBuat}
                  onChange={handleTanggalBuatChange}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Durasi Masa Berlaku */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Masa Berlaku *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={durasiPilihan}
                  onChange={handleDurasiChange}
                  className="col-span-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                >
                  <option value="1 Tahun">1 Tahun</option>
                  <option value="3 Tahun">3 Tahun</option>
                  <option value="5 Tahun">5 Tahun</option>
                  <option value="Custom">Custom (Tahun)</option>
                </select>
                {durasiPilihan === 'Custom' && (
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={customTahun}
                    onChange={handleCustomTahunChange}
                    className="px-3 py-2 bg-indigo-950 border border-indigo-700 text-indigo-200 rounded-lg text-xs font-mono font-bold outline-none"
                  />
                )}
              </div>
            </div>

            {/* Tanggal Kadaluarsa */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tanggal Kadaluarsa (Otomatis)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-amber-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  readOnly
                  value={tanggalKadaluarsa}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-amber-400 font-mono font-bold text-xs outline-none"
                />
              </div>
            </div>

            {/* Email Tujuan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Email Tujuan *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={emailTujuan}
                  onChange={(e) => setEmailTujuan(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  placeholder="email@perusahaan.com"
                />
              </div>
            </div>

            {/* No WA Tujuan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                No WhatsApp Tujuan *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={noWATujuan}
                  onChange={(e) => setNoWATujuan(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  placeholder="081234567890"
                />
              </div>
            </div>

            {/* Status Notifikasi */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Status Notifikasi
              </label>
              <select
                value={statusNotifikasi}
                onChange={(e) => setStatusNotifikasi(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:ring-1 focus:ring-amber-500 outline-none font-mono"
              >
                <option value="Belum Terkirim">Belum Terkirim</option>
                <option value="Terkirim">Terkirim</option>
              </select>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-amber-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
