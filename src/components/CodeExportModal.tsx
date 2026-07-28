import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Layers, Globe, ArrowRight, Settings2, FileCode2, CheckCircle2 } from 'lucide-react';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  webAppUrl: string;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({ isOpen, onClose, webAppUrl }) => {
  const [activeTab, setActiveTab] = useState<'vercel' | 'html'>('vercel');
  const [isCopiedVercelJson, setIsCopiedVercelJson] = useState(false);
  const [isCopiedHtml, setIsCopiedHtml] = useState(false);
  const [isCopiedEnv, setIsCopiedEnv] = useState(false);

  if (!isOpen) return null;

  const sampleUrl = webAppUrl || 'https://script.google.com/macros/s/AKfycb.../exec';

  const vercelJsonContent = `{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`;

  const envSample = `VITE_GAS_WEB_APP_URL=${sampleUrl}`;

  const standaloneHtmlCode = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard Manajemen SK - Google Sheets Database</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen font-sans">
  <header class="bg-slate-900 border-b border-slate-800 py-4 px-6 sticky top-0 z-30">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">SK</div>
        <div>
          <h1 class="font-bold text-base text-white">Dashboard Manajemen SK</h1>
          <p class="text-[10px] text-slate-400 font-mono uppercase">Vercel & Google Sheets Serverless Integration</p>
        </div>
      </div>
      <div class="text-xs px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-mono">
        ● DATABASE: GOOGLE_SHEETS_LIVE
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-6 space-y-6">
    <section class="bg-slate-900 p-4 rounded-xl border border-slate-800">
      <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">URL Web App Google Apps Script:</label>
      <input type="text" id="gasUrlInput" value="${sampleUrl}" placeholder="https://script.google.com/macros/s/.../exec"
        class="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white font-mono focus:ring-1 focus:ring-blue-500 outline-none">
    </section>

    <section class="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
      <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Form Registrasi SK Baru</h2>
      <form id="skForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">No SK *</label>
          <input type="text" id="noSK" required placeholder="001/SK-DIR/2026" class="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white font-mono outline-none">
        </div>
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggal Buat *</label>
          <input type="date" id="tanggalBuat" required class="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white outline-none">
        </div>
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Masa Berlaku *</label>
          <div class="grid grid-cols-3 gap-2">
            <select id="durasiSelect" class="col-span-2 px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white outline-none">
              <option value="1 Tahun">1 Tahun</option>
              <option value="3 Tahun">3 Tahun</option>
              <option value="5 Tahun">5 Tahun</option>
              <option value="Custom">Custom</option>
            </select>
            <input type="number" id="customTahun" min="1" value="2" placeholder="Tahun" class="hidden px-3 py-2 text-xs rounded-lg bg-indigo-950 border border-indigo-700 text-white outline-none">
          </div>
        </div>
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggal Kadaluarsa (Otomatis)</label>
          <input type="text" id="tanggalKadaluarsa" readonly class="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold outline-none">
        </div>
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Tujuan *</label>
          <input type="email" id="emailTujuan" required placeholder="hrd@perusahaan.com" class="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white outline-none">
        </div>
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">No WhatsApp Tujuan *</label>
          <input type="text" id="noWATujuan" required placeholder="081234567890" class="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white outline-none">
        </div>
        <div class="md:col-span-2 flex justify-end">
          <button type="submit" class="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all">
            Simpan SK ke Google Sheets
          </button>
        </div>
      </form>
    </section>

    <section class="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Data SK di Google Sheets</h2>
        <button id="btnRefresh" class="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold">Refresh Data</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
            <tr>
              <th class="p-3">No SK</th>
              <th class="p-3">Tanggal Buat</th>
              <th class="p-3">Durasi</th>
              <th class="p-3">Tanggal Kadaluarsa</th>
              <th class="p-3">Email</th>
              <th class="p-3">No WA</th>
              <th class="p-3">Status</th>
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
    document.getElementById('tanggalBuat').valueAsDate = new Date();
    const durasiSelect = document.getElementById('durasiSelect');
    const customTahun = document.getElementById('customTahun');

    durasiSelect.addEventListener('change', () => {
      if (durasiSelect.value === 'Custom') customTahun.classList.remove('hidden');
      else customTahun.classList.add('hidden');
      calculateExpiry();
    });

    customTahun.addEventListener('input', calculateExpiry);
    document.getElementById('tanggalBuat').addEventListener('change', calculateExpiry);

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

    async function fetchSKData() {
      const url = document.getElementById('gasUrlInput').value.trim();
      const tbody = document.getElementById('tableBody');
      if (!url) return;
      try {
        const res = await fetch(url + '?action=getSKList&t=' + Date.now());
        const json = await res.json();
        const records = json.data || json || [];
        if (!records.length) {
          tbody.innerHTML = '<tr><td colSpan="7" class="p-4 text-center text-slate-500">Belum ada data SK.</td></tr>';
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
            <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">\${r.statusNotifikasi || 'Belum Terkirim'}</span></td>
          </tr>
        \`).join('');
      } catch (e) {
        tbody.innerHTML = '<tr><td colSpan="7" class="p-4 text-center text-rose-400">Gagal terhubung ke Google Sheets.</td></tr>';
      }
    }

    document.getElementById('btnRefresh').addEventListener('click', fetchSKData);
    document.getElementById('skForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = document.getElementById('gasUrlInput').value.trim();
      if (!url) return alert('Masukkan URL Web App!');
      let durasiText = durasiSelect.value;
      if (durasiText === 'Custom') durasiText = (customTahun.value || 1) + ' Tahun (Custom)';

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
        alert('SK ' + payload.noSK + ' berhasil dikirim ke Google Sheets!');
        document.getElementById('skForm').reset();
        document.getElementById('tanggalBuat').valueAsDate = new Date();
        calculateExpiry();
        setTimeout(fetchSKData, 1500);
      } catch (err) {
        alert('Gagal: ' + err.message);
      }
    });

    fetchSKData();
  </script>
</body>
</html>`;

  const copyToClipboard = (text: string, setFn: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Panduan Upload & Deploy ke Vercel.com</h3>
              <p className="text-xs text-slate-400">Database tetap tersambung ke Google Sheets via Google Apps Script</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6">
          <button
            onClick={() => setActiveTab('vercel')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'vercel'
                ? 'border-blue-500 text-blue-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Deploy React Vercel.com (Rekomendasi)</span>
          </button>

          <button
            onClick={() => setActiveTab('html')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'html'
                ? 'border-purple-500 text-purple-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Single File index.html (GitHub Pages)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-6">
          {activeTab === 'vercel' ? (
            <div className="space-y-6">
              {/* Step 1: GitHub / Vercel CLI */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500 flex items-center justify-center text-xs text-white">1</span>
                  <h4>Upload Kode ke GitHub & Connect Vercel</h4>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  1. Push atau upload repositori project React Vite ini ke GitHub Anda.<br/>
                  2. Buka <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-400 underline font-semibold">Vercel.com</a> &gt; Klik <b>Add New Project</b> &gt; Impor repository GitHub Anda.<br/>
                  3. Vercel secara otomatis akan mendeteksi framework <b>Vite</b> dengan build command <code>npm run build</code> dan output directory <code>dist</code>.
                </p>
              </div>

              {/* Step 2: Set Environment Variable in Vercel */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                    <span className="w-6 h-6 rounded-full bg-emerald-600/30 border border-emerald-500 flex items-center justify-center text-xs text-white">2</span>
                    <h4>Atur Environment Variable di Vercel Settings</h4>
                  </div>
                  <button
                    onClick={() => copyToClipboard(envSample, setIsCopiedEnv)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all cursor-pointer"
                  >
                    {isCopiedEnv ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedEnv ? 'Tersalin!' : 'Salin Variable'}</span>
                  </button>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Di Vercel Project Dashboard &gt; <b>Settings</b> &gt; <b>Environment Variables</b>, tambahkan baris berikut agar aplikasi terhubung otomatis ke Google Sheets tanpa perlu input manual di browser:
                </p>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-emerald-300 text-[11px]">
                  {envSample}
                </div>
              </div>

              {/* Step 3: vercel.json File */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                    <span className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500 flex items-center justify-center text-xs text-white">3</span>
                    <h4>Konfigurasi vercel.json (Sudah Disediakan)</h4>
                  </div>
                  <button
                    onClick={() => copyToClipboard(vercelJsonContent, setIsCopiedVercelJson)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all cursor-pointer"
                  >
                    {isCopiedVercelJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedVercelJson ? 'Tersalin!' : 'Salin vercel.json'}</span>
                  </button>
                </div>
                <p className="text-slate-300">
                  File <code>vercel.json</code> berikut sudah dibuat di root project untuk memastikan Vercel menangani SPA routing dengan sempurna:
                </p>
                <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-slate-200 text-[11px]">
                  {vercelJsonContent}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-200 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                <p>
                  Setelah klik <b>Deploy</b> di Vercel, aplikasi akan langsung live dengan HTTPS, perfomansi super cepat, dan database tetap tersambung secara live ke Google Sheets Anda!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-slate-300 space-y-1">
                  <p className="font-semibold text-white">Cara Menggunakan Single HTML di GitHub Pages:</p>
                  <p className="text-xs">1. Buat file <code>index.html</code> di repository GitHub Pages Anda.</p>
                  <p className="text-xs">2. Tempelkan seluruh kode HTML/JS mandiri di bawah ini.</p>
                </div>
                <button
                  onClick={() => copyToClipboard(standaloneHtmlCode, setIsCopiedHtml)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shrink-0 cursor-pointer"
                >
                  {isCopiedHtml ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopiedHtml ? 'Tersalin!' : 'Salin index.html'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 max-h-[380px]">
                {standaloneHtmlCode}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            STRUCTURE: VITE REACT + VERCEL DEPLOYMENT + GOOGLE SHEETS
          </span>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all cursor-pointer">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
