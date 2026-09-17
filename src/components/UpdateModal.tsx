import React from 'react';
import { X, Sparkles, Smartphone, Github, CheckCircle2, Zap, ArrowUpRight } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                Pembaruan JadwalKu
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  v2.4
                </span>
              </h3>
              <p className="text-xs text-slate-500">Informasi versi & opsi update otomatis</p>
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

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {/* Apa yang baru di v2.4 */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Pembaruan di Versi 2.4:
            </h4>
            <ul className="space-y-1.5 text-slate-600 text-xs pl-2">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Jadwal & Jam Permanen (Tidak Akan Berubah):</strong> Editan kegiatan dan jam yang Anda buat dikunci permanen ke akun Anda dan tidak akan pernah tertimpa atau tereset lagi.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Simpan Akun Google ke Firebase:</strong> Daftarkan nama & email Google langsung ke cloud database Firebase (jadwalku-d40c2) tanpa kendala popup Android.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Jam Real-time HP:</strong> Penunjuk waktu dan agenda disinkronkan secara presisi dengan jam asli perangkat HP Anda setiap detik.</span>
              </li>
            </ul>
          </div>

          {/* Solusi 1: PWA Auto-update tanpa perlu download lagi */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Cara Auto-Update Otomatis (Tanpa Download APK)</span>
            </div>
            <p className="text-xs text-emerald-950/80 leading-relaxed">
              Agar <strong>tidak perlu lagi download dan install APK dari GitHub berulang kali</strong> setiap ada update, gunakan mode <strong>Web App (PWA)</strong>:
            </p>
            <ol className="text-xs text-emerald-900 space-y-1.5 pl-3 list-decimal font-medium">
              <li>Buka web JadwalKu di browser Chrome HP Anda.</li>
              <li>Klik menu titik tiga di pojok kanan atas Chrome.</li>
              <li>Pilih <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Instal Aplikasi"</strong>.</li>
            </ol>
            <p className="text-[11px] text-emerald-800 bg-white/70 p-2 rounded-xl border border-emerald-200/60">
              💡 <strong>Hasilnya:</strong> Aplikasi terpasang di HP persis seperti APK, dan <strong>otomatis langsung terupdate setiap kali dibuka</strong> tanpa perlu unduh apa pun lagi!
            </p>
          </div>

          {/* Solusi 2: Update APK GitHub */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <Github className="w-4 h-4 text-slate-700" />
              <span>Unduh APK Rilis GitHub</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Jika Anda tetap ingin menggunakan format file APK mentah, Anda dapat mengunduh build versi 2.4 langsung dari repository GitHub Anda.
            </p>
            <a
              href="https://github.com/pantazhappy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <span>Buka Rilis GitHub</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
