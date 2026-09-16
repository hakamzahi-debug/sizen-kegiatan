import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ScheduleItem } from '../types';

export const isNativeAndroidApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

const DAY_MAP_CAPACITOR: Record<string, number> = {
  Minggu: 1,
  Senin: 2,
  Selasa: 3,
  Rabu: 4,
  Kamis: 5,
  Jumat: 6,
  Sabtu: 7,
};

/**
 * Inisialisasi Android Notification Channel dengan prioritas tertinggi (High Importance)
 * agar bersuara, bergetar, dan memunculkan pop-up saat aplikasi mati
 */
export async function setupNativeNotificationChannel(): Promise<void> {
  if (!isNativeAndroidApp()) return;

  try {
    await LocalNotifications.createChannel({
      id: 'jadwalku_alarm_high_priority',
      name: 'Alarm Kegiatan JadwalKu',
      description: 'Saluran alarm prioritas tinggi untuk membangunkan HP dan berdering saat aplikasi mati',
      importance: 5, // 5 = IMPORTANCE_HIGH (berdering + pop-up heads-up)
      visibility: 1, // 1 = VISIBILITY_PUBLIC (tampil di layar kunci)
      vibration: true,
      lights: true,
      lightColor: '#059669',
    });
  } catch (err) {
    console.warn('Gagal membuat Android notification channel:', err);
  }
}

/**
 * Minta izin Local Notifications di Android 13+ (POST_NOTIFICATIONS dan SCHEDULE_EXACT_ALARM)
 */
export async function requestNativeAlarmPermission(): Promise<boolean> {
  if (!isNativeAndroidApp()) return false;

  try {
    const check = await LocalNotifications.checkPermissions();
    if (check.display === 'granted') {
      return true;
    }
    const status = await LocalNotifications.requestPermissions();
    return status.display === 'granted';
  } catch (err) {
    console.warn('Gagal meminta izin native local notification:', err);
    return false;
  }
}

/**
 * Memicu notifikasi uji coba langsung ke bilah notifikasi Android (Tray)
 */
export async function triggerNativeImmediateNotification(): Promise<boolean> {
  if (!isNativeAndroidApp()) return false;
  try {
    await setupNativeNotificationChannel();
    const hasPerm = await requestNativeAlarmPermission();
    if (!hasPerm) return false;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 999990,
          title: '🔔 Uji Coba: Alarm & Getar JadwalKu',
          body: 'Notifikasi Android native berhasil masuk ke bilah HP Anda!',
          channelId: 'jadwalku_alarm_high_priority',
          smallIcon: 'ic_stat_alarm',
          iconColor: '#059669',
          schedule: {
            at: new Date(Date.now() + 1000),
            allowWhileIdle: true,
          },
        },
      ],
    });
    return true;
  } catch (err) {
    console.error('Gagal memicu notifikasi native langsung:', err);
    return false;
  }
}

/**
 * Menjadwalkan alarm tes hitung mundur beberapa detik ke depan
 * Pengguna bisa menutup aplikasi / mematikan layar dan alarm tetap akan berdering
 */
export async function triggerNativeDelayedAlarm(seconds: number = 5): Promise<boolean> {
  if (!isNativeAndroidApp()) return false;
  try {
    await setupNativeNotificationChannel();
    const hasPerm = await requestNativeAlarmPermission();
    if (!hasPerm) return false;

    const fireAt = new Date(Date.now() + seconds * 1000);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 999991,
          title: '⏰ ALARM BERDERING! (Aplikasi Ditutup)',
          body: `Alarm uji coba berhasil berdering setelah ${seconds} detik meski aplikasi ditutup!`,
          channelId: 'jadwalku_alarm_high_priority',
          smallIcon: 'ic_stat_alarm',
          iconColor: '#059669',
          schedule: {
            at: fireAt,
            allowWhileIdle: true,
          },
        },
      ],
    });
    return true;
  } catch (err) {
    console.error('Gagal menjadwalkan tes alarm tertunda:', err);
    return false;
  }
}

/**
 * Mendaftarkan seluruh agenda mingguan ke Android AlarmManager (LocalNotifications)
 * Ini dieksekusi langsung oleh kernel/OS Android sehingga PASTI berdering walau aplikasi ditutup/HP mati
 */
export async function syncScheduleToNativeAndroidAlarm(
  items: ScheduleItem[],
  minutesBefore: number = 0
): Promise<{ success: boolean; count: number }> {
  if (!isNativeAndroidApp()) {
    return { success: false, count: 0 };
  }

  try {
    await setupNativeNotificationChannel();
    const perm = await requestNativeAlarmPermission();
    if (!perm) {
      return { success: false, count: 0 };
    }

    // Bersihkan jadwal lama agar tidak dobel
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    const notificationsToSchedule = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const weekday = DAY_MAP_CAPACITOR[item.hari];
      if (!weekday) continue;

      let startH = item.startHour;
      let startM = item.startMinute ?? 0;

      if (startH === undefined) {
        const match = item.jam.match(/(\d{1,2})[.:](\d{2})/);
        if (match) {
          startH = parseInt(match[1], 10);
          startM = parseInt(match[2], 10);
        }
      }

      if (startH === undefined) continue;

      let notifH = startH;
      let notifM = startM - minutesBefore;
      if (notifM < 0) {
        notifM += 60;
        notifH = (notifH - 1 + 24) % 24;
      }

      notificationsToSchedule.push({
        id: i + 1001,
        title: `⏰ Alarm Jadwal: ${item.kegiatan}`,
        body: `${item.hari}, ${item.jam}${item.keterangan ? ' — ' + item.keterangan : ''}`,
        channelId: 'jadwalku_alarm_high_priority',
        smallIcon: 'ic_stat_alarm',
        iconColor: '#059669',
        schedule: {
          on: {
            weekday: weekday,
            hour: notifH,
            minute: notifM,
          },
          allowWhileIdle: true, // WAJIB: Membangunkan Android dari Doze Mode (layar mati)
        },
        extra: {
          itemId: item.id,
          kegiatan: item.kegiatan,
        },
      });
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule,
      });
    }

    return { success: true, count: notificationsToSchedule.length };
  } catch (err) {
    console.error('Gagal sync ke Native Android Alarm:', err);
    return { success: false, count: 0 };
  }
}
