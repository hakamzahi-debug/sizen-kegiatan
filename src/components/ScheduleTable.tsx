import React from 'react';
import { 
  Clock, 
  Edit3, 
  Trash2, 
  Sparkles,
  CalendarCheck
} from 'lucide-react';
import { ScheduleItem, DayName } from '../types';
import { CATEGORY_CONFIG } from '../data/scheduleData';
import { getWIBDate, isItemActiveNow } from '../utils/timeUtils';

interface ScheduleTableProps {
  items: ScheduleItem[];
  onEditItem: (item: ScheduleItem) => void;
  onDeleteItem: (id: string) => void;
  searchQuery?: string;
  selectedDay: DayName | 'ALL';
  onResetFilters?: () => void;
  onRestoreDefault?: () => void;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  items,
  onEditItem,
  onDeleteItem,
  searchQuery = '',
  selectedDay,
  onResetFilters,
  onRestoreDefault,
}) => {
  const wib = getWIBDate();

  // Helper to highlight matching search text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 text-amber-950 rounded px-1 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const dayColorMap: Record<DayName, { badge: string; border: string }> = {
    Senin: { badge: 'bg-sky-50 text-sky-800 border-sky-200', border: 'border-l-sky-500' },
    Selasa: { badge: 'bg-teal-50 text-teal-800 border-teal-200', border: 'border-l-teal-500' },
    Rabu: { badge: 'bg-violet-50 text-violet-800 border-violet-200', border: 'border-l-violet-500' },
    Kamis: { badge: 'bg-amber-50 text-amber-800 border-amber-200', border: 'border-l-amber-500' },
    Jumat: { badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', border: 'border-l-emerald-500' },
    Sabtu: { badge: 'bg-rose-50 text-rose-800 border-rose-200', border: 'border-l-rose-500' },
    Minggu: { badge: 'bg-indigo-50 text-indigo-800 border-indigo-200', border: 'border-l-indigo-500' },
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3.5">
          <CalendarCheck className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Tidak ada agenda ditemukan</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          Tidak ada kegiatan yang cocok dengan pencarian atau filter yang dipilih, atau jadwal mingguan sedang disinkronkan.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
          {onResetFilters && (
            <button
              type="button"
              id="btn-reset-filters-empty"
              onClick={onResetFilters}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer active:scale-95"
            >
              Tampilkan Semua Hari & Jadwal
            </button>
          )}
          {onRestoreDefault && (
            <button
              type="button"
              id="btn-restore-default-empty"
              onClick={onRestoreDefault}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer active:scale-95"
            >
              Pulihkan Jadwal Lengkap (49 Kegiatan)
            </button>
          )}
        </div>
      </div>
    );
  }

  let lastDay: DayName | '' = '';

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none">
      {/* Table responsive wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-4 w-12 text-center font-mono">
                No
              </th>
              <th scope="col" className="py-3.5 px-4 w-28">
                Hari
              </th>
              <th scope="col" className="py-3.5 px-4 w-44">
                Jam (WIB)
              </th>
              <th scope="col" className="py-3.5 px-4">
                Kegiatan / Fokus
              </th>
              <th scope="col" className="py-3.5 px-4 w-36">
                Kategori
              </th>
              <th scope="col" className="py-3.5 px-4">
                Keterangan
              </th>
              <th scope="col" className="py-3.5 px-4 w-24 text-center print:hidden">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
            {items.map((item, index) => {
              const isActive = isItemActiveNow(item, wib.dayName, wib.hours, wib.minutes);
              const isNewDay = selectedDay === 'ALL' && item.hari !== lastDay;
              if (selectedDay === 'ALL') {
                lastDay = item.hari;
              }
              const category = CATEGORY_CONFIG[item.kategori] || {
                label: item.kategori,
                badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                dotClass: 'bg-slate-400',
              };

              const dayTheme = dayColorMap[item.hari] || {
                badge: 'bg-slate-100 text-slate-800 border-slate-200',
                border: 'border-l-slate-400',
              };

              return (
                <React.Fragment key={item.id}>
                  {isNewDay && (
                    <tr className="bg-slate-50/70 border-t border-b border-slate-200/60 print:bg-slate-100">
                      <td colSpan={7} className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${dayTheme.badge}`}
                          >
                            Hari {item.hari}
                          </span>
                          <div className="h-px bg-slate-200/70 flex-1"></div>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr
                    id={`row-${item.id}`}
                    className={`transition-colors group ${
                      isActive
                        ? 'bg-emerald-50/90 hover:bg-emerald-100/70 font-medium'
                        : index % 2 === 0
                        ? 'bg-white hover:bg-slate-50/70'
                        : 'bg-slate-50/30 hover:bg-slate-100/60'
                    }`}
                  >
                    {/* No */}
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">
                      {index + 1}
                    </td>

                    {/* Hari */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold border ${dayTheme.badge}`}
                      >
                        {item.hari}
                      </span>
                    </td>

                    {/* Jam (WIB) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-slate-900">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{highlightText(item.jam, searchQuery)}</span>
                        {isActive && (
                          <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white animate-pulse shadow-xs">
                            <Sparkles className="w-2.5 h-2.5" />
                            AKTIF
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Kegiatan / Fokus */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {highlightText(item.kegiatan, searchQuery)}
                      </div>
                    </td>

                    {/* Kategori Tag */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${category.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${category.dotClass}`}></span>
                        {category.label}
                      </span>
                    </td>

                    {/* Keterangan / Catatan */}
                    <td className="py-3 px-4">
                      <div className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                        {highlightText(item.keterangan, searchQuery)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditItem(item)}
                          title="Edit kegiatan"
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus kegiatan "${item.kegiatan}"?`)) {
                              onDeleteItem(item.id);
                            }
                          }}
                          title="Hapus kegiatan"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer info */}
      <div className="bg-slate-50/80 border-t border-slate-200/80 px-4 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 print:hidden">
        <div>
          Menampilkan <span className="font-bold text-slate-800">{items.length}</span> agenda kegiatan
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Waktu Indonesia Barat (WIB)
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">Dapat diedit &amp; disinkronkan otomatis</span>
        </div>
      </div>
    </div>
  );
};
