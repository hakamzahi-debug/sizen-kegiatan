import React from 'react';
import { ScheduleItem } from '../types';
import { BookOpen, Dumbbell, Palette, School } from 'lucide-react';

interface ScheduleStatsProps {
  items: ScheduleItem[];
}

export const ScheduleStats: React.FC<ScheduleStatsProps> = ({ items }) => {
  const countBelajar = items.filter((i) => i.kategori === 'belajar' || i.kategori === 'bimbel').length;
  const countOlahraga = items.filter((i) => i.kategori === 'olahraga').length;
  const countAnimasi = items.filter((i) => i.kategori === 'animasi').length;
  const countSekolah = items.filter((i) => i.kategori === 'sekolah').length;

  const statCards = [
    {
      title: 'Belajar & Bimbel',
      count: `${countBelajar} Sesi`,
      desc: 'TKA, SNBT, SKD, US',
      icon: BookOpen,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      badge: 'Prioritas',
      badgeColor: 'bg-indigo-50 text-indigo-700'
    },
    {
      title: 'Olahraga Rutin',
      count: `${countOlahraga} Hari`,
      desc: '1,5 Jam setiap sore',
      icon: Dumbbell,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      badge: 'Fisik & Sehat',
      badgeColor: 'bg-amber-50 text-amber-700'
    },
    {
      title: 'Karya Animasi',
      count: `${countAnimasi} Sesi`,
      desc: 'Jumat, Sabtu, Minggu',
      icon: Palette,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badge: 'Kreatif',
      badgeColor: 'bg-emerald-50 text-emerald-700'
    },
    {
      title: 'Sekolah Formal',
      count: `${countSekolah} Hari`,
      desc: 'Senin s.d. Jumat',
      icon: School,
      iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
      badge: 'Wajib',
      badgeColor: 'bg-sky-50 text-sky-700'
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:hidden">
      {statCards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div 
            key={idx} 
            className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:border-slate-300/80 transition-all duration-200 flex flex-col justify-between group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${card.iconBg}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block">
                {card.title}
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {card.count}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {card.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
