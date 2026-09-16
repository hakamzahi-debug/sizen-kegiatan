// Service untuk Web Notification & Service Worker Push/Local Notification

export type NotificationStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermissionStatus(): NotificationStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationStatus;
}

export async function requestNotificationPermission(): Promise<NotificationStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const perm = await Notification.requestPermission();
    return perm as NotificationStatus;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'default';
  }
}

/**
 * Mengirim notifikasi lokal via Service Worker jika terdaftar, atau fallback ke Notification standar
 */
export async function sendScheduleNotification(
  title: string,
  options: {
    body: string;
    tag?: string;
    vibratePattern?: number[];
  }
) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const notificationOptions = {
    body: options.body,
    icon: '/pwa-192x192.png',
    badge: '/icon.svg',
    tag: options.tag || 'jadwal-alarm',
    vibrate: options.vibratePattern || [500, 250, 500, 250, 500, 250, 800],
    renotify: true,
    requireInteraction: true, // Notifikasi tetap ada di layar sampai disentuh pengguna
    silent: false,
  };

  try {
    // Coba kirim lewat Service Worker registration (paling baik untuk mobile / PWA)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions as NotificationOptions);
        return;
      }
    }

    // Fallback bila Service Worker belum aktif
    new Notification(title, notificationOptions as NotificationOptions);
  } catch (err) {
    console.warn('Gagal menampilkan notifikasi sistem:', err);
  }
}

/**
 * Menjadwalkan notifikasi menggunakan Notification Triggers API jika didukung oleh browser/OS (Chromium Android)
 */
export async function scheduleNotificationWithTrigger(
  title: string,
  timestampMs: number,
  options: {
    body: string;
    tag: string;
  }
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        // Cek dukungan Notification Triggers API
        const NotificationWithTrigger = Notification as unknown as { prototype: { showTrigger?: unknown } };
        const WindowWithTrigger = window as unknown as { TimestampTrigger?: new (timestamp: number) => unknown };

        if ('showTrigger' in NotificationWithTrigger.prototype && WindowWithTrigger.TimestampTrigger) {
          const trigger = new WindowWithTrigger.TimestampTrigger(timestampMs);
          await reg.showNotification(title, {
            body: options.body,
            icon: '/pwa-192x192.png',
            badge: '/icon.svg',
            tag: options.tag,
            showTrigger: trigger,
            vibrate: [500, 250, 500, 250, 500, 250, 800],
            requireInteraction: true,
            renotify: true,
          } as NotificationOptions);
          return true;
        }
      }
    }
  } catch (err) {
    console.warn('Notification Trigger scheduling error:', err);
  }
  return false;
}
