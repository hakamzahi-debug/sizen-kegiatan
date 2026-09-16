import React from 'react';
import { ScheduleItem } from '../types';
import { DAYS_ORDER, CATEGORY_CONFIG } from '../data/scheduleData';
import { BookOpen, Trophy, Sparkles } from 'lucide-react';

interface ScheduleMatrixProps {
  items: ScheduleItem[];
  onEditItem: (item: ScheduleItem) => void;
}

export const ScheduleMatrix: React.FC<ScheduleMatrixProps> = ({ items, onEditItem }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          Matriks Perbandingan Fokus Belajar Malam (18.30 – 21.00 WIB)
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Rotasi materi belajar intensif setelah Sholat Isya setiap malam.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {DAYS_ORDER.map((day) => {
          const eveningItem = items.find(
            (i) => i.hari === day && (i.jam.includes('18.30') || i.jam.includes('19.00'))
          );

          return (
            <div
              key={day}
              className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50/80 transition flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-indigo-950 uppercase tracking-wide border-b border-indigo-200/60 pb-1.5 mb-2">
                  {day}
                </div>
                <div className="text-xs font-mono text-indigo-600 mb-1">
                  {eveningItem?.jam || '18.30 – 21.00'}
                </div>
                <div className="text-sm font-bold text-slate-900 leading-snug">
                  {eveningItem?.kegiatan || '-'}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-indigo-100 text-[11px] text-slate-600">
                {eveningItem?.keterangan || '-'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Routine Constants summary */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500" />
          Pola Rutinitas Harian yang Konsisten
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-900 block mb-1">Olahraga Sore (1,5 Jam)</span>
            <span className="text-slate-600">15.30 – 17.00 WIB setiap Senin s.d. Minggu (menjaga kebugaran fisik).</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-900 block mb-1">Ibadah Sholat 5 Waktu</span>
            <span className="text-slate-600">Terjadwal rapi: Asar (14.32), Magrib (17.24), Isya (18.31), Zuhur (11.21).</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-900 block mb-1">Projek Animasi Kreatif</span>
            <span className="text-slate-600">Fokus pengembangan karya animasi di hari Jumat, Sabtu, & Minggu.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
