import { AppUser } from '../types';

const LOCAL_USER_STORAGE_KEY = 'jadwalku_local_user_profile_v1';

export function getStoredLocalUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.uid && parsed.displayName) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse local user profile:', e);
  }
  return null;
}

export function saveLocalUser(displayName: string, email: string): AppUser {
  const cleanName = displayName.trim() || 'Pengguna JadwalKu';
  const cleanEmail = email.trim().toLowerCase() || `${cleanName.toLowerCase().replace(/\s+/g, '')}@jadwalku.app`;
  
  // Create deterministic or timestamped UID
  const existing = getStoredLocalUser();
  const uid = existing?.uid || `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const user: AppUser = {
    uid,
    displayName: cleanName,
    email: cleanEmail,
    photoURL: null,
    isLocal: true,
  };

  try {
    localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('jadwalku_local_user_changed', { detail: user }));
  } catch (e) {
    console.error('Failed to store local user:', e);
  }

  return user;
}

export function removeLocalUser(): void {
  try {
    localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('jadwalku_local_user_changed', { detail: null }));
  } catch (e) {
    console.error('Failed to remove local user:', e);
  }
}
