import { useState, useEffect, useRef, useCallback } from 'react';
import { ScheduleItem, AlarmSettings } from '../types';
import { getWIBDate } from '../utils/timeUtils';
import { 
  startAlarmRinging, 
  stopAlarmRinging, 
  triggerVibration, 
  startBackgroundKeepAlive,
  stopBackgroundKeepAlive,
  isKeepAliveActive
} from '../services/alarmAudio';
import { 
  getNotificationPermissionStatus, 
  requestNotificationPermission, 
  sendScheduleNotification,
  scheduleNotificationWithTrigger,
  NotificationStatus
} from '../services/notificationService';
import { 
  syncScheduleToNativeAndroidAlarm, 
  isNativeAndroidApp,
  requestNativeAlarmPermission,
  setupNativeNotificationChannel,
  triggerNativeImmediateNotification,
  triggerNativeDelayedAlarm
} from '../services/nativeAlarmService';

const ALARM_SETTINGS_KEY = 'jadwal_alarm_settings_v2';

const DEFAULT_SETTINGS: AlarmSettings = {
  enabled: true,
  soundEnabled: true,
  vibrateEnabled: true,
  notifyMinutesBefore: 0,
  volume: 0.8,
  backgroundKeepAlive: true,
};

export function useScheduleAlarm(items: ScheduleItem[]) {
  const [settings, setSettings] = useState<AlarmSettings>(() => {
    try {
      const saved = localStorage.getItem(ALARM_SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [permission, setPermission] = useState<NotificationStatus>(getNotificationPermissionStatus());
  const [activeAlarmItem, setActiveAlarmItem] = useState<ScheduleItem | null>(null);
  const [isTestRinging, setIsTestRinging] = useState(false);
  const [isKeepAliveOn, setIsKeepAliveOn] = useState(false);

  // Menyimpan riwayat alarm yang sudah berbunyi hari ini agar tidak berulang di menit yang sama
  const triggeredKeysRef = useRef<Set<string>>(new Set());

  // Simpan settings jika berubah
  useEffect(() => {
    try {
      localStorage.setItem(ALARM_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save alarm settings', e);
    }
  }, [settings]);

  // Kelola Background Keep-Alive Audio Service
  useEffect(() => {
    if (!settings.enabled || !settings.backgroundKeepAlive) {
      stopBackgroundKeepAlive();
      setIsKeepAliveOn(false);
      return;
    }

    // Coba aktifkan keep-alive
    const tryActivate = async () => {
      const success = await startBackgroundKeepAlive();
      setIsKeepAliveOn(success);
    };

    tryActivate();

    // Browser mobile memerlukan interaksi sentuhan pertama untuk memulai audio
    const handleFirstGesture = async () => {
      const ok = await startBackgroundKeepAlive();
      setIsKeepAliveOn(ok);
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, [settings.enabled, settings.backgroundKeepAlive]);

  // Pre-schedule upcoming agenda hari ini via Notification Triggers API jika didukung
  useEffect(() => {
    if (!settings.enabled || permission !== 'granted') return;

    const wib = getWIBDate();
    const currentDay = wib.dayName;
    const nowMs = Date.now();

    for (const item of items) {
      if (item.hari !== currentDay) continue;
      let sHour = item.startHour;
      let sMinute = item.startMinute ?? 0;

      if (sHour === undefined) {
        const match = item.jam.match(/(\d{1,2})[.:](\d{2})/);
        if (match) {
          sHour = parseInt(match[1], 10);
          sMinute = parseInt(match[2], 10);
        }
      }
      if (sHour === undefined) continue;

      const targetDate = new Date();
      targetDate.setHours(sHour, sMinute - settings.notifyMinutesBefore, 0, 0);
      const targetMs = targetDate.getTime();

      // Hanya jadwalkan jika waktu target masih di masa depan hari ini
      if (targetMs > nowMs && targetMs - nowMs < 24 * 60 * 60 * 1000) {
        scheduleNotificationWithTrigger(`⏰ Alarm Jadwal: ${item.kegiatan}`, targetMs, {
          body: `${item.jam}${item.keterangan ? ' — ' + item.keterangan : ''}`,
          tag: `os-alarm-${item.id}`,
        });
      }
    }
  }, [items, settings.enabled, settings.notifyMinutesBefore, permission]);

  // Sinkronisasi otomatis ke Android Native AlarmManager jika berjalan di APK Capacitor
  useEffect(() => {
    if (isNativeAndroidApp() && settings.enabled) {
      syncScheduleToNativeAndroidAlarm(items, settings.notifyMinutesBefore);
    }
  }, [items, settings.enabled, settings.notifyMinutesBefore]);

  // Inisialisasi Android Native Channel & Izin jika berjalan di APK
  useEffect(() => {
    if (isNativeAndroidApp()) {
      setupNativeNotificationChannel();
      requestNativeAlarmPermission().then((granted) => {
        setPermission(granted ? 'granted' : 'denied');
      });
    }
  }, []);

  // Update permission status saat window fokus
  useEffect(() => {
    const checkPerm = async () => {
      if (isNativeAndroidApp()) {
        const granted = await requestNativeAlarmPermission();
        setPermission(granted ? 'granted' : 'denied');
      } else {
        setPermission(getNotificationPermissionStatus());
      }
    };
    window.addEventListener('focus', checkPerm);
    return () => window.removeEventListener('focus', checkPerm);
  }, []);

  const requestPermission = useCallback(async () => {
    if (isNativeAndroidApp()) {
      const granted = await requestNativeAlarmPermission();
      const status: NotificationStatus = granted ? 'granted' : 'denied';
      setPermission(status);
      return status;
    }
    const status = await requestNotificationPermission();
    setPermission(status);
    return status;
  }, []);

  const stopActiveAlarm = useCallback(() => {
    stopAlarmRinging();
    setActiveAlarmItem(null);
    setIsTestRinging(false);
    if (settings.enabled && settings.backgroundKeepAlive) {
      startBackgroundKeepAlive().then((ok) => setIsKeepAliveOn(ok));
    }
  }, [settings.enabled, settings.backgroundKeepAlive]);

  const snoozeAlarm = useCallback((minutes = 5) => {
    stopAlarmRinging();
    setActiveAlarmItem(null);
    setTimeout(() => {
      startAlarmRinging(settings.volume, settings.vibrateEnabled);
    }, minutes * 60 * 1000);
  }, [settings.volume, settings.vibrateEnabled]);

  const testAlarm = useCallback(async () => {
    setIsTestRinging(true);
    if (settings.soundEnabled) {
      startAlarmRinging(settings.volume, settings.vibrateEnabled);
    } else if (settings.vibrateEnabled) {
      triggerVibration();
    }

    if (isNativeAndroidApp()) {
      await triggerNativeImmediateNotification();
    } else {
      sendScheduleNotification('🔔 Uji Coba Alarm & Getar', {
        body: 'Nada dering chime dan getar HP berhasil diuji coba!',
        tag: 'test-alarm',
      });
    }

    // Otomatis matikan tes setelah 6 detik jika tidak dihentikan manual
    setTimeout(() => {
      setIsTestRinging(false);
      stopAlarmRinging();
      if (settings.enabled && settings.backgroundKeepAlive) {
        startBackgroundKeepAlive();
      }
    }, 6000);
  }, [settings]);

  const testDelayedAlarm = useCallback(async (seconds: number = 5) => {
    if (isNativeAndroidApp()) {
      return await triggerNativeDelayedAlarm(seconds);
    }
    return false;
  }, []);

  // Pemeriksaan berkala jadwal terhadap waktu WIB
  useEffect(() => {
    if (!settings.enabled) return;

    const checkSchedule = () => {
      const wib = getWIBDate();
      const currentDay = wib.dayName;
      const currentH = wib.hours;
      const currentM = wib.minutes;
      const todayDateStr = `${wib.date.getFullYear()}-${wib.date.getMonth() + 1}-${wib.date.getDate()}`;

      // Reset cache triggered keys saat berganti hari
      if (!triggeredKeysRef.current.has(todayDateStr)) {
        triggeredKeysRef.current.clear();
        triggeredKeysRef.current.add(todayDateStr);
      }

      // Cari agenda hari ini yang startHour & startMinute sesuai
      for (const item of items) {
        if (item.hari !== currentDay) continue;

        let sHour = item.startHour;
        let sMinute = item.startMinute ?? 0;

        if (sHour === undefined) {
          const match = item.jam.match(/(\d{1,2})[.:](\d{2})/);
          if (match) {
            sHour = parseInt(match[1], 10);
            sMinute = parseInt(match[2], 10);
          }
        }

        if (sHour === undefined) continue;

        // Hitung waktu target
        let targetTotalMinutes = sHour * 60 + sMinute - settings.notifyMinutesBefore;
        if (targetTotalMinutes < 0) targetTotalMinutes += 24 * 60;

        const currentTotalMinutes = currentH * 60 + currentM;

        if (currentTotalMinutes === targetTotalMinutes) {
          const triggerKey = `${todayDateStr}_${item.id}_${targetTotalMinutes}`;
          if (!triggeredKeysRef.current.has(triggerKey)) {
            triggeredKeysRef.current.add(triggerKey);

            // Nyalakan Alarm!
            setActiveAlarmItem(item);

            if (settings.soundEnabled) {
              startAlarmRinging(settings.volume, settings.vibrateEnabled);
            } else if (settings.vibrateEnabled) {
              triggerVibration();
            }

            // Notifikasi sistem HP / browser
            sendScheduleNotification(`⏰ Waktunya: ${item.kegiatan}`, {
              body: `${item.jam}${item.keterangan ? ' — ' + item.keterangan : ''}`,
              tag: `alarm-${item.id}`,
            });
            break;
          }
        }
      }
    };

    // Jalankan segera dan setiap 5 detik agar akurat
    checkSchedule();
    const interval = setInterval(checkSchedule, 5000);
    return () => clearInterval(interval);
  }, [items, settings]);

  return {
    settings,
    setSettings,
    permission,
    requestPermission,
    activeAlarmItem,
    stopActiveAlarm,
    snoozeAlarm,
    testAlarm,
    testDelayedAlarm,
    isTestRinging,
    isKeepAliveOn,
    toggleKeepAlive: () => {
      setSettings(prev => ({ ...prev, backgroundKeepAlive: !prev.backgroundKeepAlive }));
    }
  };
}
