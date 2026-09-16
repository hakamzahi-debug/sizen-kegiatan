import { DayName, ScheduleItem } from '../types';

export function getWIBDate(): { date: Date; dayName: DayName; timeString: string; hours: number; minutes: number } {
  // Menggunakan Jam Asli dari HP/Perangkat secara tepat dan real-time
  const now = new Date();

  const dayIndex = now.getDay(); // 0 is Sunday, 1 is Monday...
  const dayMap: Record<number, DayName> = {
    0: 'Minggu',
    1: 'Senin',
    2: 'Selasa',
    3: 'Rabu',
    4: 'Kamis',
    5: 'Jumat',
    6: 'Sabtu',
  };

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeString = `${String(hours).padStart(2, '0')}.${String(minutes).padStart(2, '0')}`;

  return {
    date: now,
    dayName: dayMap[dayIndex],
    timeString,
    hours,
    minutes,
  };
}

export function isItemActiveNow(item: ScheduleItem, currentDay: DayName, currentHours: number, currentMinutes: number): boolean {
  if (item.hari !== currentDay) return false;
  if (item.startHour === undefined || item.endHour === undefined) return false;

  const currentTotal = currentHours * 60 + currentMinutes;
  const startTotal = item.startHour * 60 + (item.startMinute || 0);
  const isEndOfDay = item.endHour >= 24 || (item.endHour === 23 && (item.endMinute || 0) >= 59);
  const endTotal = isEndOfDay ? 24 * 60 : item.endHour * 60 + (item.endMinute || 0);

  return currentTotal >= startTotal && currentTotal < endTotal;
}

export function parseTimeRange(timeStr: string): {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
} {
  // Typical formats: "07.00 – 15.00", "07:00 - 15:00", "07.00-15.00", "20.30 – 22.00"
  const clean = (timeStr || '').replace(/\s+/g, '').replace(/–/g, '-');
  const parts = clean.split('-');
  if (parts.length >= 2) {
    const startParts = parts[0].split(/[.:]/);
    const endParts = parts[1].split(/[.:]/);
    const startHour = parseInt(startParts[0], 10) || 7;
    const startMinute = parseInt(startParts[1], 10) || 0;
    const endHour = parseInt(endParts[0], 10) || (startHour + 1);
    const endMinute = parseInt(endParts[1], 10) || 0;
    return { startHour, startMinute, endHour, endMinute };
  }
  return { startHour: 7, startMinute: 0, endHour: 8, endMinute: 0 };
}
