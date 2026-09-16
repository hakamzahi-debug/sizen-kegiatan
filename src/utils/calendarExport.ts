import { ScheduleItem } from '../types';

/**
 * Konversi nama hari Indonesia ke kode iCalendar (BYDAY)
 */
const DAY_TO_BYDAY: Record<string, string> = {
  Senin: 'MO',
  Selasa: 'TU',
  Rabu: 'WE',
  Kamis: 'TH',
  Jumat: 'FR',
  Sabtu: 'SA',
  Minggu: 'SU',
};

const DAY_OFFSET: Record<string, number> = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
  Minggu: 7,
};

function pad(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Format date to iCalendar UTC/Local format: YYYYMMDDTHHMMSS
 */
function formatICSDate(year: number, month: number, day: number, hours: number, minutes: number): string {
  return `${year}${pad(month)}${pad(day)}T${pad(hours)}${pad(minutes)}00`;
}

/**
 * Menghasilkan file .ics (iCalendar) dengan pengingat alarm (VALARM) aktif
 * Kompatibel langsung dengan Google Calendar (Android), Samsung Calendar, dan Apple Calendar (iPhone)
 */
export function generateICS(items: ScheduleItem[], alarmMinutesBefore: number = 0): string {
  // Hitung tanggal Senin di minggu berjalan sebagai tanggal dasar perulangan mingguan
  const now = new Date();
  const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1=Mon, 7=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (currentDayOfWeek - 1));

  const year = monday.getFullYear();
  const month = monday.getMonth() + 1;
  const mondayDate = monday.getDate();

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jadwal Kegiatan Mingguan//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Jadwal Kegiatan Mingguan',
    'X-WR-TIMEZONE:Asia/Jakarta',
  ];

  for (const item of items) {
    const byDay = DAY_TO_BYDAY[item.hari];
    if (!byDay) continue;

    const dayOffset = (DAY_OFFSET[item.hari] || 1) - 1;
    const eventDate = new Date(year, month - 1, mondayDate + dayOffset);
    const evYear = eventDate.getFullYear();
    const evMonth = eventDate.getMonth() + 1;
    const evDay = eventDate.getDate();

    let startH = item.startHour ?? 7;
    let startM = item.startMinute ?? 0;
    let endH = item.endHour ?? (startH + 1);
    let endM = item.endMinute ?? 0;

    // Fallback jika belum terparsing
    if (item.startHour === undefined) {
      const match = item.jam.match(/(\d{1,2})[.:](\d{2})/);
      if (match) {
        startH = parseInt(match[1], 10);
        startM = parseInt(match[2], 10);
        endH = startH + 1;
        endM = startM;
      }
    }

    const dtStart = formatICSDate(evYear, evMonth, evDay, startH, startM);
    const dtEnd = formatICSDate(evYear, evMonth, evDay, endH, endM);
    const uid = `jadwal-${item.id}-${byDay}@jadwal-kegiatan`;
    const summary = (item.kegiatan || 'Kegiatan').replace(/[,;\\]/g, ' ');
    const description = (item.keterangan || `${item.kegiatan} (${item.hari} ${item.jam})`).replace(/[,;\\]/g, ' ');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DESCRIPTION:${description}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`);
    lines.push(`CATEGORIES:${item.kategori || 'Kegiatan'}`);
    lines.push('STATUS:CONFIRMED');

    // ALARM SISTEM NATIVE HP (VALARM)
    lines.push('BEGIN:VALARM');
    lines.push(`TRIGGER:-PT${alarmMinutesBefore}M`);
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:Pengingat: ${summary}`);
    lines.push('END:VALARM');

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Mengunduh file .ics dan memicu pembukaan otomatis di aplikasi Kalender/Alarm HP
 */
export function downloadCalendarICS(items: ScheduleItem[], alarmMinutesBefore: number = 0) {
  const icsContent = generateICS(items, alarmMinutesBefore);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Jadwal_Kegiatan_Mingguan.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
