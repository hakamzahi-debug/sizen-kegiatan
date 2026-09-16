export type DayName = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';

export type ActivityCategory = 
  | 'sekolah'
  | 'ibadah_rehat'
  | 'olahraga'
  | 'belajar'
  | 'bimbel'
  | 'animasi'
  | 'santai';

export interface ScheduleItem {
  id: string;
  hari: DayName;
  jam: string;
  startHour?: number;
  startMinute?: number;
  endHour?: number;
  endMinute?: number;
  kegiatan: string;
  keterangan: string;
  kategori: ActivityCategory;
}

export interface DayGroup {
  hari: DayName;
  items: ScheduleItem[];
  color: string;
}

export interface AlarmSettings {
  enabled: boolean;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  notifyMinutesBefore: number;
  volume: number;
  backgroundKeepAlive: boolean;
}
