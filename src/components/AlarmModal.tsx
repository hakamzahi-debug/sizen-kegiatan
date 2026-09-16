import React from 'react';
import { ScheduleItem } from '../types';
import { Bell, VolumeX, Clock, Timer } from 'lucide-react';

interface AlarmModalProps {
  item: ScheduleItem | null;
  onStop: () => void;
  onSnooze: () => void;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({ item, onStop, onSnooze }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-amber-400 p-6 sm:p-8 text-center text-slate-900 relative overflow-hidden">
        {/* Glowing pulsing background halo */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-200/50 rounded-full blur-2xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-emerald-200/50 rounded-full blur-2xl pointer-events-none animate-pulse" />

        {/* Animated Bell Icon */}
        <div className="mx-auto w-20 h-20 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-amber-500/40 animate-bounce mb-5">
          <Bell className="w-10 h-10 animate-[wiggle_1s_ease-in-out_infinite]" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold tracking-wider uppercase mb-2">
          <Clock className="w-3.5 h-3.5" />
          Alarm Jadwal Aktif
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 mb-2">
          {item.kegiatan}
        </h2>

        <div className="inline-block bg-slate-100 px-3 py-1 rounded-lg font-mono text-sm font-semibold text-slate-700 mb-3">
          {item.hari} • {item.jam}
        </div>

        {item.keterangan && (
          <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200/70 rounded-xl p-3 mb-6">
            {item.keterangan}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onStop}
            className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-base shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition transform active:scale-95"
          >
            <VolumeX className="w-5 h-5" />
            Matikan Alarm
          </button>

          <button
            type="button"
            onClick={onSnooze}
            className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center gap-1.5 transition"
          >
            <span>Tunda 5 Menit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
