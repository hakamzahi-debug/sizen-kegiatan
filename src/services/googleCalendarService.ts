import { ScheduleItem, DayName } from '../types';
import { parseTimeRange } from '../utils/timeUtils';

export const DAY_TO_RRULE_DAY: Record<DayName, string> = {
  Senin: 'MO',
  Selasa: 'TU',
  Rabu: 'WE',
  Kamis: 'TH',
  Jumat: 'FR',
  Sabtu: 'SA',
  Minggu: 'SU',
};

export const DAY_TO_WEEKDAY_INDEX: Record<DayName, number> = {
  Minggu: 0,
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
};

// Google Calendar Event Color IDs (1-11)
export const CATEGORY_TO_COLOR_ID: Record<string, string> = {
  sekolah: '7',     // Peacock (Cyan/Blue)
  belajar: '5',     // Banana (Yellow)
  bimbel: '4',      // Flamingo (Coral/Orange)
  olahraga: '6',    // Tangerine (Orange)
  animasi: '3',     // Grape (Purple)
  ibadah_rehat: '2', // Sage (Green)
  santai: '1',      // Lavender (Soft Blue/Purple)
  lainnya: '8',     // Graphite
};

/**
 * Calculates the next occurrence Date for a given DayName starting from this week.
 */
export function getNextDateForDay(targetDay: DayName): Date {
  const now = new Date();
  const currentDayIndex = now.getDay(); // 0 is Sunday, 1 is Monday...
  const targetDayIndex = DAY_TO_WEEKDAY_INDEX[targetDay];
  
  let diff = targetDayIndex - currentDayIndex;
  // If the target day has already passed earlier this week, or is today but we want the current week's base
  // We align with the current week (Sunday - Saturday)
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + diff);
  return targetDate;
}

/**
 * Formats a Date and time into RFC3339 string with WIB offset (+07:00).
 */
export function formatRFC3339WIB(date: Date, hours: number, minutes: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  return `${year}-${month}-${day}T${h}:${m}:00+07:00`;
}

export interface GoogleCalendarEventPayload {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  recurrence?: string[];
  colorId?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
}

/**
 * Builds the event payload for Google Calendar from a ScheduleItem.
 */
export function buildEventPayload(item: ScheduleItem, recurring: boolean = true): GoogleCalendarEventPayload {
  const parsed = parseTimeRange(item.jam);
  const startH = item.startHour ?? parsed.startHour;
  const startM = item.startMinute ?? parsed.startMinute;
  let endH = item.endHour ?? parsed.endHour;
  let endM = item.endMinute ?? parsed.endMinute;

  // Fallback if end time is same as or before start time
  if (endH < startH || (endH === startH && endM <= startM)) {
    endH = (startH + 1) % 24;
    endM = startM;
  }

  const baseDate = getNextDateForDay(item.hari);
  const startDateTime = formatRFC3339WIB(baseDate, startH, startM);
  const endDateTime = formatRFC3339WIB(baseDate, endH, endM);

  const payload: GoogleCalendarEventPayload = {
    summary: item.kegiatan,
    description: `JadwalKu • Hari: ${item.hari} (${item.jam})\nKategori: ${item.kategori.toUpperCase()}${
      item.keterangan ? `\nKeterangan: ${item.keterangan}` : ''
    }`,
    start: {
      dateTime: startDateTime,
      timeZone: 'Asia/Jakarta',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Asia/Jakarta',
    },
    colorId: CATEGORY_TO_COLOR_ID[item.kategori] || '7',
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 10 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  if (recurring) {
    const rruleDay = DAY_TO_RRULE_DAY[item.hari];
    payload.recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${rruleDay}`];
  }

  return payload;
}

/**
 * Creates an event in the user's primary Google Calendar.
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  item: ScheduleItem,
  recurring: boolean = true
): Promise<any> {
  const payload = buildEventPayload(item, recurring);
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Google Calendar API Error (${res.status}): ${errorBody}`);
  }

  return await res.json();
}

/**
 * Sync multiple schedule items to Google Calendar with batching & progress callbacks.
 */
export async function batchSyncToGoogleCalendar(
  accessToken: string,
  items: ScheduleItem[],
  recurring: boolean,
  onProgress?: (completed: number, total: number, currentItemName: string) => void
): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
  let successCount = 0;
  let failureCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (onProgress) {
      onProgress(i, items.length, item.kegiatan);
    }

    try {
      await createGoogleCalendarEvent(accessToken, item, recurring);
      successCount++;
    } catch (err: any) {
      console.error(`Failed to sync item ${item.kegiatan}:`, err);
      failureCount++;
      errors.push(`${item.kegiatan}: ${err.message || 'Unknown error'}`);
    }

    // Small delay to prevent hitting rapid rate limits
    if (i < items.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  if (onProgress) {
    onProgress(items.length, items.length, 'Selesai');
  }

  return { successCount, failureCount, errors };
}

/**
 * Retrieves upcoming events from Google Calendar for the next 7 days.
 */
export async function fetchUpcomingGoogleCalendarEvents(accessToken: string): Promise<any[]> {
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', now.toISOString());
  url.searchParams.set('timeMax', nextWeek.toISOString());
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '50');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil data Google Calendar (${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Deletes an event from Google Calendar (requires user confirmation before calling).
 */
export async function deleteGoogleCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Gagal menghapus agenda di Google Calendar (${res.status})`);
  }
}
