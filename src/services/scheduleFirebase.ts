import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { ScheduleItem } from '../types';

const COLLECTION_NAME = 'jadwal_mingguan';

/**
 * Menyimpan atau memperbarui 1 agenda kegiatan ke Cloud Firestore
 */
export async function syncItemToFirestore(item: ScheduleItem) {
  try {
    const docRef = doc(db, COLLECTION_NAME, item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (error) {
    console.error('Gagal menyimpan ke Firestore:', error);
  }
}

/**
 * Menghapus 1 agenda kegiatan dari Cloud Firestore
 */
export async function deleteItemFromFirestore(itemId: string) {
  try {
    const docRef = doc(db, COLLECTION_NAME, itemId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Gagal menghapus dari Firestore:', error);
  }
}

/**
 * Menyimpan seluruh jadwal awal ke Cloud Firestore (Batch setup)
 */
export async function seedInitialScheduleToFirestore(items: ScheduleItem[]) {
  try {
    for (const item of items) {
      const docRef = doc(db, COLLECTION_NAME, item.id);
      await setDoc(docRef, item, { merge: true });
    }
  } catch (error) {
    console.error('Gagal melakukan seed ke Firestore:', error);
  }
}

/**
 * Berlangganan (Real-time listener) ke Cloud Firestore
 */
export function subscribeToSchedule(callback: (items: ScheduleItem[]) => void) {
  const q = query(collection(db, COLLECTION_NAME));
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const items: ScheduleItem[] = snapshot.docs.map((docSnap) => ({
        ...docSnap.data(),
        id: docSnap.id,
      } as ScheduleItem));
      callback(items);
    }
  }, (err) => {
    console.warn('Firestore subscription info:', err.message);
  });
}
