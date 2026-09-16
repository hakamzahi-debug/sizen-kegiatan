import React, { useState, useEffect } from 'react';
import { AlarmSettings, ScheduleItem } from '../types';
import { NotificationStatus } from '../services/notificationService';
import { isVibrationSupported } from '../services/alarmAudio';
import { 
  isNativeAndroidApp, 
  syncScheduleToNativeAndroidAlarm,
  triggerNativeImmediateNotification,
  triggerNativeDelayedAlarm
} from '../services/nativeAlarmService';
import { 
  Bell, 
  BellRing, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Vibrate, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Square, 
  X,
  Clock,
  Radio,
  Lock,
  BatteryCharging,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
  RefreshCw,
  Timer
} from 'lucide-react';

interface AlarmSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AlarmSettings;
  onUpdateSettings: (newSettings: Partial<AlarmSettings>) => void;
  permission: NotificationStatus;
  onRequestPermission: () => Promise<NotificationStatus>;
  onTestAlarm: () => void;
  onTestDelayedAlarm?: (seconds?: number) => Promise<boolean>;
  isTestRinging: boolean;
  onStopTest: () => void;
  items: ScheduleItem[];
  isKeepAliveOn?: boolean;
}

export const AlarmSettingsModal: React.FC<AlarmSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  permission,
  onRequestPermission,
  onTestAlarm,
  onTestDelayedAlarm,
  isTestRinging,
  onStopTest,
  isKeepAliveOn = false,
  items,
}) => {
  const [showInfinixGuide, setShowInfinixGuide] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      const resetTimer = setTimeout(() => {
        setCountdown(null);
      }, 5000);
      return () => clearTimeout(resetTimer);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  if (!isOpen) return null;

  const supportsVibration = isVibrationSupported();
  const isNative = isNativeAndroidApp();

  const handleManualNativeSync = async () => {
    const res = await syncScheduleToNativeAndroidAlarm(items, settings.notifyMinutesBefore);
    if (res.success) {
      setSyncMessage(`✓ Berhasil mendaftarkan ${res.count} alarm ke Android AlarmManager!`);
    } else {
      setSyncMessage('Izin notifikasi belum diaktifkan di HP Anda. Silakan ketuk tombol "Aktifkan Izin Notifikasi".');
    }
    setTimeout(() => setSyncMessage(null), 5000);
  };

  const handleStartDelayedTest = async () => {
    let ok = false;
    if (onTestDelayedAlarm) {
      ok = await onTestDelayedAlarm(5);
    } else {
      ok = await triggerNativeDelayedAlarm(5);
    }

    if (ok) {
      setCountdown(5);
    } else {
      setSyncMessage('Pastikan izin notifikasi sudah diizinkan di HP Anda.');
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const handleImmediateNativeTest = async () => {
    const ok = await triggerNativeImmediateNotification();
    if (ok) {
      setSyncMessage('✓ Notifikasi uji coba berhasil dikirim ke bilah atas HP!');
    } else {
      setSyncMessage('Gagal mengirim notifikasi. Pastikan izin notifikasi HP sudah aktif.');
    }
    setTimeout(() => setSyncMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-xs">
              <BellRing className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Pengaturan Alarm & Notifikasi</h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Pengingat otomatis jadwal kegiatan harian
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-sm">
          {/* BANNER STATUS APLIKASI */}
          <div className={`p-4 rounded-2xl shadow-sm ${
            isNative 
              ? 'bg-emerald-600 text-white' 
              : 'bg-slate-800 text-white'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-xl shrink-0 mt-0.5">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base block">
                      {isNative ? 'Mode Android Native APK Aktif' : 'Status Sistem Notifikasi'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-white/25 text-white">
                      {isNative ? 'Capacitor OS' : 'Web / PWA'}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                    {isNative
                      ? 'Alarm kegiatan dikendalikan langsung oleh kernel Android AlarmManager. Pasti berbunyi dan memunculkan notifikasi walau aplikasi ditutup total atau layar mati.'
                      : 'Notifikasi sistem HP siap digunakan. Untuk beroperasi saat aplikasi ditutup total, pastikan izin notifikasi HP telah diaktifkan.'}
                  </p>
                </div>
              </div>
              {isNative && (
                <button
                  type="button"
                  onClick={handleManualNativeSync}
                  className="px-3 py-1.5 bg-white text-emerald-900 rounded-xl text-xs font-bold hover:bg-emerald-50 transition shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync Jadwal
                </button>
              )}
            </div>
            {syncMessage && (
              <div className="mt-3 text-xs bg-emerald-900/80 p-2.5 rounded-xl text-white font-medium border border-white/20">
                {syncMessage}
              </div>
            )}
          </div>

          {/* FITUR KHUSUS: UJI COBA ALARM KETIKA APLIKASI DITUTUP */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm sm:text-base block">
                  Uji Coba Alarm Saat Aplikasi Ditutup
                </span>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Tekan tombol di bawah untuk menjadwalkan alarm <strong>5 detik ke depan</strong>, lalu segera <strong>tutup aplikasi / matikan layar HP</strong> untuk membuktikan alarm berdering dari luar aplikasi.
                </p>
              </div>
            </div>

            {countdown !== null ? (
              <div className="p-3.5 bg-white rounded-xl border border-amber-300 text-center space-y-1">
                {countdown > 0 ? (
                  <>
                    <div className="text-2xl font-black text-amber-600 animate-pulse">
                      ⏳ {countdown} Detik Lagi!
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      👉 SEGERA TEKAN TOMBOL HOME ATAU KUNCI LAYAR HP ANDA SEKARANG!
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Alarm akan memicu sistem Android saat hitungan mundur habis.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-base font-bold text-emerald-700">
                      🎉 Alarm Telah Ditembakkan ke Sistem Android!
                    </div>
                    <p className="text-xs text-slate-600">
                      Periksa bilah notifikasi di atas layar HP atau dengarkan nada dering Anda.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleStartDelayedTest}
                  className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                >
                  <Timer className="w-4 h-4" />
                  <span>Tes Alarm 5 Detik (Lalu Tutup Aplikasi)</span>
                </button>
                <button
                  type="button"
                  onClick={handleImmediateNativeTest}
                  className="py-2.5 px-3.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5 text-slate-600" />
                  <span>Tes Notifikasi Instan</span>
                </button>
              </div>
            )}
          </div>

          {/* PANDUAN KHUSUS HP INFINIX (XOS & POWER MARATHON) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div 
              className="flex items-start justify-between cursor-pointer" 
              onClick={() => setShowInfinixGuide(!showInfinixGuide)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                    Pengaturan Wajib HP Infinix (XOS Power Marathon)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Agar HP Infinix tidak membunuh notifikasi saat layar mati.
                  </p>
                </div>
              </div>
              <button type="button" className="text-slate-500 hover:text-slate-700 p-1 shrink-0">
                {showInfinixGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showInfinixGuide && (
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-3 text-slate-700 bg-white p-3.5 rounded-xl">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg shrink-0 mt-0.5 font-bold text-xs">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Aktifkan Izin Notifikasi &amp; Spanduk Layar:</span>
                    <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                      Buka <strong>Pengaturan HP &gt; Manajemen Aplikasi &gt; Daftar Aplikasi &gt; JadwalKu &gt; Notifikasi</strong>. Pastikan statusnya <strong>"Izinkan Notifikasi"</strong>, dan centang opsi <strong>"Spanduk / Banner"</strong> serta <strong>"Layar Kunci"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg shrink-0 mt-0.5 font-bold text-xs">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Matikan Optimasi Baterai (Power Marathon):</span>
                    <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                      Buka <strong>Pengaturan HP &gt; Manajemen Daya (Power Marathon) &gt; Optimasi Baterai &gt; JadwalKu</strong>, ubah dari "Optimalkan" menjadi <strong>"Jangan Optimalkan" / "Tidak Dibatasi"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg shrink-0 mt-0.5 font-bold text-xs">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Kunci Aplikasi di Recent Apps:</span>
                    <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                      Tekan tombol Recent Apps (garis tiga di bawah layar), cari JadwalKu, lalu ketuk ikon <strong>Gembok 🔒</strong> agar sistem Infinix tidak menutupnya otomatis.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Master Switch */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-base">Aktifkan Alarm Jadwal</span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Berbunyi dan bergetar otomatis saat kegiatan dimulai
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => onUpdateSettings({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Section: Izin Notifikasi HP */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Izin Notifikasi Sistem HP</span>
              </div>
              {permission === 'granted' ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Diizinkan
                </span>
              ) : permission === 'denied' ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Belum Diizinkan
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                  Perlu Izin
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Izin notifikasi memungkinkan HP menampilkan spanduk di bilah atas dan membunyikan alarm saat jam kegiatan tiba.
            </p>

            {permission !== 'granted' && (
              <button
                type="button"
                onClick={onRequestPermission}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition"
              >
                Aktifkan Izin Notifikasi di HP Sekarang
              </button>
            )}
          </div>

          {/* Sound, Vibration, Timing Controls */}
          <div className="space-y-3">
            {/* Nada Dering Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <div>
                  <span className="font-semibold text-slate-900">Bunyi Nada Dering</span>
                  <p className="text-xs text-slate-500">Melodi bel chime harmonis (C5 - E5 - G5 - C6)</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Getar HP Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <Vibrate className={`w-4 h-4 ${settings.vibrateEnabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <span className="font-semibold text-slate-900">Getar Perangkat HP</span>
                  <p className="text-xs text-slate-500">
                    {supportsVibration
                      ? 'Pola getar ritmis saat kegiatan dimulai'
                      : 'Fitur getar bekerja di perangkat HP fisik'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.vibrateEnabled}
                  onChange={(e) => onUpdateSettings({ vibrateEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Waktu Berdering */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="font-semibold text-slate-900">Waktu Berdering</span>
                  <p className="text-xs text-slate-500">Kapan alarm mulai dibunyikan</p>
                </div>
              </div>
              <select
                value={settings.notifyMinutesBefore}
                onChange={(e) => onUpdateSettings({ notifyMinutesBefore: Number(e.target.value) })}
                className="text-xs font-semibold bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={0}>Tepat Waktu (0 Menit)</option>
                <option value={5}>5 Menit Sebelum</option>
                <option value={10}>10 Menit Sebelum</option>
              </select>
            </div>
          </div>

          {/* Test Sound Inside App */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-slate-900 block">Uji Coba Suara Nada Dering</span>
              <p className="text-xs text-slate-500">Dengarkan nada melodi bel chime di speaker HP</p>
            </div>
            {isTestRinging ? (
              <button
                type="button"
                onClick={onStopTest}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-xs shadow-xs transition"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Hentikan Suara
              </button>
            ) : (
              <button
                type="button"
                onClick={onTestAlarm}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-xs transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Tes Suara
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
