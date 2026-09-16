import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Copy, 
  Check, 
  Printer, 
  Clock, 
  CalendarDays,
  Plus,
  RotateCcw,
  Bell,
  BellRing,
  MoreHorizontal,
  Cloud,
  Loader2,
  LogIn,
  LogOut,
  User as UserIcon,
  Calendar as CalendarIcon,
  Smartphone
} from 'lucide-react';
import { User } from 'firebase/auth';
import { exportToExcel, exportToCSV, copyTableToClipboard } from '../utils/excelExport';
import { ScheduleItem, AppUser } from '../types';
import { getWIBDate } from '../utils/timeUtils';
import { PWAInstallButton } from './PWAInstallButton';
import { NotificationStatus } from '../services/notificationService';

interface HeaderProps {
  items: ScheduleItem[];
  onOpenAddModal: () => void;
  onResetDefault: () => void;
  isModified: boolean;
  onOpenAlarmSettings: () => void;
  onOpenGoogleCalendar: () => void;
  alarmEnabled: boolean;
  notificationPermission: NotificationStatus;
  user: AppUser | User | null;
  onLogin: () => void;
  onLogout: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  items,
  onOpenAddModal,
  onResetDefault,
  isModified,
  onOpenAlarmSettings,
  onOpenGoogleCalendar,
  alarmEnabled,
  notificationPermission,
  user,
  onLogin,
  onLogout,
  isSyncing,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [wibInfo, setWibInfo] = useState(getWIBDate());
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setWibInfo(getWIBDate());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMoreMenu(false);
      setShowUserMenu(false);
    };
    if (showMoreMenu || showUserMenu) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showMoreMenu, showUserMenu]);

  const handleExcelExport = () => {
    try {
      exportToExcel(items, 'Jadwal_Kegiatan_Mingguan.xlsx');
      setDownloadSuccess('File Excel (.xlsx) berhasil diunduh!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err) {
      console.error(err);
      alert('Gagal mengunduh Excel. Silakan coba lagi.');
    }
  };

  const handleCSVExport = () => {
    try {
      exportToCSV(items, 'Jadwal_Kegiatan_Mingguan.csv');
      setDownloadSuccess('File CSV berhasil diunduh!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err) {
      console.error(err);
      alert('Gagal mengunduh CSV.');
    }
  };

  const handleCopy = async () => {
    const ok = await copyTableToClipboard(items);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs print:static print:border-none print:shadow-none transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
          {/* Brand & Live Clock Section */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/15 flex items-center justify-center shrink-0 ring-4 ring-emerald-50">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  JadwalKu
                </h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Mingguan
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
                  v2.2
                </span>

                {/* Sync Status Pill */}
                {user && (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-2xs ${
                    (user as any).isLocal
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                      : 'bg-teal-50 text-teal-700 border border-teal-200/70'
                  }`}>
                    {isSyncing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
                        <span>Menyinkronkan...</span>
                      </>
                    ) : (user as any).isLocal ? (
                      <>
                        <Smartphone className="w-3 h-3 text-emerald-600" />
                        <span>Akun HP (Tersimpan Aman)</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3 h-3 text-teal-600" />
                        <span>Cloud Firestore</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                  {items.length} Agenda
                </span>
                <span className="text-slate-300">•</span>
                <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>{wibInfo.dayName}, {wibInfo.timeString} WIB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap print:hidden">
            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Alarm Settings Button */}
            <button
              type="button"
              id="btn-open-alarm-settings"
              onClick={onOpenAlarmSettings}
              title="Pengaturan Alarm & Getar HP"
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition border shadow-xs ${
                alarmEnabled
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100/80'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {alarmEnabled ? (
                <BellRing className="w-4 h-4 text-emerald-600 animate-pulse" />
              ) : (
                <Bell className="w-4 h-4 text-slate-400" />
              )}
              <span>Alarm HP</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  !alarmEnabled
                    ? 'bg-slate-300'
                    : notificationPermission === 'granted'
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
              />
            </button>

            {/* Primary Action: Tambah Kegiatan */}
            <button
              type="button"
              id="btn-add-activity"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition shadow-sm hover:shadow active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah</span>
            </button>

            {/* Export Excel Button */}
            <button
              type="button"
              id="btn-download-excel"
              onClick={handleExcelExport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl transition shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Unduh</span> Excel
            </button>

            {/* Google Calendar Sync Button */}
            <button
              type="button"
              id="btn-google-calendar"
              onClick={onOpenGoogleCalendar}
              title="Sinkronkan jadwal dengan Google Calendar"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50/90 hover:bg-blue-100 active:bg-blue-200 border border-blue-200/80 rounded-xl transition shadow-2xs"
            >
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Google</span> Calendar
            </button>

            {/* Firebase Auth Account Button */}
            {user ? (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  id="btn-user-profile"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title={user.displayName || user.email || 'Akun Pengguna'}
                  className="flex items-center gap-2 p-1 pl-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-xs"
                >
                  <span className="max-w-[80px] sm:max-w-[110px] truncate hidden sm:inline">
                    {user.displayName?.split(' ')[0] || 'Akun'}
                  </span>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Avatar'}
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-500/30"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-40 text-xs text-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="font-bold text-slate-900 truncate">
                        {user.displayName || 'Pengguna'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {user.email}
                      </p>
                      <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        (user as any).isLocal 
                          ? 'text-emerald-700 bg-emerald-50' 
                          : 'text-teal-700 bg-teal-50'
                      }`}>
                        {(user as any).isLocal ? (
                          <>
                            <Smartphone className="w-3 h-3 text-emerald-600" />
                            <span>Tersimpan di HP (Jalur Langsung)</span>
                          </>
                        ) : (
                          <>
                            <Cloud className="w-3 h-3 text-teal-600" />
                            <span>Tersimpan di Cloud Firebase</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-user-calendar"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenGoogleCalendar();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-700 rounded-xl flex items-center gap-2 font-semibold transition"
                    >
                      <CalendarIcon className="w-4 h-4 text-blue-600" />
                      <span>Google Calendar</span>
                    </button>

                    <button
                      type="button"
                      id="btn-logout"
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 rounded-xl flex items-center gap-2 font-semibold transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar (Sign Out)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                id="btn-login"
                onClick={onLogin}
                title="Masuk atau Buat Akun untuk menyinkronkan jadwal ke Cloud Firestore"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-xs cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-emerald-600" />
                <span>Masuk / Akun</span>
              </button>
            )}

            {/* More Menu Dropdown (Salin, Cetak, CSV, Reset) */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                id="btn-more-options"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                title="Pilihan ekspor dan alat lainnya"
                className="p-2 text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-xs"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-40 text-xs text-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      handleCopy();
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin ke Clipboard'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleCSVExport();
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>Unduh CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handlePrint();
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-slate-400" />
                    <span>Cetak / Simpan PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      onOpenGoogleCalendar();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-blue-50 text-blue-700 flex items-center gap-2 font-medium"
                  >
                    <CalendarIcon className="w-4 h-4 text-blue-600" />
                    <span>Google Calendar</span>
                  </button>

                  {isModified && (
                    <>
                      <div className="h-px bg-slate-100 my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          onResetDefault();
                          setShowMoreMenu(false);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset ke Data Asli</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Download Success Banner */}
        {downloadSuccess && (
          <div className="mt-2.5 py-2 px-3 bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm rounded-xl flex items-center justify-between shadow-2xs">
            <span className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{downloadSuccess} File siap dibuka di Microsoft Excel, WPS Office, atau Google Sheets.</span>
            </span>
            <button
              onClick={() => setDownloadSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 font-semibold text-xs ml-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
