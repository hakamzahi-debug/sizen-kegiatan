import * as XLSX from 'xlsx';
import { ScheduleItem } from '../types';
import { CATEGORY_CONFIG, DAYS_ORDER } from '../data/scheduleData';

export function exportToExcel(items: ScheduleItem[], filename = 'Jadwal_Kegiatan_Mingguan.xlsx') {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // 1. MAIN TABLE SHEET
  const headers = ['No', 'Hari', 'Jam (WIB)', 'Kegiatan / Fokus', 'Kategori', 'Keterangan / Catatan'];
  
  const dataRows: (string | number)[][] = [];

  let currentDay = '';
  let counter = 1;

  items.forEach((item) => {
    // If new day, we can note it or just keep row clean
    dataRows.push([
      counter++,
      item.hari,
      item.jam,
      item.kegiatan,
      CATEGORY_CONFIG[item.kategori]?.label || item.kategori,
      item.keterangan,
    ]);
  });

  const sheetData = [
    ['JADWAL KEGIATAN MINGGUAN (WIB)'],
    ['Diperbarui secara otomatis • Senin - Minggu'],
    [], // Empty spacer row
    headers,
    ...dataRows,
    [],
    ['Total Kegiatan', items.length, '', '', '', ''],
  ];

  const mainSheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Define column widths for neat Excel appearance
  mainSheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Hari
    { wch: 18 }, // Jam
    { wch: 38 }, // Kegiatan / Fokus
    { wch: 20 }, // Kategori
    { wch: 45 }, // Keterangan / Catatan
  ];

  // Set merges for title
  mainSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
  ];

  XLSX.utils.book_append_sheet(workbook, mainSheet, 'Jadwal Lengkap');

  // 2. DAY-BY-DAY SEPARATE SHEETS or SUMMARY SHEET
  // Summary by day:
  const summaryHeaders = ['Hari', 'Total Kegiatan', 'Waktu Mulai', 'Selesai', 'Fokus Utama'];
  const summaryRows: (string | number)[][] = [];

  DAYS_ORDER.forEach((day) => {
    const dayItems = items.filter((i) => i.hari === day);
    if (dayItems.length > 0) {
      const first = dayItems[0].jam.split('–')[0]?.trim() || '';
      const last = dayItems[dayItems.length - 1].jam.split('–')[1]?.trim() || 'Selesai';
      const focuses = Array.from(new Set(dayItems.map((i) => CATEGORY_CONFIG[i.kategori]?.label || i.kategori))).join(', ');
      summaryRows.push([day, dayItems.length, first, last, focuses]);
    }
  });

  const summaryData = [
    ['RINGKASAN JADWAL MINGGUAN'],
    [],
    summaryHeaders,
    ...summaryRows,
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [
    { wch: 12 },
    { wch: 16 },
    { wch: 15 },
    { wch: 15 },
    { wch: 50 },
  ];
  summarySheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Harian');

  // Trigger download
  XLSX.writeFile(workbook, filename);
}

export function exportToCSV(items: ScheduleItem[], filename = 'Jadwal_Kegiatan_Mingguan.csv') {
  const headers = ['No', 'Hari', 'Jam (WIB)', 'Kegiatan / Fokus', 'Kategori', 'Keterangan / Catatan'];
  
  const rows = items.map((item, index) => [
    index + 1,
    `"${item.hari}"`,
    `"${item.jam}"`,
    `"${item.kegiatan.replace(/"/g, '""')}"`,
    `"${CATEGORY_CONFIG[item.kategori]?.label || item.kategori}"`,
    `"${item.keterangan.replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyTableToClipboard(items: ScheduleItem[]): Promise<boolean> {
  const headers = ['Hari', 'Jam (WIB)', 'Kegiatan / Fokus', 'Keterangan / Catatan'];
  const rows = items.map((item) => [
    item.hari,
    item.jam,
    item.kegiatan,
    item.keterangan,
  ]);

  const tsv = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');

  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}
