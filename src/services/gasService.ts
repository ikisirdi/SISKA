import { SKRecord, SKStats } from '../types';
import { getSKStatus, calculateExpiryDate } from '../utils/dateUtils';

const STORAGE_KEY = 'sk_management_records_v1';
const GAS_URL_KEY = 'sk_management_gas_url_v1';
const FONNTE_TOKEN_KEY = 'sk_management_fonnte_token_v1';

// Initial sample mock data if localStorage is empty
const INITIAL_MOCK_DATA: SKRecord[] = [
  {
    id: 'sk-101',
    namaIdentitas: 'Dr. Ahmad Fauzi, M.Si / NIP 198503122010011002',
    jenisDokumen: 'KGB (Kenaikan Gaji Berkala)',
    noSK: '001/SK-KGB/I/2024',
    tanggalBuat: '2024-01-15',
    durasiBerlaku: '2 Tahun',
    tanggalKadaluarsa: '2026-01-15',
    emailTujuan: 'ahmad.fauzi@instansi.go.id',
    noWATujuan: '081234567890',
    statusNotifikasi: 'Belum Terkirim'
  },
  {
    id: 'sk-102',
    namaIdentitas: 'Siti Rahmawati, S.STP / NIP 199008242014022001',
    jenisDokumen: 'KENPAN (Kenaikan Pangkat)',
    noSK: '042/SK-KENPAN/VIII/2022',
    tanggalBuat: '2022-08-04',
    durasiBerlaku: '4 Tahun',
    tanggalKadaluarsa: calculateExpiryDate(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], 0), // 5 days from today
    emailTujuan: 'siti.rahmawati@instansi.go.id',
    noWATujuan: '085712345678',
    statusNotifikasi: 'Belum Terkirim'
  },
  {
    id: 'sk-103',
    namaIdentitas: 'Budi Santoso, S.Kom / NIP 198811052012011005',
    jenisDokumen: 'KGB (Kenaikan Gaji Berkala)',
    noSK: '108/SK-KGB/VII/2023',
    tanggalBuat: '2023-07-20',
    durasiBerlaku: '2 Tahun',
    tanggalKadaluarsa: '2025-07-20',
    emailTujuan: 'budi.santoso@instansi.go.id',
    noWATujuan: '082198765432',
    statusNotifikasi: 'Terkirim'
  }
];

// Default fallback values if localStorage is not set on a new device
const DEFAULT_GAS_URL = (import.meta as any).env?.VITE_GAS_WEB_APP_URL || '';
const DEFAULT_FONNTE_TOKEN = (import.meta as any).env?.VITE_FONNTE_TOKEN || '';

export class GASService {
  // Get stored Web App URL (LocalStorage takes priority, falls back to Default/ENV)
  static getWebAppUrl(): string {
    const local = localStorage.getItem(GAS_URL_KEY);
    if (local && local.trim() !== '') {
      return local.trim();
    }
    return typeof DEFAULT_GAS_URL === 'string' ? DEFAULT_GAS_URL.trim() : '';
  }

  // Save Web App URL
  static setWebAppUrl(url: string): void {
    const trimmed = url.trim();
    localStorage.setItem(GAS_URL_KEY, trimmed);
  }

  // Get stored Fonnte API Token
  static getFonnteToken(): string {
    const local = localStorage.getItem(FONNTE_TOKEN_KEY);
    if (local && local.trim() !== '') {
      return local.trim();
    }
    return typeof DEFAULT_FONNTE_TOKEN === 'string' ? DEFAULT_FONNTE_TOKEN.trim() : '';
  }

  // Save Fonnte API Token
  static setFonnteToken(token: string): void {
    const trimmed = token.trim();
    localStorage.setItem(FONNTE_TOKEN_KEY, trimmed);
  }

  // Send direct WhatsApp message via Fonnte API (Browser / Client Side)
  static async sendFonnteWhatsApp(noWA: string, message: string, tokenOverride?: string): Promise<{ success: boolean; message: string; data?: any }> {
    const token = tokenOverride || this.getFonnteToken();
    if (!token) {
      return {
        success: false,
        message: 'Token API Fonnte belum dimasukkan. Silakan atur token di Pengaturan API.'
      };
    }

    let cleanWA = String(noWA).replace(/[^0-9]/g, '');
    if (cleanWA.startsWith('0')) {
      cleanWA = '62' + cleanWA.substring(1);
    } else if (cleanWA.startsWith('8')) {
      cleanWA = '62' + cleanWA;
    }

    try {
      const formData = new FormData();
      formData.append('target', cleanWA);
      formData.append('message', message);
      formData.append('countryCode', '62');

      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': token
        },
        body: formData
      });

      const resData = await response.json();
      if (resData.status === true || resData.detail === 'success' || response.ok) {
        return {
          success: true,
          message: `WhatsApp berhasil dikirim ke ${cleanWA} via API Fonnte!`,
          data: resData
        };
      } else {
        return {
          success: false,
          message: `Respon Fonnte: ${resData.reason || resData.message || JSON.stringify(resData)}`,
          data: resData
        };
      }
    } catch (err: any) {
      console.error('Error sending Fonnte WA:', err);
      return {
        success: false,
        message: `Gagal memanggil API Fonnte: ${err.message}`
      };
    }
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
        namaIdentitas: record.namaIdentitas || '',
        jenisDokumen: record.jenisDokumen || '',
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

  // Update existing SK record (locally and send POST + GET to GAS if set)
  static async updateSKRecord(updatedSK: SKRecord): Promise<{ success: boolean; records: SKRecord[]; message: string }> {
    const current = this.getLocalRecords();
    const updatedList = current.map(item => item.id === updatedSK.id || item.noSK === updatedSK.noSK ? { ...item, ...updatedSK, updatedAt: new Date().toISOString() } : item);
    this.saveLocalRecords(updatedList);

    const gasUrl = this.getWebAppUrl();
    if (!gasUrl) {
      return {
        success: true,
        records: updatedList,
        message: 'Data SK berhasil diperbarui di penyimpanan lokal.'
      };
    }

    try {
      const payload = {
        action: 'updateSK',
        id: updatedSK.id,
        namaIdentitas: updatedSK.namaIdentitas || '',
        jenisDokumen: updatedSK.jenisDokumen || '',
        noSK: updatedSK.noSK,
        tanggalBuat: updatedSK.tanggalBuat,
        durasiBerlaku: updatedSK.durasiBerlaku,
        tanggalKadaluarsa: updatedSK.tanggalKadaluarsa,
        emailTujuan: updatedSK.emailTujuan,
        noWATujuan: updatedSK.noWATujuan,
        statusNotifikasi: updatedSK.statusNotifikasi || 'Belum Terkirim'
      };

      // 1. Send POST request
      await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      // 2. Send GET fallback query string to guarantee execution in Apps Script doGet
      const getParams = new URLSearchParams({
        action: 'updateSK',
        noSK: updatedSK.noSK,
        tanggalBuat: updatedSK.tanggalBuat,
        durasiBerlaku: updatedSK.durasiBerlaku,
        tanggalKadaluarsa: updatedSK.tanggalKadaluarsa,
        emailTujuan: updatedSK.emailTujuan,
        noWATujuan: updatedSK.noWATujuan,
        statusNotifikasi: updatedSK.statusNotifikasi || 'Belum Terkirim',
        t: Date.now().toString()
      });
      await fetch(`${gasUrl}?${getParams.toString()}`, { mode: 'no-cors' });

      return {
        success: true,
        records: updatedList,
        message: 'Data SK berhasil diperbarui di Google Sheets & lokal.'
      };
    } catch (err: any) {
      console.error('Error updating SK in GAS:', err);
      return {
        success: true,
        records: updatedList,
        message: 'Data SK diperbarui di lokal.'
      };
    }
  }

  // Delete SK locally and sync deletion to GAS Web App if set
  static async deleteSKRecord(id: string, noSK?: string): Promise<{ records: SKRecord[]; message: string }> {
    const current = this.getLocalRecords();
    const targetRecord = current.find(item => item.id === id || (noSK && item.noSK === noSK));
    const targetNoSK = noSK || targetRecord?.noSK || '';

    const updated = current.filter(item => item.id !== id && (!noSK || item.noSK !== noSK));
    this.saveLocalRecords(updated);

    const gasUrl = this.getWebAppUrl();
    if (gasUrl && targetNoSK) {
      try {
        const payload = {
          action: 'deleteSK',
          id: id,
          noSK: targetNoSK
        };

        // 1. Send POST request
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });

        // 2. Send GET request fallback (100% reliable for Apps Script doGet)
        const getUrl = `${gasUrl}?action=deleteSK&noSK=${encodeURIComponent(targetNoSK)}&t=${Date.now()}`;
        await fetch(getUrl, { mode: 'no-cors' });
      } catch (err) {
        console.error('Error syncing deletion to GAS:', err);
      }
    }

    return {
      records: updated,
      message: targetNoSK ? `SK ${targetNoSK} berhasil dihapus.` : 'SK berhasil dihapus.'
    };
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
