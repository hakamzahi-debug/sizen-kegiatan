import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  LogIn, 
  UserPlus, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Cloud,
  ArrowLeft
} from 'lucide-react';
import { loginWithEmail, registerWithEmail, sendPasswordReset, loginWithGoogle } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleModeChange = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  const parseFirebaseError = (error: any): string => {
    const code = error?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
      case 'auth/email-already-in-use':
        return 'Email ini sudah terdaftar. Silakan pilih tab Masuk.';
      case 'auth/weak-password':
        return 'Kata sandi terlalu pendek. Gunakan minimal 6 karakter.';
      case 'auth/invalid-email':
        return 'Format alamat email tidak valid.';
      case 'auth/network-request-failed':
        return 'Koneksi internet bermasalah. Pastikan perangkat Anda online.';
      case 'auth/too-many-requests':
        return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.';
      default:
        return error?.message || 'Terjadi kesalahan saat memproses permintaan.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Silakan masukkan alamat email.');
      return;
    }

    if (mode === 'forgot_password') {
      setIsLoading(true);
      try {
        await sendPasswordReset(email);
        setSuccessMsg('Email pemulihan kata sandi telah dikirim. Periksa kotak masuk atau spam email Anda.');
      } catch (err: any) {
        setErrorMsg(parseFirebaseError(err));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMsg('Silakan masukkan kata sandi.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setErrorMsg('Kata sandi minimal 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Konfirmasi kata sandi tidak cocok.');
        return;
      }

      setIsLoading(true);
      try {
        await registerWithEmail(email, password, displayName);
        if (onSuccess) onSuccess();
        onClose();
      } catch (err: any) {
        setErrorMsg(parseFirebaseError(err));
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      try {
        await loginWithEmail(email, password);
        if (onSuccess) onSuccess();
        onClose();
      } catch (err: any) {
        setErrorMsg(parseFirebaseError(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('popup') || msg.includes('cancelled') || msg.includes('closed') || msg.includes('invalid')) {
        setErrorMsg('Di aplikasi Android APK, silakan gunakan tab "Masuk" atau "Daftar Baru" menggunakan Email & Kata Sandi agar langsung tersimpan aman di Cloud Firestore tanpa membuka browser eksternal.');
      } else {
        setErrorMsg(parseFirebaseError(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {mode === 'login' && 'Masuk ke Akun'}
                {mode === 'register' && 'Daftar Akun Baru'}
                {mode === 'forgot_password' && 'Pulihkan Kata Sandi'}
              </h3>
              <p className="text-xs text-slate-500">Sinkronisasi Cloud Firestore JadwalKu</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-auth-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle (Masuk / Daftar) */}
        {mode !== 'forgot_password' && (
          <div className="flex border-b border-slate-100 bg-slate-50/40 p-1.5 gap-1.5">
            <button
              type="button"
              id="tab-auth-login"
              onClick={() => handleModeChange('login')}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                mode === 'login' 
                  ? 'bg-white text-slate-800 shadow-xs border border-slate-200/60' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-4 h-4 text-emerald-600" />
              <span>Masuk</span>
            </button>
            <button
              type="button"
              id="tab-auth-register"
              onClick={() => handleModeChange('register')}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                mode === 'register' 
                  ? 'bg-white text-slate-800 shadow-xs border border-slate-200/60' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4 text-teal-600" />
              <span>Daftar Baru</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Notification / Error / Success Banners */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap (Opsional)</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="input-auth-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="input-auth-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                />
              </div>
            </div>

            {mode !== 'forgot_password' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Kata Sandi</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      id="btn-forgot-password"
                      onClick={() => handleModeChange('forgot_password')}
                      className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      Lupa kata sandi?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    id="input-auth-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ulangi Kata Sandi</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    id="input-auth-confirm-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi Anda"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              id="btn-auth-submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  {mode === 'login' && <span>Masuk Sekarang</span>}
                  {mode === 'register' && <span>Daftar Akun Baru</span>}
                  {mode === 'forgot_password' && <span>Kirim Tautan Reset</span>}
                </>
              )}
            </button>
          </form>

          {mode === 'forgot_password' && (
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className="w-full text-center py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Masuk</span>
            </button>
          )}

          {/* Divider & Google Sign-In */}
          {mode !== 'forgot_password' && (
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="shrink-0 mx-3 text-[11px] text-slate-400 font-medium">atau masuk dengan</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                id="btn-auth-google-oauth"
                disabled={isLoading}
                onClick={handleGoogleSignIn}
                className="w-full mt-1.5 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition shadow-xs flex items-center justify-center gap-2.5 text-xs sm:text-sm disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Akun Google</span>
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-1.5 leading-tight">
                💡 Di aplikasi HP (APK), disarankan masuk/daftar menggunakan <strong>Email & Sandi</strong> di atas agar langsung sinkron tanpa keluar aplikasi.
              </p>
            </div>
          )}

          {/* Cloud Info Banner */}
          <div className="pt-2 text-[11px] text-slate-500 bg-teal-50/60 border border-teal-100 rounded-xl p-3 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-teal-800 mb-0.5">
              <Cloud className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Penyimpanan Aman Cloud Firestore</span>
            </div>
            Jadwal kegiatan yang Anda buat akan otomatis disinkronkan ke akun pribadi Anda sehingga tidak akan hilang saat berganti HP atau membuka dari laptop.
          </div>
        </div>
      </div>
    </div>
  );
};
