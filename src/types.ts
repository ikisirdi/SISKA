export interface SKRecord {
  id?: string;
  noSK: string;
  namaIdentitas?: string; // Nama Pegawai / NIP / Identitas
  jenisDokumen?: 'KGB (Kenaikan Gaji Berkala)' | 'KENPAN (Kenaikan Pangkat)' | 'Lainnya' | string;
  tanggalBuat: string; // TMT (Format YYYY-MM-DD)
  durasiBerlaku: string; // e.g. "2 Tahun", "4 Tahun", "1 Tahun", etc.
  tanggalKadaluarsa: string; // Format YYYY-MM-DD
  emailTujuan: string;
  noWATujuan: string;
  statusNotifikasi: 'Belum Terkirim' | 'Terkirim' | string;
  updatedAt?: string;
}

export type StatusFilter = 'Semua' | 'Aktif' | 'Segera Kadaluarsa' | 'Kadaluarsa' | 'Terkirim';

export interface SKFormInput {
  noSK: string;
  namaIdentitas: string;
  jenisDokumen: 'KGB (Kenaikan Gaji Berkala)' | 'KENPAN (Kenaikan Pangkat)' | 'Lainnya';
  tanggalBuat: string; // TMT
  durasiPilihan: '1 Tahun' | '2 Tahun' | '3 Tahun' | '4 Tahun' | '5 Tahun' | 'Custom';
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
