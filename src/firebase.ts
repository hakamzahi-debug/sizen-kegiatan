import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  query,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut,
  User 
} from 'firebase/auth';
import defaultFirebaseConfig from '../firebase-applet-config.json';
import { ScheduleItem } from './types';

// Workspace Scopes for Google Calendar
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

// In-memory access token cache (NEVER stored in localStorage or sessionStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Konfigurasi resmi proyek JadwalKu milik Anda (langsung disematkan agar permanen saat build ke GitHub/APK)
const resolvedFirebaseConfig = {
  apiKey: "AIzaSyBtqFYBsVmqmafeN_h0FN5fQvVoSwKwwWM",
  authDomain: "jadwalku-d40c2.firebaseapp.com",
  projectId: "jadwalku-d40c2",
  storageBucket: "jadwalku-d40c2.firebasestorage.app",
  messagingSenderId: "296421851413",
  appId: "1:296421851413:web:24972c1b92a5c25f9ba91c",
  measurementId: "G-CYYMQL2FQ0",
  ...defaultFirebaseConfig
};

// Inisialisasi Firebase App menggunakan config resmi jadwalku-d40c2
export const app = initializeApp(resolvedFirebaseConfig);

// Firestore Database instance (menggunakan default database)
const customDatabaseId = (resolvedFirebaseConfig as Record<string, any>).firestoreDatabaseId;
export const db = (customDatabaseId && customDatabaseId.trim() !== '' && customDatabaseId !== '(default)')
  ? getFirestore(app, customDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Attach Google Calendar scopes to provider
GOOGLE_CALENDAR_SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Clear token on auth state change
auth.onAuthStateChanged((user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

// Getter and setter for in-memory token
export function getCalendarAccessToken(): string | null {
  return cachedAccessToken;
}

export function setCalendarAccessToken(token: string | null) {
  cachedAccessToken = token;
}

// Connection testing as mandated by skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore status: Client appears offline or connection pending.");
    }
  }
}
testConnection();

// Error Handling Infrastructure
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Authentication Helpers
export async function syncUserProfile(user: User): Promise<void> {
  const userDocPath = `users/${user.uid}`;
  try {
    await setDoc(doc(db, 'users', user.uid), {
      userId: user.uid,
      displayName: user.displayName || 'Pengguna',
      email: user.email || '',
      photoURL: user.photoURL || '',
      createdAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Peringatan: Gagal menyinkronkan profil ke Firestore (periksa Firestore Rules):", err);
  }
}

export async function loginWithGoogle(): Promise<{ user: User | null; accessToken: string | null }> {
  try {
    isSigningIn = true;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      if (token) {
        cachedAccessToken = token;
      }
      const user = result.user;
      await syncUserProfile(user);
      return { user, accessToken: cachedAccessToken };
    } catch (popupErr: any) {
      const code = popupErr?.code || '';
      const msg = String(popupErr?.message || '').toLowerCase();
      // If popup was blocked or unsupported in current environment, fallback to redirect
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        msg.includes('popup') ||
        msg.includes('unsupported')
      ) {
        console.warn("Popup blocked or not supported, switching to signInWithRedirect...");
        await signInWithRedirect(auth, googleProvider);
        return { user: null, accessToken: null };
      }
      throw popupErr;
    }
  } catch (error) {
    console.error("Gagal login dengan Google:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

export async function checkAuthRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
      }
      await syncUserProfile(result.user);
      return result.user;
    }
  } catch (err) {
    console.error("Gagal memproses hasil redirect Google Auth:", err);
  }
  return null;
}


export async function loginWithEmail(email: string, password: string): Promise<User> {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = result.user;
    
    // Ensure profile document exists without blocking login
    try {
      await setDoc(doc(db, 'users', user.uid), {
        userId: user.uid,
        displayName: user.displayName || email.split('@')[0] || 'Pengguna',
        email: user.email || email.trim(),
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn("Peringatan: Gagal update profil pengguna ke Firestore:", err);
    }

    return user;
  } catch (error) {
    console.error("Gagal login dengan email:", error);
    throw error;
  }
}

export async function registerWithEmail(email: string, password: string, displayName?: string): Promise<User> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = result.user;

    const finalDisplayName = displayName?.trim() || email.split('@')[0] || 'Pengguna';
    try {
      await updateProfile(user, { displayName: finalDisplayName });
    } catch (e) {
      console.warn("Gagal memperbarui display name:", e);
    }

    // Ensure profile document exists without blocking registration
    try {
      await setDoc(doc(db, 'users', user.uid), {
        userId: user.uid,
        displayName: finalDisplayName,
        email: user.email || email.trim(),
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn("Peringatan: Gagal menyimpan profil pengguna ke Firestore (cek Rules Firestore):", err);
    }

    return user;
  } catch (error) {
    console.error("Gagal mendaftar dengan email:", error);
    throw error;
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    console.error("Gagal mengirim email reset sandi:", error);
    throw error;
  }
}

/**
 * Ensures a valid in-memory access token is available for Google Calendar API.
 * If user is not signed in or token is not yet in memory, prompts user sign-in popup.
 */
export async function requestCalendarToken(): Promise<string> {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  const result = await loginWithGoogle();
  if (result.accessToken) {
    return result.accessToken;
  }
  throw new Error('Izin Google Calendar belum diberikan. Silakan coba masuk kembali.');
}

export async function logoutUser(): Promise<void> {
  cachedAccessToken = null;
  await firebaseSignOut(auth);
}

// Firestore Schedule Operations
export function subscribeToUserSchedules(
  userId: string, 
  onUpdate: (items: ScheduleItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const collectionPath = `users/${userId}/schedules`;
  const q = query(collection(db, 'users', userId, 'schedules'));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const items: ScheduleItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: data.id || docSnap.id,
          hari: data.hari,
          jam: data.jam,
          startHour: data.startHour,
          startMinute: data.startMinute,
          endHour: data.endHour,
          endMinute: data.endMinute,
          kegiatan: data.kegiatan,
          keterangan: data.keterangan || '',
          kategori: data.kategori,
        });
      });
      onUpdate(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    }
  );
}

function formatSchedulePayload(userId: string, item: ScheduleItem): Record<string, any> {
  let startHour = item.startHour !== undefined ? Math.round(Number(item.startHour)) : undefined;
  let startMinute = item.startMinute !== undefined ? Math.round(Number(item.startMinute)) : undefined;
  let endHour = item.endHour !== undefined ? Math.round(Number(item.endHour)) : undefined;
  let endMinute = item.endMinute !== undefined ? Math.round(Number(item.endMinute)) : undefined;

  // Clamp startHour to 0-23
  if (startHour !== undefined) {
    startHour = Math.max(0, Math.min(23, startHour));
  }
  // Clamp startMinute to 0-59
  if (startMinute !== undefined) {
    startMinute = Math.max(0, Math.min(59, startMinute));
  }
  // Clamp endHour: if 24 or greater, normalize to 23:59 (standard 24-hr clock boundary)
  if (endHour !== undefined) {
    if (endHour >= 24) {
      endHour = 23;
      endMinute = 59;
    } else {
      endHour = Math.max(0, Math.min(23, endHour));
    }
  }
  if (endMinute !== undefined) {
    endMinute = Math.max(0, Math.min(59, endMinute));
  }

  const payload: Record<string, any> = {
    id: item.id,
    userId,
    hari: item.hari,
    jam: item.jam,
    kegiatan: item.kegiatan,
    kategori: item.kategori,
    updatedAt: new Date().toISOString()
  };

  if (startHour !== undefined) payload.startHour = startHour;
  if (startMinute !== undefined) payload.startMinute = startMinute;
  if (endHour !== undefined) payload.endHour = endHour;
  if (endMinute !== undefined) payload.endMinute = endMinute;
  if (item.keterangan !== undefined && item.keterangan !== null) payload.keterangan = String(item.keterangan);

  return payload;
}

export async function saveScheduleToFirestore(userId: string, item: ScheduleItem): Promise<void> {
  const docPath = `users/${userId}/schedules/${item.id}`;
  try {
    const payload = formatSchedulePayload(userId, item);
    await setDoc(doc(db, 'users', userId, 'schedules', item.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteScheduleFromFirestore(userId: string, itemId: string): Promise<void> {
  const docPath = `users/${userId}/schedules/${itemId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'schedules', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function seedInitialSchedulesToFirestore(userId: string, items: ScheduleItem[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const item of items) {
      const payload = formatSchedulePayload(userId, item);
      const docRef = doc(db, 'users', userId, 'schedules', item.id);
      batch.set(docRef, payload, { merge: true });
    }
    await batch.commit();
  } catch (error) {
    console.error('Batch seed failed, falling back to sequential writes:', error);
    for (const item of items) {
      try {
        await saveScheduleToFirestore(userId, item);
      } catch (err) {
        console.warn('Failed to seed item:', item.id, err);
      }
    }
  }
}
