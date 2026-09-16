import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Check, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  X, 
  Sparkles, 
  Repeat, 
  CalendarDays,
  Trash2,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ScheduleItem, DayName, AppUser } from '../types';
import { DAYS_ORDER } from '../data/scheduleData';
import { 
  batchSyncToGoogleCalendar, 
  createGoogleCalendarEvent, 
  fetchUpcomingGoogleCalendarEvents, 
  deleteGoogleCalendarEvent 
} from '../services/googleCalendarService';
import { requestCalendarToken, getCalendarAccessToken } from '../firebase';

interface GoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ScheduleItem[];
  user: AppUser | User | null;
  onLogin: () => Promise<void>;
}

export const GoogleCalendarModal: React.FC<GoogleCalendarModalProps> = ({
  isOpen,
  onClose,
  items,
  user,
  onLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'view'>('sync');
  const [isRecurring, setIsRecurring] = useState(true);
  const [selectedDayFilter, setSelectedDayFilter] = useState<DayName | 'ALL'>('ALL');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set(items.map((i) => i.id)));
  
  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: number; failure: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation dialog state (Mandatory for Workspace mutations)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Calendar events preview state
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{ id: string; summary: string } | null>(null);

  // Reset selected items when items prop changes
  useEffect(() => {
    setSelectedItemIds(new Set(items.map((i) => i.id)));
  }, [items]);

  if (!isOpen) return null;

  // Filter items by chosen day filter
  const itemsToDisplay = selectedDayFilter === 'ALL'
    ? items
    : items.filter((i) => i.hari === selectedDayFilter);

  const selectedItemsToSync = items.filter((i) => selectedItemIds.has(i.id));

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedItemIds(new Set(items.map((i) => i.id)));
  };

  const deselectAll = () => {
    setSelectedItemIds(new Set());
  };

  // Trigger sync process with confirmation
  const handleInitiateSync = () => {
    if (selectedItemsToSync.length === 0) {
      setErrorMessage('Pilih minimal satu agenda untuk disinkronkan.');
      return;
    }
    setErrorMessage(null);
    setSyncResult(null);
    setShowConfirmDialog(true);
  };

  const handleConfirmSync = async () => {
    setShowConfirmDialog(false);
    setIsSyncing(true);
    setErrorMessage(null);
    setSyncResult(null);

    try {
      const token = await requestCalendarToken();
      const result = await batchSyncToGoogleCalendar(
        token,
        selectedItemsToSync,
        isRecurring,
        (current, total, name) => {
          setSyncProgress({ current, total, name });
        }
      );

      setSyncResult({ success: result.successCount, failure: result.failureCount });
      if (result.failureCount > 0) {
        setErrorMessage(`Sebagian item gagal disinkronkan (${result.failureCount} gagal).`);
      }
    } catch (err: any) {
      console.error('Sync failed:', err);
      setErrorMessage(err.message || 'Gagal menyinkronkan dengan Google Calendar.');
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  // Load calendar events
  const handleLoadEvents = async () => {
    setIsLoadingEvents(true);
    setErrorMessage(null);
    try {
      const token = await requestCalendarToken();
      const events = await fetchUpcomingGoogleCalendarEvents(token);
      setCalendarEvents(events);
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      setErrorMessage(err.message || 'Gagal memuat agenda Google Calendar.');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Delete event from calendar with confirmation
  const handleConfirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      const token = await requestCalendarToken();
      await deleteGoogleCalendarEvent(token, eventToDelete.id);
      setCalendarEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
      setEventToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete event:', err);
      setErrorMessage(err.message || 'Gagal menghapus agenda.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-md shrink-0">
              <CalendarIcon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">Integrasi Google Calendar</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-blue-100">
                  Resmi
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                Sinkronkan kegiatan ke kalender Google agar muncul notifikasi di ponsel Anda.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15">
            <button
              type="button"
              onClick={() => setActiveTab('sync')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'sync'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Sinkronkan Agenda</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('view');
                if (user && calendarEvents.length === 0) {
                  handleLoadEvents();
                }
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'view'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Lihat Kalender Google</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-slate-800">
          {/* User Account / Authorization Status */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Akun'}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500/20"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  G
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-slate-500">Akun Google Terhubung</p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user?.email || 'Belum masuk dengan akun Google'}
                </p>
              </div>
            </div>

            {!user ? (
              <button
                type="button"
                onClick={onLogin}
                className="gsi-material-button w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>Masuk dengan Google</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Izin Kalender Aktif</span>
              </span>
            )}
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {syncResult && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p>
                  <strong>Sinkronisasi Selesai!</strong> Berhasil menambahkan{' '}
                  <span className="font-bold text-emerald-700">{syncResult.success}</span> agenda ke Google Calendar.
                </p>
              </div>
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 underline shrink-0"
              >
                <span>Buka Kalender</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* TAB 1: SINKRONKAN AGENDA */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              {/* Recurrence Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Tipe Jadwal di Google Calendar
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setIsRecurring(true)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                      isRecurring
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      isRecurring ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                    }`}>
                      {isRecurring && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Mingguan Berulang (Rekomendasi)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Agenda akan otomatis muncul setiap minggu pada hari & jam yang sama.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setIsRecurring(false)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                      !isRecurring
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      !isRecurring ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                    }`}>
                      {!isRecurring && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Minggu Ini Saja</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Agenda hanya dibuat satu kali untuk tanggal 7 hari ke depan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Day filter & item selection */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pilih Agenda ({selectedItemsToSync.length} terpilih)
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="text-slate-500 hover:text-slate-700 font-semibold"
                    >
                      Batal Pilih
                    </button>
                  </div>
                </div>

                {/* Filter Hari Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedDayFilter('ALL')}
                    className={`px-3 py-1 rounded-lg font-semibold shrink-0 transition ${
                      selectedDayFilter === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua Hari
                  </button>
                  {DAYS_ORDER.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDayFilter(day)}
                      className={`px-3 py-1 rounded-lg font-semibold shrink-0 transition ${
                        selectedDayFilter === day
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                {/* Items List */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {itemsToDisplay.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Tidak ada kegiatan pada hari yang dipilih.
                    </div>
                  ) : (
                    itemsToDisplay.map((item) => {
                      const isChecked = selectedItemIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleSelectItem(item.id)}
                          className={`p-3 text-xs flex items-center justify-between gap-3 cursor-pointer transition select-none ${
                            isChecked ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectItem(item.id)}
                              className="rounded-md text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{item.kegiatan}</p>
                              <p className="text-[11px] text-slate-500">
                                {item.hari} • {item.jam} {item.keterangan ? `(${item.keterangan})` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                            {item.kategori}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIHAT AGENDA GOOGLE CALENDAR */}
          {activeTab === 'view' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Agenda 7 Hari ke Depan dari Google Calendar
                </p>
                <button
                  type="button"
                  onClick={handleLoadEvents}
                  disabled={isLoadingEvents}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                  <span>Segarkan</span>
                </button>
              </div>

              {isLoadingEvents ? (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs">Memuat agenda dari Google Calendar...</span>
                </div>
              ) : calendarEvents.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Belum ada agenda dalam 7 hari ke depan</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gunakan tab "Sinkronkan Agenda" untuk mengekspor jadwal mingguan Anda.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {calendarEvents.map((evt) => {
                    const start = evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Sepanjang Hari';
                    const startDate = evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) : '';

                    return (
                      <div key={evt.id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50">
                        <div>
                          <p className="font-bold text-slate-900">{evt.summary || '(Tanpa Judul)'}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{startDate} • {start} WIB</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEventToDelete({ id: evt.id, summary: evt.summary || 'Agenda' })}
                          title="Hapus dari Google Calendar"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition"
          >
            Tutup
          </button>

          {activeTab === 'sync' && (
            <button
              type="button"
              id="btn-confirm-calendar-sync"
              onClick={handleInitiateSync}
              disabled={isSyncing || selectedItemsToSync.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md hover:shadow-lg transition"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {syncProgress
                      ? `Menyinkronkan (${syncProgress.current}/${syncProgress.total})...`
                      : 'Memproses...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Sinkronkan {selectedItemsToSync.length} Agenda ke Google</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Explicit User Confirmation Dialog for Workspace Sync Mutation (MANDATORY) */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Konfirmasi Sinkronisasi Google Calendar
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menambahkan <strong>{selectedItemsToSync.length} agenda</strong> ke Google Calendar utama Anda ({user?.email || 'Akun Google'})?
                </p>
                <div className="mt-2 p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-800">
                  • Mode: <strong>{isRecurring ? 'Mingguan Berulang (setiap minggu)' : 'Minggu Ini Saja'}</strong><br />
                  • Dilengkapi pengingat pop-up 10 menit sebelum jam mulai.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSync}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
              >
                Ya, Lanjutkan Sinkronisasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explicit User Confirmation Dialog for Deleting Event (MANDATORY) */}
      {eventToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-100 p-6 max-w-md w-full space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Agenda dari Google Calendar?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Agenda "<strong>{eventToDelete.summary}</strong>" akan dihapus secara permanen dari kalender Google Anda. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEvent}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
              >
                Hapus dari Kalender
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
