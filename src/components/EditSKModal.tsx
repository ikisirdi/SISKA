import React, { useState, useEffect } from 'react';
import { SKRecord } from '../types';
import { calculateExpiryDate } from '../utils/dateUtils';
import { X, Edit3, Save, Calendar, Mail, Phone, Clock, FileText, User, Layers } from 'lucide-react';

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
  const [namaIdentitas, setNamaIdentitas] = useState('');
  const [jenisDokumen, setJenisDokumen] = useState<'KGB (Kenaikan Gaji Berkala)' | 'KENPAN (Kenaikan Pangkat)' | 'Lainnya'>('KGB (Kenaikan Gaji Berkala)');
  const [noSK, setNoSK] = useState('');
  const [tanggalBuat, setTanggalBuat] = useState('');
  const [durasiPilihan, setDurasiPilihan] = useState<'1 Tahun' | '2 Tahun' | '3 Tahun' | '4 Tahun' | '5 Tahun' | 'Custom'>('2 Tahun');
  const [customTahun, setCustomTahun] = useState<number>(2);
  const [tanggalKadaluarsa, setTanggalKadaluarsa] = useState('');
  const [emailTujuan, setEmailTujuan] = useState('');
  const [noWATujuan, setNoWATujuan] = useState('');
  const [statusNotifikasi, setStatusNotifikasi] = useState<'Belum Terkirim' | 'Terkirim'>('Belum Terkirim');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setNamaIdentitas(record.namaIdentitas || '');
      setNoSK(record.noSK || '');
      setTanggalBuat(record.tanggalBuat || '');
      setEmailTujuan(record.emailTujuan || '');
      setNoWATujuan(record.noWATujuan || '');
      setStatusNotifikasi((record.statusNotifikasi as any) === 'Terkirim' ? 'Terkirim' : 'Belum Terkirim');

      const jenis = (record.jenisDokumen as any) || 'KGB (Kenaikan Gaji Berkala)';
      setJenisDokumen(jenis);

      // Parse duration
      const dur = record.durasiBerlaku || '2 Tahun';
      if (dur.includes('1 Tahun')) setDurasiPilihan('1 Tahun');
      else if (dur.includes('2 Tahun')) setDurasiPilihan('2 Tahun');
      else if (dur.includes('3 Tahun')) setDurasiPilihan('3 Tahun');
      else if (dur.includes('4 Tahun')) setDurasiPilihan('4 Tahun');
      else if (dur.includes('5 Tahun')) setDurasiPilihan('5 Tahun');
      else {
        setDurasiPilihan('Custom');
        const match = dur.match(/\d+/);
        if (match) setCustomTahun(parseInt(match[0], 10));
      }

      setTanggalKadaluarsa(record.tanggalKadaluarsa || '');
    }
  }, [record]);

  const handleJenisDokumenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as 'KGB (Kenaikan Gaji Berkala)' | 'KENPAN (Kenaikan Pangkat)' | 'Lainnya';
    setJenisDokumen(val);

    let years = 2;
    if (val === 'KGB (Kenaikan Gaji Berkala)') years = 2;
    else if (val === 'KENPAN (Kenaikan Pangkat)') years = 4;
    else years = 1;

    recalculateExpiry(tanggalBuat, val, durasiPilihan, customTahun, years);
  };

  const recalculateExpiry = (tglBuat: string, jenis: string, dur: string, cYears: number, overrideYears?: number) => {
    if (!tglBuat) return;
    let years = overrideYears || 2;
    if (jenis === 'KGB (Kenaikan Gaji Berkala)') years = 2;
    else if (jenis === 'KENPAN (Kenaikan Pangkat)') years = 4;
    else {
      if (dur === '1 Tahun') years = 1;
      else if (dur === '2 Tahun') years = 2;
      else if (dur === '3 Tahun') years = 3;
      else if (dur === '4 Tahun') years = 4;
      else if (dur === '5 Tahun') years = 5;
      else if (dur === 'Custom') years = cYears;
    }

    const expiry = calculateExpiryDate(tglBuat, years);
    setTanggalKadaluarsa(expiry);
  };

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaIdentitas || !noSK || !tanggalBuat || !emailTujuan || !noWATujuan) return;

    let durasiText = `${jenisDokumen === 'KGB (Kenaikan Gaji Berkala)' ? '2 Tahun (KGB)' : jenisDokumen === 'KENPAN (Kenaikan Pangkat)' ? '4 Tahun (KENPAN)' : durasiPilihan}`;

    const updated: SKRecord = {
      ...record,
      namaIdentitas,
      jenisDokumen,
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
              <h3 className="font-bold text-base text-white">Edit Data Dokumen SK</h3>
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
            {/* Nama Identitas */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nama Identitas / Pegawai / NIP *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={namaIdentitas}
                  onChange={(e) => setNamaIdentitas(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  placeholder="Nama Identitas"
                />
              </div>
            </div>

            {/* Jenis Dokumen */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Jenis Dokumen *
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <select
                  value={jenisDokumen}
                  onChange={handleJenisDokumenChange}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-amber-400 font-bold text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                >
                  <option value="KGB (Kenaikan Gaji Berkala)">KGB (Otomatis 2 Tahun)</option>
                  <option value="KENPAN (Kenaikan Pangkat)">KENPAN (Otomatis 4 Tahun)</option>
                  <option value="Lainnya">Lainnya / SK Biasa</option>
                </select>
              </div>
            </div>

            {/* No SK */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                No SK / Dokumen *
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

            {/* TMT (Terhitung Mulai Tanggal) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                TMT (Terhitung Mulai Tanggal) *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={tanggalBuat}
                  onChange={(e) => {
                    setTanggalBuat(e.target.value);
                    recalculateExpiry(e.target.value, jenisDokumen, durasiPilihan, customTahun);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
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

