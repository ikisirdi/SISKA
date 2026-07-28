/**
  * Utility functions for date calculations, formatting, and SK status checks.
  */

// Calculate Tanggal Kadaluarsa based on Tanggal Buat + years
export function calculateExpiryDate(tanggalBuatStr: string, years: number): string {
  if (!tanggalBuatStr) return '';
  const date = new Date(tanggalBuatStr);
  if (isNaN(date.getTime())) return '';
  
  // Add years to the date
  date.setFullYear(date.getFullYear() + years);
  
  // Format to YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Get days remaining until expiry from today
export function getDaysRemaining(tanggalKadaluarsaStr: string): number {
  if (!tanggalKadaluarsaStr) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(tanggalKadaluarsaStr);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// Calculate SK status based on expiry date
export function getSKStatus(tanggalKadaluarsaStr: string): {
  status: 'Aktif' | 'Segera Kadaluarsa' | 'Kadaluarsa';
  daysRemaining: number;
  label: string;
  badgeColor: string;
} {
  const days = getDaysRemaining(tanggalKadaluarsaStr);
  
  if (days < 0) {
    return {
      status: 'Kadaluarsa',
      daysRemaining: days,
      label: `Kadaluarsa (${Math.abs(days)} hari lalu)`,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
    };
  } else if (days <= 7) {
    return {
      status: 'Segera Kadaluarsa',
      daysRemaining: days,
      label: days === 0 ? 'Kadaluarsa Hari Ini' : `Kadaluarsa ${days} hari lagi`,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
    };
  } else {
    return {
      status: 'Aktif',
      daysRemaining: days,
      label: `Aktif (${days} hari lagi)`,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
    };
  }
}

// Format date YYYY-MM-DD to Indonesian format e.g. "28 Juli 2026"
export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Format phone number to standard 628xx format
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  return cleaned;
}
