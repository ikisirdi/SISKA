import { SKRecord, SKStats } from '../types';
import { getSKStatus, calculateExpiryDate } from '../utils/dateUtils';

const STORAGE_KEY = 'sk_management_records_v1';
const GAS_URL_KEY = 'sk_management_gas_url_v1';

// Initial sample mock data if localStorage is empty
const INITIAL_MOCK_DATA: SKRecord[] = [
  {
    id: 'sk-101',
    noSK: '001/SK-DIR/HRD/I/2024',
    tanggalBuat: '2024-01-15',
    durasiBerlaku: '3 Tahun',
    tanggalKadaluarsa: '2027-01-15',
    emailTujuan: 'manager.hrd@perusahaan.co.id',
    noWATujuan: '081234567890',
    statusNotifikasi: 'Belum Terkirim'
  },
  {
    id: 'sk-102',
    noSK: '042/SK-KARS/IT/VIII/2021',
    tanggalBuat: '2021-08-04',
    durasiBerlaku: '5 Tahun',
    tanggalKadaluarsa: calculateExpiryDate(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], 0), // 5 days from today (Segera Kadaluarsa)
    emailTujuan: 'kepala.it@perusahaan.co.id',
    noWATujuan: '085712345678',
    statusNotifikasi: 'Belum Terkirim'
  },
  {
    id: 'sk-103',
    noSK: '108/SK-LSP/MUTU/VII/2023',
    tanggalBuat: '2023-07-20',
    durasiBerlaku: '1 Tahun',
    tanggalKadaluarsa: '2024-07-20', // Kadaluarsa
    emailTujuan: 'quality.assurance@perusahaan.co.id',
    noWATujuan: '082198765432',
    statusNotifikasi: 'Terkirim'
  },
  {
    id: 'sk-104',
    noSK: '215/SK-DIREKSI/OPS/III/2025',
    tanggalBuat: '2025-03-10',
    durasiBerlaku: '1 Tahun',
    tanggalKadaluarsa: calculateExpiryDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], 0), // Exactly 7 days from today
    emailTujuan: 'operasional@perusahaan.co.id',
    noWATujuan: '081311223344',
    statusNotifikasi: 'Belum Terkirim'
  }
];

export class GASService {
  // Get stored Web App URL (LocalStorage takes priority, falls back to Vercel/Vite ENV variable)
  static getWebAppUrl(): string {
    const local = localStorage.getItem(GAS_URL_KEY);
    if (local && local.trim() !== '') {
      return local.trim();
    }
    const envUrl = (import.meta as any).env?.VITE_GAS_WEB_APP_URL || '';
    return typeof envUrl === 'string' ? envUrl.trim() : '';
  }

  // Save Web App URL
  static setWebAppUrl(url: string): void {
    localStorage.setItem(GAS_URL_KEY, url.trim());
  }

  // Get records from LocalStorage
  static getLocalRecords(): SKRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DATA));
        return INITIAL_MOCK_DATA;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error loading local SK data:', e);
      return INITIAL_MOCK_DATA;
    }
  }

  // Save records to LocalStorage
  static saveLocalRecords(records: SKRecord[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  // Fetch all SK records (From GAS Web App if URL set, else Local)
  static async fetchSKRecords(): Promise<{ data: SKRecord[]; source: 'GAS' | 'Local'; error?: string }> {
    const gasUrl = this.getWebAppUrl();
    
    if (!gasUrl) {
      return { data: this.getLocalRecords(), source: 'Local' };
    }

    try {
      // Append timestamp to prevent cached responses
      const fetchUrl = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}action=getSKList&t=${Date.now()}`;
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const json = await response.json();
      
      let records: SKRecord[] = [];
      if (Array.isArray(json)) {
        records = json;
      } else if (json.data && Array.isArray(json.data)) {
        records = json.data;
      } else if (json.status === 'success' && Array.isArray(json.records)) {
        records = json.records;
      }

      // Format records with local ID if missing
      const formatted = records.map((r, index) => ({
        ...r,
        id: r.id || `sk-gas-${index}-${Date.now()}`
      }));

      // Cache locally
      this.saveLocalRecords(formatted);

      return { data: formatted, source: 'GAS' };
    } catch (err: any) {
      console.warn('Failed to fetch from Google Apps Script Web App, falling back to Local:', err);
      return {
        data: this.getLocalRecords(),
        source: 'Local',
        error: `Gagal tersambung ke Google Apps Script (${err.message || 'CORS / URL Tidak Valid'}). Menggunakan data lokal.`
      };
    }
  }

  // Save new SK record (Sends POST to GAS and saves locally)
  static async createSKRecord(newSK: Omit<SKRecord, 'id' | 'statusNotifikasi'>): Promise<{ success: boolean; record: SKRecord; message: string }> {
    const record: SKRecord = {
      ...newSK,
      id: `sk-${Date.now()}`,
      statusNotifikasi: 'Belum Terkirim',
      updatedAt: new Date().toISOString()
    };

    // Save locally first
    const currentLocal = this.getLocalRecords();
    const updatedLocal = [record, ...currentLocal];
    this.saveLocalRecords(updatedLocal);

    const gasUrl = this.getWebAppUrl();
    if (!gasUrl) {
      return {
        success: true,
        record,
        message: 'SK berhasil disimpan di penyimpanan lokal browser.'
      };
    }

    // Try posting to GAS Web App
    try {
      // Note: GAS web app CORS post works using text/plain or standard FormData/JSON payload
      const payload = {
        action: 'createSK',
        noSK: record.noSK,
        tanggalBuat: record.tanggalBuat,
        durasiBerlaku: record.durasiBerlaku,
        tanggalKadaluarsa: record.tanggalKadaluarsa,
        emailTujuan: record.emailTujuan,
        noWATujuan: record.noWATujuan,
        statusNotifikasi: record.statusNotifikasi
      };

      await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors', // Standard Google Apps Script redirect workaround for CORS
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        record,
        message: 'SK berhasil dikirim ke Google Sheets via Google Apps Script & disimpan lokal.'
      };
    } catch (err: any) {
      console.error('Error posting to GAS:', err);
      return {
        success: true,
        record,
        message: 'SK berhasil disimpan lokal, tetapi gagal sinkronisasi ke Google Sheets (periksa URL Web App).'
      };
    }
  }

  // Update Notification status manually or after cron simulation
  static updateNotificationStatus(id: string, status: 'Belum Terkirim' | 'Terkirim'): SKRecord[] {
    const current = this.getLocalRecords();
    const updated = current.map(item => item.id === id ? { ...item, statusNotifikasi: status } : item);
    this.saveLocalRecords(updated);
    return updated;
  }

  // Trigger real notification request to Google Apps Script Web App (MailApp.sendEmail + WA Gateway)
  static async triggerRemoteNotification(record: SKRecord): Promise<{ success: boolean; message: string }> {
    const gasUrl = this.getWebAppUrl();
    
    // Always update status locally
    this.updateNotificationStatus(record.id || '', 'Terkirim');

    if (!gasUrl) {
      return {
        success: true,
        message: 'Status notifikasi berhasil diperbarui menjadi "Terkirim" di data lokal. (Masukkan URL Web App untuk kirim email otomatis via Google Server)'
      };
    }

    try {
      const payload = {
        action: 'triggerNotification',
        noSK: record.noSK,
        tanggalBuat: record.tanggalBuat,
        durasiBerlaku: record.durasiBerlaku,
        tanggalKadaluarsa: record.tanggalKadaluarsa,
        emailTujuan: record.emailTujuan,
        noWATujuan: record.noWATujuan
      };

      await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        message: `Sinyal pengiriman notifikasi Email (${record.emailTujuan}) & WA (${record.noWATujuan}) dikirim ke Google Apps Script Web App.`
      };
    } catch (err: any) {
      console.error('Error triggering GAS notification:', err);
      return {
        success: false,
        message: `Gagal memanggil Google Apps Script API: ${err.message}`
      };
    }
  }

  // Delete SK locally
  static deleteSKRecord(id: string): SKRecord[] {
    const current = this.getLocalRecords();
    const updated = current.filter(item => item.id !== id);
    this.saveLocalRecords(updated);
    return updated;
  }

  // Compute stats counters
  static calculateStats(records: SKRecord[]): SKStats {
    let total = records.length;
    let aktif = 0;
    let segeraKadaluarsa = 0;
    let kadaluarsa = 0;
    let terkirim = 0;

    records.forEach(r => {
      const statusInfo = getSKStatus(r.tanggalKadaluarsa);
      if (statusInfo.status === 'Aktif') aktif++;
      if (statusInfo.status === 'Segera Kadaluarsa') segeraKadaluarsa++;
      if (statusInfo.status === 'Kadaluarsa') kadaluarsa++;
      if (r.statusNotifikasi === 'Terkirim') terkirim++;
    });

    return { total, aktif, segeraKadaluarsa, kadaluarsa, terkirim };
  }
}
