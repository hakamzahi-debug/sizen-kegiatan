import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Daftarkan Service Worker untuk PWA, caching offline, dan notifikasi
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('Versi baru jadwal tersedia.');
      },
      onOfflineReady() {
        console.log('Aplikasi siap digunakan dalam mode offline.');
      },
    });
  } catch (err) {
    console.warn('PWA Service Worker registration skipped in dev:', err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
