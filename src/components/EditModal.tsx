import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, Clock, Tag, AlignLeft, Sparkles } from 'lucide-react';
import { ScheduleItem, DayName, ActivityCategory } from '../types';
import { DAYS_ORDER, CATEGORY_CONFIG } from '../data/scheduleData';

interface EditModalProps {
  isOpen: boolean;
  item: ScheduleItem | null;
  onClose: () => void;
  onSave: (item: ScheduleItem) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, item, onClose, onSave }) => {
  const [hari, setHari] = useState<DayName>('Senin');
  const [jam, setJam] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [kategori, setKategori] = useState<ActivityCategory>('belajar');

  useEffect(() => {
    if (item) {
      setHari(item.hari);
      setJam(item.jam);
      setKegiatan(item.kegiatan);
      setKeterangan(item.keterangan);
      setKategori(item.kategori);
    } else {
      setHari('Senin');
      setJam('18.30 – 21.00');
      setKegiatan('');
      setKeterangan('');
      setKategori('belajar');
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kegiatan.trim() || !jam.trim()) {
      alert('Mohon isi jam dan nama kegiatan.');
      return;
    }

    const times = jam.split(/[–-]/).map((s) => s.trim().replace('.', ':'));
    let startHour: number | undefined;
    let startMinute: number | undefined;
    if (times[0]) {
      const [h, m] = times[0].split(':');
      if (h) startHour = parseInt(h, 10);
      if (m) startMinute = parseInt(m, 10);
    }

    const newItem: ScheduleItem = {
      id: item ? item.id : `custom-${Date.now()}`,
      hari,
      jam,
      startHour,
      startMinute,
      kegiatan: kegiatan.trim(),
      keterangan: keterangan.trim(),
      kategori,
    };

    onSave(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {item ? 'Edit Jadwal Kegiatan' : 'Tambah Kegiatan Baru'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            {/* Hari */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Hari <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={hari}
                onChange={(e) => setHari(e.target.value as DayName)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-2xs"
              >
                {DAYS_ORDER.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Kategori</span>
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as ActivityCategory)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-2xs"
              >
                {Object.entries(CATEGORY_CONFIG).map(([cat, conf]) => (
                  <option key={cat} value={cat}>
                    {conf.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Jam (WIB) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Jam (WIB) <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              placeholder="Contoh: 18.30 – 21.00 atau 21.00 – Selesai"
              value={jam}
              onChange={(e) => setJam(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
            />
          </div>

          {/* Kegiatan / Fokus */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              <span>Kegiatan / Fokus <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Belajar SNBT &amp; SKD Kedinasan"
              value={kegiatan}
              onChange={(e) => setKegiatan(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
            />
          </div>

          {/* Keterangan / Catatan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Keterangan / Catatan</span>
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Latihan TPS Penalaran Umum + Tryout 50 Soal"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none shadow-2xs"
            ></textarea>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition shadow-sm hover:shadow active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Simpan Jadwal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
