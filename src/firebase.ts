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
  signOut as firebaseSignOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { ScheduleItem } from './types';

// Workspace Scopes for Google Calendar
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

// In-memory access token cache (NEVER stored in localStorage or sessionStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Inisialisasi Firebase App menggunakan config resmi dari cloud
export const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without databaseId
const databaseId = (firebaseConfig as Record<string, any>).firestoreDatabaseId || 'ai-studio-dailyproductivit-8d0e0927-84d8-4afe-aa74-5ee3452a451c';
export const db = getFirestore(app, databaseId);
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
export async function loginWithGoogle(): Promise<{ user: User; accessToken: string | null }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;
    if (token) {
      cachedAccessToken = token;
    }
    const user = result.user;
    
    // Save/update user profile in Firestore
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
      handleFirestoreError(err, OperationType.WRITE, userDocPath);
    }
    
    return { user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Gagal login dengan Google:", error);
    throw error;
  } finally {
    isSigningIn = false;
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
