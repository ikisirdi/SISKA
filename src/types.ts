export interface SKRecord {
  id?: string;
  noSK: string;
  tanggalBuat: string; // Format YYYY-MM-DD
  durasiBerlaku: string; // e.g. "1 Tahun", "3 Tahun", "5 Tahun", "2 Tahun (Custom)"
  tanggalKadaluarsa: string; // Format YYYY-MM-DD
  emailTujuan: string;
  noWATujuan: string;
  statusNotifikasi: 'Belum Terkirim' | 'Terkirim' | string;
  updatedAt?: string;
}

export type StatusFilter = 'Semua' | 'Aktif' | 'Segera Kadaluarsa' | 'Kadaluarsa' | 'Terkirim';

export interface SKFormInput {
  noSK: string;
  tanggalBuat: string;
  durasiPilihan: '1 Tahun' | '3 Tahun' | '5 Tahun' | 'Custom';
  customTahun: number;
  emailTujuan: string;
  noWATujuan: string;
}

export interface GasConfig {
  webAppUrl: string;
  fonnteApiKey?: string;
  wablasApiKey?: string;
  autoSync: boolean;
}

export interface SKStats {
  total: number;
  aktif: number;
  segeraKadaluarsa: number; // <= 7 hari
  kadaluarsa: number;
  terkirim: number;
}
