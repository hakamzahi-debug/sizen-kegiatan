import React from 'react';
import { Clock, Edit3, Trash2, CalendarCheck } from 'lucide-react';
import { ScheduleItem, DayName } from '../types';
import { CATEGORY_CONFIG, DAYS_ORDER } from '../data/scheduleData';
import { getWIBDate, isItemActiveNow } from '../utils/timeUtils';

interface CardsViewProps {
  items: ScheduleItem[];
  onEditItem: (item: ScheduleItem) => void;
  onDeleteItem: (id: string) => void;
  selectedDay: DayName | 'ALL';
  onResetFilters?: () => void;
  onRestoreDefault?: () => void;
}

export const CardsView: React.FC<CardsViewProps> = ({
  items,
  onEditItem,
  onDeleteItem,
  selectedDay,
  onResetFilters,
  onRestoreDefault,
}) => {
  const wib = getWIBDate();

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3.5">
          <CalendarCheck className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Tidak ada kartu agenda</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          Tidak ada kegiatan yang cocok dengan filter yang dipilih saat ini.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
          {onResetFilters && (
            <button
              type="button"
              id="btn-reset-filters-cards-empty"
              onClick={onResetFilters}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer active:scale-95"
            >
              Tampilkan Semua Hari & Jadwal
            </button>
          )}
          {onRestoreDefault && (
            <button
              type="button"
              id="btn-restore-default-cards-empty"
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

  const daysToShow = selectedDay === 'ALL' ? DAYS_ORDER : [selectedDay];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
      {daysToShow.map((day) => {
        const dayItems = items.filter((i) => i.hari === day);
        if (dayItems.length === 0) return null;

        const isToday = wib.dayName === day;

        return (
          <div
            key={day}
            className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden flex flex-col ${
              isToday
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                : 'border-slate-200/90 hover:border-slate-300'
            }`}
          >
            {/* Day Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isToday ? 'bg-emerald-50/80 border-emerald-200' : 'bg-slate-50/80 border-slate-200/80'
            }`}>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">{day}</h3>
                {isToday && (
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs animate-pulse">
                    Hari Ini
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
                {dayItems.length} Kegiatan
              </span>
            </div>

            {/* List of items for this day */}
            <div className="p-3.5 sm:p-4 space-y-2.5 flex-1">
              {dayItems.map((item) => {
                const isActive = isItemActiveNow(item, wib.dayName, wib.hours, wib.minutes);
                const category = CATEGORY_CONFIG[item.kategori] || {
                  label: item.kategori,
                  badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                  dotClass: 'bg-slate-400',
                };

                return (
                  <div
                    key={item.id}
                    className={`group rounded-xl p-3 transition border ${
                      isActive 
                        ? 'bg-emerald-50/90 border-emerald-300 shadow-2xs' 
                        : 'bg-white hover:bg-slate-50 border-slate-150'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-900">{item.jam}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${category.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${category.dotClass}`}></span>
                          {category.label}
                        </span>

                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => onEditItem(item)}
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus kegiatan "${item.kegiatan}"?`)) {
                                onDeleteItem(item.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-1">
                      {item.kegiatan}
                    </h4>

                    {item.keterangan && (
                      <p className="text-xs text-slate-600 bg-slate-50/80 border border-slate-200/60 rounded-lg p-2 leading-relaxed">
                        {item.keterangan}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
