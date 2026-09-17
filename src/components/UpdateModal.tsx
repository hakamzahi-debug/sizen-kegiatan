import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Smartphone, 
  Github, 
  CheckCircle2, 
  Zap, 
  ArrowUpRight, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'obtainium' | 'pwa' | 'changelog'>('obtainium');
  const [customRepo, setCustomRepo] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // URL fallback jika belum diisi pengguna
  const effectiveRepoUrl = customRepo.trim() || 'https://github.com/USERNAME_ANDA/NAMA_REPO';
  const obtainiumLatestUrl = 'https://github.com/ImranR98/Obtainium/releases/latest';
  const obtainiumDirectIntent = `obtainium://app/${customRepo.trim() ? encodeURIComponent(customRepo.trim()) : ''}`;

  const handleCopyLink = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                Pusat Pembaruan Otomatis
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  v2.4
                </span>
              </h3>
              <p className="text-xs text-slate-500">Pilih metode update otomatis yang paling mudah untuk HP Anda</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200/80 bg-slate-50/80 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('obtainium')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'obtainium'
                ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>1. Obtainium (Auto APK)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-white text-teal-700 shadow-xs ring-1 ring-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            <span>2. Web App (PWA)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('changelog')}
            className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'changelog'
                ? 'bg-white text-slate-800 shadow-xs ring-1 ring-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Fitur v2.4</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs sm:text-sm">
          {/* TAB 1: OBTAINIUM (OPSI UTAMA AUTO UPDATE APK) */}
          {activeTab === 'obtainium' && (
            <div className="space-y-4">
              {/* Alert Penjelasan Kenapa Tidak Ditemukan */}
              <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 space-y-2 text-amber-950">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black">!</span>
                  <span>Kenapa Tadi Muncul "URL Tidak Ditemukan"?</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900/90">
                  Obtainium mewajibkan URL tersebut adalah <strong>Repository GitHub publik milik Anda</strong> yang sudah memiliki minimal 1 file rilis APK di menu <em>Releases</em>. Jika repository belum dibuat atau belum ada file APK di dalamnya, Obtainium akan menolaknya dengan pesan tidak ditemukan.
                </p>
              </div>

              {/* Solusi Cepat: Input URL Repo Pengguna */}
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <Github className="w-4 h-4 text-slate-700" />
                    <span>Masukkan Link GitHub Repository Anda:</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                    Kustom Link
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Masukkan link repository tempat Anda menyimpan APK JadwalKu (misal: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">https://github.com/akun-anda/jadwalku</code>):
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customRepo}
                    onChange={(e) => setCustomRepo(e.target.value)}
                    placeholder="https://github.com/username-anda/jadwalku"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
                  />
                  {customRepo.trim() && (
                    <button
                      type="button"
                      onClick={() => handleCopyLink(customRepo.trim())}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Disalin' : 'Salin'}</span>
                    </button>
                  )}
                </div>

                {customRepo.trim() && (
                  <a
                    href={obtainiumDirectIntent}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-xs"
                  >
                    <span>⚡ Buka Langsung di Obtainium</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Panduan 3 Langkah */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                  Syarat Agar Link Terbaca di Obtainium:
                </h4>

                <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl space-y-2 text-xs text-slate-700">
                  <p className="leading-relaxed">
                    1. Buka akun GitHub Anda, buat repository baru dengan nama <strong>JadwalKu</strong> dan setel sebagai <strong>Public</strong>.
                  </p>
                  <p className="leading-relaxed">
                    2. Masuk ke tab <strong>Releases</strong> di GitHub, klik <strong>Create a new release</strong>, lalu unggah file APK JadwalKu Anda di sana.
                  </p>
                  <p className="leading-relaxed">
                    3. Buka Obtainium di HP, tekan <strong>Add App</strong>, lalu masukkan link GitHub Anda tersebut. Obtainium langsung mengenali dan otomatis mengupdate setiap ada rilis baru!
                  </p>
                </div>
              </div>

              {/* Rekomendasi Solusi Paling Cepat: PWA */}
              <div className="p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-teal-900 block">Mau yang Langsung Jadi Tanpa Setup GitHub?</span>
                  <span className="text-[11px] text-teal-700 block">Gunakan Web App (PWA) — langsung terupdate otomatis di HP tanpa setting repo.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('pwa')}
                  className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer shadow-xs transition"
                >
                  Lihat Cara PWA
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PWA */}
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-teal-900 font-bold">
                  <Zap className="w-4 h-4 text-teal-600" />
                  <span>Mode Web App PWA (Tanpa Unduh File Sama Sekali)</span>
                </div>
                <p className="text-xs text-teal-950/80 leading-relaxed">
                  Jika Anda sama sekali <strong>tidak mau memasang aplikasi tambahan</strong> dan ingin JadwalKu langsung terupdate otomatis setiap kali dibuka:
                </p>
                <ol className="text-xs text-teal-900 space-y-2 pl-4 list-decimal font-medium">
                  <li>Buka link aplikasi JadwalKu di browser Chrome HP Anda.</li>
                  <li>Tekan ikon <strong>titik tiga (⋮)</strong> di pojok kanan atas Chrome.</li>
                  <li>Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Instal Aplikasi"</strong>.</li>
                </ol>
                <div className="text-[11px] text-teal-800 bg-white/80 p-2.5 rounded-xl border border-teal-200/70">
                  💡 <strong>Keuntungan:</strong> Tampilan dan ikon di layar HP sama persis seperti aplikasi APK biasa, namun kodenya selalu otomatis versi paling baru setiap kali dibuka tanpa unduh apa pun!
                </div>
              </div>

              {/* Rilis Manual GitHub */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Github className="w-4 h-4 text-slate-700" />
                  <span>Unduh Manual dari Rilis GitHub</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Jika Anda tetap ingin mengunduh file APK manual secara langsung dari browser:
                </p>
                <a
                  href={effectiveRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                >
                  <span>Buka Halaman Rilis GitHub</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: CHANGELOG */}
          {activeTab === 'changelog' && (
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Daftar Pembaruan di Versi 2.4:
              </h4>
              <ul className="space-y-2.5 text-slate-700 text-xs pl-1">
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200/70">
                  <span className="text-emerald-600 font-extrabold text-sm leading-none">•</span>
                  <div>
                    <strong className="text-slate-900">Jadwal & Jam Permanen (Terkunci):</strong>
                    <p className="text-slate-500 mt-0.5">Seluruh editan kegiatan, catatan, dan jam yang Anda buat disimpan permanen ke akun Anda dan tidak akan pernah tertimpa atau tereset lagi.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200/70">
                  <span className="text-emerald-600 font-extrabold text-sm leading-none">•</span>
                  <div>
                    <strong className="text-slate-900">Simpan Akun Google ke Firebase Cloud:</strong>
                    <p className="text-slate-500 mt-0.5">Daftarkan nama & email Google langsung ke database Firebase (jadwalku-d40c2) tanpa kendala popup tertahan di Android.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200/70">
                  <span className="text-emerald-600 font-extrabold text-sm leading-none">•</span>
                  <div>
                    <strong className="text-slate-900">Jam Real-time HP:</strong>
                    <p className="text-slate-500 mt-0.5">Penunjuk waktu dan agenda harian berjalan presisi mengikuti detik dan jam asli perangkat HP Anda.</p>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            JadwalKu • Versi 2.4.0
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

