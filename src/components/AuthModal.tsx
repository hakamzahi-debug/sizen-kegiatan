import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  LogIn, 
  Smartphone,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Info
} from 'lucide-react';
import { loginWithGoogle } from '../firebase';
import { saveLocalUser } from '../services/localAuthService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  // Tab pilihan: 'direct' (Langsung di aplikasi) atau 'google' (Akun Google Cloud)
  const [activeTab, setActiveTab] = useState<'direct' | 'google'>('direct');
  
  // State form Akun Langsung
  const [localName, setLocalName] = useState('');
  const [localEmail, setLocalEmail] = useState('hakamzahi99@gmail.com');
  const [localPin, setLocalPin] = useState('');
  
  // State status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const name = localName.trim() || 'Hakam';
    const email = localEmail.trim() || 'hakamzahi99@gmail.com';

    setIsLoading(true);
    try {
      saveLocalUser(name, email);
      setSuccessMsg(`Selamat datang, ${name}! Akun aplikasi Anda telah aktif langsung di HP.`);
      setTimeout(() => {
        setIsLoading(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Gagal menyimpan profil akun di HP.');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res.user) {
        setSuccessMsg(`Berhasil terhubung dengan Google (${res.user.displayName || res.user.email})!`);
        setTimeout(() => {
          setIsLoading(false);
          if (onSuccess) onSuccess();
          onClose();
        }, 900);
      } else {
        // Redirect initiated
        setIsLoading(false);
      }
    } catch (err: any) {
      setIsLoading(false);
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('popup-blocked') || msg.includes('popup')) {
        setErrorMsg('Jendela popup Google ditolak oleh browser HP. Silakan izinkan "Pop-up & Pengalihan" di setelan browser Chrome HP Anda, atau gunakan tab "Masuk Langsung di HP" di sebelah.');
      } else if (msg.includes('network')) {
        setErrorMsg('Koneksi internet bermasalah. Pastikan perangkat Anda online.');
      } else if (msg.includes('cancelled') || msg.includes('closed')) {
        setErrorMsg('Proses login Google dibatalkan atau jendela ditutup sebelum selesai.');
      } else {
        setErrorMsg(err?.message || 'Gagal masuk dengan Akun Google.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Masuk / Profil Akun</h3>
              <p className="text-xs text-slate-500">Pilih jalur login paling nyaman untuk Anda</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('direct');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'direct'
                ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200/70'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Masuk Langsung (HP)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('google');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'google'
                ? 'bg-white text-blue-800 shadow-xs ring-1 ring-slate-200/70'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Cloud className="w-4 h-4 text-blue-600" />
            <span>Akun Google</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Notification Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-semibold">{successMsg}</div>
            </div>
          )}

          {/* TAB 1: MASUK LANGSUNG DI HP (Tanpa Browser) */}
          {activeTab === 'direct' && (
            <form onSubmit={handleDirectLogin} className="space-y-3.5">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Jalur Langsung di Aplikasi (Bebas Hambatan)</span>
                </div>
                <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                  Tidak butuh buka browser luar dan tidak terikat aturan izin server cloud. Jadwal dan profil langsung aktif tersimpan permanen di HP Anda.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Anda / Panggilan
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    placeholder="Contoh: Hakam / Rambo"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-medium transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Email (Opsional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={localEmail}
                    onChange={(e) => setLocalEmail(e.target.value)}
                    placeholder="hakamzahi99@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-medium transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PIN / Kata Sandi (Opsional)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={localPin}
                    onChange={(e) => setLocalPin(e.target.value)}
                    placeholder="Bisa dikosongkan atau isi 4-6 angka"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-medium transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyiapkan Akun...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk Langsung Sekarang</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: AKUN GOOGLE (Cloud Firestore) */}
          {activeTab === 'google' && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  <span>Sinkronisasi Google Cloud Firestore</span>
                </div>
                <p className="text-[11px] text-blue-900/90 leading-relaxed">
                  Di konsol Firebase Anda, provider <strong>Google</strong> sudah berstatus <strong>Enabled</strong>. Masuk dengan Google memungkinkan jadwal disinkronkan ke server cloud Firestore.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-3 shadow-xs hover:shadow transition cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Menghubungkan ke Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Masuk dengan Akun Google</span>
                    </>
                  )}
                </button>

                <div className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Google mewajibkan konfirmasi akun resmi. Jika menggunakan aplikasi di HP, browser resmi ponsel akan terbuka sebentar untuk memverifikasi akun Anda.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Info Tentang Status Starter Tier */}
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>Mengapa jalur langsung di atas paling direkomendasikan?</strong> Karena di Starter Tier bawaan Google Cloud, penambahan provider email dikunci oleh kebijakan izin server Google. Mode Langsung di HP di atas dibuat agar Anda bisa bebas login tanpa batasan!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
