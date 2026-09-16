import React from 'react';
import { Search, Filter, Calendar, LayoutList, Grid3X3, X } from 'lucide-react';
import { DayName, ActivityCategory } from '../types';
import { DAYS_ORDER, CATEGORY_CONFIG } from '../data/scheduleData';

interface FilterControlsProps {
  selectedDay: DayName | 'ALL';
  onSelectDay: (day: DayName | 'ALL') => void;
  selectedCategory: ActivityCategory | 'ALL';
  onSelectCategory: (category: ActivityCategory | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'table' | 'cards' | 'matrix';
  onViewModeChange: (mode: 'table' | 'cards' | 'matrix') => void;
  countsByDay: Record<DayName, number>;
  totalCount: number;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  selectedDay,
  onSelectDay,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  countsByDay,
  totalCount,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs space-y-3 print:hidden">
      {/* Top row: Day tabs & View toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Day selection tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none no-scrollbar">
          <button
            type="button"
            id="tab-day-all"
            onClick={() => onSelectDay('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
              selectedDay === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>Semua Hari</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-md font-mono ${
                selectedDay === 'ALL'
                  ? 'bg-slate-800 text-slate-200'
                  : 'bg-slate-200/80 text-slate-600'
              }`}
            >
              {totalCount}
            </span>
          </button>

          {DAYS_ORDER.map((day) => {
            const count = countsByDay[day] || 0;
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                id={`tab-day-${day.toLowerCase()}`}
                onClick={() => onSelectDay(day)}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{day}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-md font-mono ${
                    isSelected
                      ? 'bg-emerald-700 text-emerald-100'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View mode toggle buttons */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl self-start lg:self-auto border border-slate-200/60 shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            title="Tampilan Tabel (Rapi & Standar Excel)"
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Tabel</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('cards')}
            title="Tampilan Kartu Per Hari"
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
              viewMode === 'cards'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Kartu</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('matrix')}
            title="Tampilan Matriks Perbandingan Mingguan"
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
              viewMode === 'matrix'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Matriks</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Search & Category filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-slate-100">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="input-search-schedule"
            placeholder="Cari kegiatan (misal: Animasi, SNBT, SKD, Bimbel, Olahraga, Sholat)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50/90 hover:bg-slate-100/70 focus:bg-white border border-slate-200/80 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category filter dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              id="select-category-filter"
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value as ActivityCategory | 'ALL')}
              className="appearance-none pl-8 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 font-semibold hover:bg-slate-100/70 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition cursor-pointer shadow-2xs"
            >
              <option value="ALL">Semua Kategori</option>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>

          {(selectedCategory !== 'ALL' || searchQuery || selectedDay !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                onSelectDay('ALL');
                onSelectCategory('ALL');
                onSearchChange('');
              }}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold px-2.5 py-2 hover:bg-emerald-50 rounded-xl transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
