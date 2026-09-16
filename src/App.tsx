import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { FilterControls } from './components/FilterControls';
import { ScheduleTable } from './components/ScheduleTable';
import { CardsView } from './components/CardsView';
import { ScheduleMatrix } from './components/ScheduleMatrix';
import { ScheduleStats } from './components/ScheduleStats';
import { EditModal } from './components/EditModal';
import { AlarmModal } from './components/AlarmModal';
import { AlarmSettingsModal } from './components/AlarmSettingsModal';
import { GoogleCalendarModal } from './components/GoogleCalendarModal';
import { AuthModal } from './components/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useScheduleAlarm } from './hooks/useScheduleAlarm';
import { ScheduleItem, DayName, ActivityCategory, AppUser } from './types';
import { INITIAL_SCHEDULE, DAYS_ORDER } from './data/scheduleData';
import { getWIBDate, isItemActiveNow } from './utils/timeUtils';
import { Sparkles } from 'lucide-react';
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  subscribeToUserSchedules, 
  saveScheduleToFirestore, 
  deleteScheduleFromFirestore, 
  seedInitialSchedulesToFirestore,
  checkAuthRedirectResult
} from './firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { getStoredLocalUser, removeLocalUser } from './services/localAuthService';

const STORAGE_KEY = 'jadwal_mingguan_custom_v1';

function sanitizeScheduleItem(item: ScheduleItem): ScheduleItem {
  if (item.endHour !== undefined && item.endHour >= 24) {
    return {
      ...item,
      endHour: 23,
      endMinute: 59,
    };
  }
  return item;
}

function mergeWithInitialSchedule(existingItems: ScheduleItem[]): ScheduleItem[] {
  const map = new Map<string, ScheduleItem>();
  for (const item of INITIAL_SCHEDULE) {
    map.set(item.id, sanitizeScheduleItem(item));
  }
  for (const item of existingItems) {
    map.set(item.id, sanitizeScheduleItem(item));
  }
  return Array.from(map.values()).sort((a, b) => {
    const aDay = DAYS_ORDER.indexOf(a.hari);
    const bDay = DAYS_ORDER.indexOf(b.hari);
    if (aDay !== bDay) return aDay - bDay;
    const aHour = a.startHour ?? 0;
    const bHour = b.startHour ?? 0;
    return aHour - bHour;
  });
}

export default function App() {
  const [user, setUser] = useState<AppUser | User | null>(() => getStoredLocalUser());
  const [isSyncing, setIsSyncing] = useState(false);
  const hasSeededRef = useRef(false);

  const [items, setItems] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = parsed.map(sanitizeScheduleItem);
          if (sanitized.length < 20) {
            return mergeWithInitialSchedule(sanitized);
          }
          return sanitized;
        }
      }
    } catch (e) {
      console.error('Failed to load saved schedule', e);
    }
    return INITIAL_SCHEDULE;
  });

  const [selectedDay, setSelectedDay] = useState<DayName | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'matrix'>('table');
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlarmSettingsOpen, setIsAlarmSettingsOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Monitor Google Redirect & Firebase Auth status & Local in-app user
  useEffect(() => {
    // Check if user just returned from Google Redirect login
    checkAuthRedirectResult().catch((err) => console.error('Redirect result check:', err));

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Fallback to local in-app account if available
        const local = getStoredLocalUser();
        setUser(local);
      }
    });

    const handleLocalUserChanged = (e: any) => {
      if (!auth.currentUser) {
        setUser(e.detail || null);
      }
    };
    window.addEventListener('jadwalku_local_user_changed', handleLocalUserChanged);

    return () => {
      unsubscribe();
      window.removeEventListener('jadwalku_local_user_changed', handleLocalUserChanged);
    };
  }, []);

  // Sync with Firestore ONLY when user is logged in via Firebase (not local in-app profile)
  useEffect(() => {
    if (!user || (user as any).isLocal) return;

    setIsSyncing(true);
    const unsubscribe = subscribeToUserSchedules(
      user.uid,
      (cloudItems) => {
        setIsSyncing(false);
        if (cloudItems && cloudItems.length > 0) {
          let resolved = cloudItems.map(sanitizeScheduleItem);
          // If cloud has partial items (e.g. from previous broken seed with only 5 items),
          // merge with INITIAL_SCHEDULE to ensure all days are visible and re-seed to cloud
          if (cloudItems.length < 20) {
            resolved = mergeWithInitialSchedule(cloudItems);
            seedInitialSchedulesToFirestore(user.uid, resolved).catch((err) => {
              console.error('Failed to re-seed complete schedule to Firestore:', err);
            });
          }

          // Sort items by day and hour
          const sorted = [...resolved].sort((a, b) => {
            const aDay = DAYS_ORDER.indexOf(a.hari);
            const bDay = DAYS_ORDER.indexOf(b.hari);
            if (aDay !== bDay) return aDay - bDay;
            const aHour = a.startHour ?? 0;
            const bHour = b.startHour ?? 0;
            return aHour - bHour;
          });
          setItems(sorted);
        } else if (!hasSeededRef.current) {
          // If first time logging in and cloud collection is empty, seed complete schedule to Firestore
          hasSeededRef.current = true;
          const itemsToSeed = (items.length >= 20 ? items : INITIAL_SCHEDULE).map(sanitizeScheduleItem);
          seedInitialSchedulesToFirestore(user.uid, itemsToSeed).catch((err) => {
            console.error('Failed to seed initial schedules to Firestore:', err);
          });
          if (items.length < 20) {
            setItems(INITIAL_SCHEDULE);
          }
        }
      },
      (error) => {
        setIsSyncing(false);
        console.warn('Firestore snapshot error (using offline local storage):', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Hook alarm & getar HP
  const {
    settings: alarmSettings,
    setSettings: setAlarmSettings,
    permission: notificationPermission,
    requestPermission,
    activeAlarmItem,
    stopActiveAlarm,
    snoozeAlarm,
    testAlarm,
    testDelayedAlarm,
    isTestRinging,
    isKeepAliveOn,
  } = useScheduleAlarm(items);

  // Save to local storage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist items', e);
    }
  }, [items]);

  // Real-time WIB current activity check
  const [wibTime, setWibTime] = useState(getWIBDate());
  useEffect(() => {
    const timer = setInterval(() => {
      setWibTime(getWIBDate());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const currentActiveItem = useMemo(() => {
    return items.find((item) =>
      isItemActiveNow(item, wibTime.dayName, wibTime.hours, wibTime.minutes)
    );
  }, [items, wibTime]);

  // Counts per day
  const countsByDay = useMemo(() => {
    const counts: Record<DayName, number> = {
      Senin: 0,
      Selasa: 0,
      Rabu: 0,
      Kamis: 0,
      Jumat: 0,
      Sabtu: 0,
      Minggu: 0,
    };
    items.forEach((item) => {
      if (counts[item.hari] !== undefined) {
        counts[item.hari]++;
      }
    });
    return counts;
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Day filter
      if (selectedDay !== 'ALL' && item.hari !== selectedDay) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'ALL' && item.kategori !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchKegiatan = item.kegiatan.toLowerCase().includes(q);
        const matchKeterangan = item.keterangan.toLowerCase().includes(q);
        const matchJam = item.jam.toLowerCase().includes(q);
        const matchHari = item.hari.toLowerCase().includes(q);
        if (!matchKegiatan && !matchKeterangan && !matchJam && !matchHari) {
          return false;
        }
      }
      return true;
    });
  }, [items, selectedDay, selectedCategory, searchQuery]);

  // CRUD Handlers
  const handleSaveItem = async (savedItem: ScheduleItem) => {
    setItems((prev) => {
      const existsIndex = prev.findIndex((i) => i.id === savedItem.id);
      let next: ScheduleItem[];
      if (existsIndex >= 0) {
        next = [...prev];
        next[existsIndex] = savedItem;
      } else {
        next = [...prev, savedItem];
      }
      return next.sort((a, b) => {
        const aDay = DAYS_ORDER.indexOf(a.hari);
        const bDay = DAYS_ORDER.indexOf(b.hari);
        if (aDay !== bDay) return aDay - bDay;
        const aHour = a.startHour ?? 0;
        const bHour = b.startHour ?? 0;
        return aHour - bHour;
      });
    });

    // Save to Firebase if user is logged in to Cloud
    if (user && !(user as any).isLocal) {
      try {
        await saveScheduleToFirestore(user.uid, savedItem);
      } catch (err) {
        console.error('Failed to sync saved item to Firestore:', err);
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));

    // Delete from Firebase if user is logged in to Cloud
    if (user && !(user as any).isLocal) {
      try {
        await deleteScheduleFromFirestore(user.uid, id);
      } catch (err) {
        console.error('Failed to delete item from Firestore:', err);
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedDay('ALL');
    setSelectedCategory('ALL');
    setSearchQuery('');
  };

  const handleResetDefault = () => {
    if (confirm('Kembalikan jadwal ke data awal lengkap (49 kegiatan mingguan)?')) {
      setItems(INITIAL_SCHEDULE);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SCHEDULE));
      handleResetFilters();
      if (user && !(user as any).isLocal) {
        setIsSyncing(true);
        seedInitialSchedulesToFirestore(user.uid, INITIAL_SCHEDULE)
          .then(() => setIsSyncing(false))
          .catch((err) => {
            setIsSyncing(false);
            console.error('Failed to seed initial schedules:', err);
          });
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Login failed:', err);
      alert('Gagal masuk dengan Google. Pastikan koneksi internet stabil.');
    }
  };

  const handleLogout = async () => {
    try {
      removeLocalUser();
      await logoutUser();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const isModified = useMemo(() => {
    return JSON.stringify(items) !== JSON.stringify(INITIAL_SCHEDULE);
  }, [items]);

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col antialiased">
      {/* Top Navigation & Action Bar */}
      <Header
        items={items}
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        onResetDefault={handleResetDefault}
        isModified={isModified}
        onOpenAlarmSettings={() => setIsAlarmSettingsOpen(true)}
        onOpenGoogleCalendar={() => setIsCalendarModalOpen(true)}
        alarmEnabled={alarmSettings.enabled}
        notificationPermission={notificationPermission}
        user={user}
        onLogin={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-5 flex-1">
        {/* Current Active Activity Banner */}
        {currentActiveItem && (
          <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-md shadow-emerald-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden border border-emerald-500/30">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] uppercase tracking-wider font-bold bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-emerald-100 flex items-center gap-1.5 border border-white/15">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                    Sedang Berlangsung
                  </span>
                  <span className="text-xs text-emerald-100 font-medium">
                    Hari {currentActiveItem.hari} • {wibTime.timeString} WIB
                  </span>
                </div>
                <h2 className="text-base sm:text-xl font-black mt-1 text-white tracking-tight">
                  {currentActiveItem.kegiatan}
                </h2>
                {currentActiveItem.keterangan && (
                  <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5 max-w-2xl leading-relaxed">
                    {currentActiveItem.keterangan}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center font-mono text-xs font-bold bg-black/25 px-3.5 py-2 rounded-xl border border-white/15 shrink-0 shadow-inner">
              <span>{currentActiveItem.jam}</span>
            </div>
          </div>
        )}

        {/* Recovery Alert if items are fewer than full 49 items */}
        {items.length < 49 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm shadow-xs print:hidden">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>
                Jadwal saat ini memuat <strong>{items.length}</strong> kegiatan. Tersedia <strong>49 kegiatan mingguan</strong> lengkap (Senin–Minggu).
              </span>
            </div>
            <button
              type="button"
              id="btn-restore-full-schedule-banner"
              onClick={handleResetDefault}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl transition shadow-xs self-start sm:self-auto shrink-0 cursor-pointer"
            >
              Pulihkan Semua 49 Jadwal
            </button>
          </div>
        )}

        {/* Schedule Summary Stats */}
        <ScheduleStats items={items} />

        {/* Filter Bar & View Mode Toggle */}
        <FilterControls
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          countsByDay={countsByDay}
          totalCount={items.length}
        />

        {/* Views: Table, Cards, or Matrix */}
        {viewMode === 'table' && (
          <ScheduleTable
            items={filteredItems}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsModalOpen(true);
            }}
            onDeleteItem={handleDeleteItem}
            searchQuery={searchQuery}
            selectedDay={selectedDay}
            onResetFilters={handleResetFilters}
            onRestoreDefault={handleResetDefault}
          />
        )}

        {viewMode === 'cards' && (
          <CardsView
            items={filteredItems}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsModalOpen(true);
            }}
            onDeleteItem={handleDeleteItem}
            selectedDay={selectedDay}
            onResetFilters={handleResetFilters}
            onRestoreDefault={handleResetDefault}
          />
        )}

        {viewMode === 'matrix' && (
          <ScheduleMatrix
            items={items}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 print:hidden mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Jadwal Mingguan • Dilengkapi Sinkronisasi Cloud Firebase, Ekspor Excel (.xlsx), CSV, dan Salin ke Google Sheets / Excel
          </p>
          <div className="flex items-center gap-3">
            <span>Senin – Minggu</span>
            <span>•</span>
            <span>Zona Waktu: WIB (UTC+7)</span>
            <span>•</span>
            <span className="font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">Versi 2.2</span>
          </div>
        </div>
      </footer>

      {/* Edit / Add Modal */}
      <EditModal
        isOpen={isModalOpen}
        item={editingItem}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />

      {/* Alarm Ringing Overlay Modal */}
      <AlarmModal
        item={activeAlarmItem}
        onStop={stopActiveAlarm}
        onSnooze={() => snoozeAlarm(5)}
      />

      {/* Alarm Settings Modal */}
      <AlarmSettingsModal
        isOpen={isAlarmSettingsOpen}
        onClose={() => setIsAlarmSettingsOpen(false)}
        settings={alarmSettings}
        onUpdateSettings={(newPartial) => setAlarmSettings((prev) => ({ ...prev, ...newPartial }))}
        permission={notificationPermission}
        onRequestPermission={requestPermission}
        onTestAlarm={testAlarm}
        onTestDelayedAlarm={testDelayedAlarm}
        isTestRinging={isTestRinging}
        onStopTest={stopActiveAlarm}
        items={items}
        isKeepAliveOn={isKeepAliveOn}
      />

      {/* Google Calendar Integration Modal */}
      <GoogleCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        items={items}
        user={user}
        onLogin={handleGoogleLogin}
      />

      {/* Cloud & Email/Password Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* PWA Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
