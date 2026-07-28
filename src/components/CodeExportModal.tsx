import React, { useState } from 'react';
import { X, Copy, Check, Download, ExternalLink, Code, Layers } from 'lucide-react';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  webAppUrl: string;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({ isOpen, onClose, webAppUrl }) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const sampleUrl = webAppUrl || 'URL_WEB_APP_GOOGLE_APPS_SCRIPT_ANDA';

  const standaloneHtmlCode = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard Manajemen SK</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Lucide Icons CDN -->
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen font-sans">

  <!-- Header -->
  <header className="bg-slate-950 border-b border-slate-800 py-4 px-6 sticky top-0 z-30">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-xl">SK</div>
        <div>
          <h1 class="font-bold text-lg text-white">Dashboard Manajemen SK</h1>
          <p class="text-xs text-slate-400">Serverless Google Sheets & Apps Script Integration</p>
        </div>
      </div>
      <div class="text-xs px-3 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
        ● Connected
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-7xl mx-auto px-4 py-8 space-y-8">
    
    <!-- Config Input URL -->
    <section class="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
      <label class="block text-xs font-semibold text-slate-300 mb-1">URL Web App Google Apps Script:</label>
      <input type="text" id="gasUrlInput" value="${sampleUrl}" placeholder="https://script.google.com/macros/s/.../exec"
        class="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none">
    </section>

    <!-- Form Input SK -->
    <section class="bg-slate-800/40 p-6 rounded-2xl border border-slate-700 space-y-4">
      <h2 class="text-base font-bold text-white flex items-center gap-2">
        <span>Form Input SK Baru</span>
      </h2>
      
      <form id="skForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- No SK -->
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">No SK *</label>
          <input type="text" id="noSK" required placeholder="001/SK-DIR/2026" class="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white outline-none">
        </div>

        <!-- Tanggal Buat -->
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Tanggal Buat *</label>
          <input type="date" id="tanggalBuat" required class="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white outline-none">
        </div>

        <!-- Masa Berlaku -->
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Masa Berlaku *</label>
          <div class="grid grid-cols-3 gap-2">
            <select id="durasiSelect" class="col-span-2 px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white outline-none">
              <option value="1 Tahun">1 Tahun</option>
              <option value="3 Tahun">3 Tahun</option>
              <option value="5 Tahun">5 Tahun</option>
              <option value="Custom">Custom</option>
            </select>
            <input type="number" id="customTahun" min="1" value="2" placeholder="Tahun" class="hidden px-3 py-2 text-xs rounded-lg bg-indigo-950 border border-indigo-700 text-white outline-none">
          </div>
        </div>

        <!-- Tanggal Kadaluarsa Hitung Otomatis -->
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Tanggal Kadaluarsa (Hitung Otomatis)</label>
          <input type="text" id="tanggalKadaluarsa" readonly class="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-amber-400 font-mono font-bold outline-none">
        </div>

        <!-- Email Tujuan -->
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Email Tujuan *</label>
          <input type="email" id="emailTujuan" required placeholder="hrd@perusahaan.com" class="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white outline-none">
        </div>

        <!-- No WA Tujuan -->
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">No WhatsApp Tujuan *</label>
          <input type="text" id="noWATujuan" required placeholder="081234567890" class="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white outline-none">
        </div>

        <div class="md:col-span-2 flex justify-end">
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all">
            Simpan SK Baru
          </button>
        </div>
      </form>
    </section>

    <!-- Summary Table -->
    <section class="bg-slate-800/40 p-6 rounded-2xl border border-slate-700 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-white">Tabel Ringkasan SK (Google Sheets)</h2>
        <button id="btnRefresh" class="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs">Refresh Data</button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950 text-slate-400 uppercase">
            <tr>
              <th class="p-3">No SK</th>
              <th class="p-3">Tanggal Buat</th>
              <th class="p-3">Durasi</th>
              <th class="p-3">Tanggal Kadaluarsa</th>
              <th class="p-3">Email</th>
              <th class="p-3">No WA</th>
              <th class="p-3">Status Notifikasi</th>
            </tr>
          </thead>
          <tbody id="tableBody" class="divide-y divide-slate-800">
            <tr><td colSpan="7" class="p-4 text-center text-slate-500">Memuat data dari Google Sheets...</td></tr>
          </tbody>
        </table>
      </div>
    </section>

  </main>

  <script>
    // Set default tanggal buat ke hari ini
    document.getElementById('tanggalBuat').valueAsDate = new Date();

    // Custom Durasi Event Listener
    const durasiSelect = document.getElementById('durasiSelect');
    const customTahun = document.getElementById('customTahun');

    durasiSelect.addEventListener('change', () => {
      if (durasiSelect.value === 'Custom') {
        customTahun.classList.remove('hidden');
      } else {
        customTahun.classList.add('hidden');
      }
      calculateExpiry();
    });

    customTahun.addEventListener('input', calculateExpiry);
    document.getElementById('tanggalBuat').addEventListener('change', calculateExpiry);

    // Auto Calculation Tanggal Kadaluarsa
    function calculateExpiry() {
      const tglBuatVal = document.getElementById('tanggalBuat').value;
      if (!tglBuatVal) return;

      let years = 1;
      const sel = durasiSelect.value;
      if (sel === '1 Tahun') years = 1;
      else if (sel === '3 Tahun') years = 3;
      else if (sel === '5 Tahun') years = 5;
      else if (sel === 'Custom') years = Math.max(1, parseInt(customTahun.value) || 1);

      const d = new Date(tglBuatVal);
      d.setFullYear(d.getFullYear() + years);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');

      document.getElementById('tanggalKadaluarsa').value = \`\${yyyy}-\${mm}-\${dd}\`;
    }

    calculateExpiry();

    // Fetch GET Data dari Google Apps Script
    async function fetchSKData() {
      const url = document.getElementById('gasUrlInput').value.trim();
      const tbody = document.getElementById('tableBody');
      if (!url) {
        tbody.innerHTML = '<tr><td colSpan="7" class="p-4 text-center text-amber-400">Masukkan URL Web App Google Apps Script di atas.</td></tr>';
        return;
      }

      tbody.innerHTML = '<tr><td colSpan="7" class="p-4 text-center text-slate-400">Memuat data dari Google Sheets...</td></tr>';

      try {
        const res = await fetch(url + '?action=getSKList&t=' + Date.now());
        const json = await res.json();
        const records = json.data || json || [];

        if (records.length === 0) {
          tbody.innerHTML = '<tr><td colSpan="7" class="p-4 text-center text-slate-500">Belum ada data SK di Google Sheets.</td></tr>';
          return;
        }

        tbody.innerHTML = records.map(r => \`
          <tr class="hover:bg-slate-800/50">
            <td class="p-3 font-mono font-bold text-white">\${r.noSK || '-'}</td>
            <td class="p-3">\${r.tanggalBuat || '-'}</td>
            <td class="p-3">\${r.durasiBerlaku || '-'}</td>
            <td class="p-3 font-mono text-amber-400 font-bold">\${r.tanggalKadaluarsa || '-'}</td>
            <td class="p-3">\${r.emailTujuan || '-'}</td>
            <td class="p-3 font-mono">\${r.noWATujuan || '-'}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] bg-slate-700 text-slate-200">\${r.statusNotifikasi || 'Belum Terkirim'}</span></td>
          </tr>
        \`).join('');
      } catch (e) {
        tbody.innerHTML = '<tr><td colSpan="7" class="p-4 text-center text-rose-400">Gagal mengambil data dari Google Sheets. Periksa CORS / URL Web App.</td></tr>';
      }
    }

    document.getElementById('btnRefresh').addEventListener('click', fetchSKData);

    // Form Submit (POST) ke Google Apps Script
    document.getElementById('skForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = document.getElementById('gasUrlInput').value.trim();
      if (!url) {
        alert('Silakan masukkan URL Web App Google Apps Script terlebih dahulu!');
        return;
      }

      let durasiText = durasiSelect.value;
      if (durasiText === 'Custom') {
        durasiText = (customTahun.value || 1) + ' Tahun (Custom)';
      }

      const payload = {
        action: 'createSK',
        noSK: document.getElementById('noSK').value,
        tanggalBuat: document.getElementById('tanggalBuat').value,
        durasiBerlaku: durasiText,
        tanggalKadaluarsa: document.getElementById('tanggalKadaluarsa').value,
        emailTujuan: document.getElementById('emailTujuan').value,
        noWATujuan: document.getElementById('noWATujuan').value,
        statusNotifikasi: 'Belum Terkirim'
      };

      try {
        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        alert('Data SK ' + payload.noSK + ' berhasil dikirim ke Google Sheets!');
        document.getElementById('skForm').reset();
        document.getElementById('tanggalBuat').valueAsDate = new Date();
        calculateExpiry();
        setTimeout(fetchSKData, 1500);
      } catch (err) {
        alert('Gagal mengirim data: ' + err.message);
      }
    });

    // Auto load data on open
    fetchSKData();
  </script>
</body>
</html>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(standaloneHtmlCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 ring-1 ring-purple-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">File index.html Mandiri untuk GitHub Pages</h3>
              <p className="text-xs text-slate-400">Kode HTML/JS murni (Tanpa build tool) siap di-host langsung di GitHub Pages</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="text-slate-300 space-y-1">
              <p className="font-semibold text-white">Cara Menggunakan di GitHub Pages:</p>
              <p className="text-xs">1. Buat repository baru di GitHub &gt; Tambah file <code>index.html</code></p>
              <p className="text-xs">2. Tempelkan seluruh kode di bawah ini &gt; Commit file &gt; Aktifkan GitHub Pages di Settings Repository.</p>
            </div>
            <button
              onClick={handleCopy}
              id="btn-copy-html-standalone"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shrink-0 cursor-pointer"
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Tersalin!' : 'Salin index.html'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 max-h-[450px]">
            {standaloneHtmlCode}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">100% Serverless Frontend (HTML + CDN Tailwind + JS)</span>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all cursor-pointer">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
