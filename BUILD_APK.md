# Panduan Menghasilkan File APK Android Asli (JadwalKu)

Proyek ini telah dikonfigurasi secara lengkap menggunakan **Capacitor 8** dan **Android Native Local Notifications (AlarmManager)**.

Dengan file APK asli ini, alarm dan getaran dijamin **100% berdering tepat waktu** bahkan saat:
- Layar HP mati / terkunci
- Aplikasi ditutup total (di-swipe kill dari Recent Apps)
- HP baru saja direboot / dinyalakan ulang

---

## Prasyarat
- Laptop / PC dengan [Android Studio](https://developer.android.com/studio) terpasang.
- Node.js versi 18 atau lebih baru.

---

## Langkah 1: Unduh / Ekspor Proyek
1. Di AI Studio, buka menu **Settings** (ikon gerigi di pojok) lalu pilih **Export to ZIP** atau **Export to GitHub**.
2. Ekstrak file ZIP di komputer Anda.

---

## Langkah 2: Build Web Assets & Sinkronkan
Buka terminal di folder proyek yang sudah diekstrak, lalu jalankan:

```bash
npm install
npm run cap:build
```

Perintah di atas akan mengompilasi kode React dan menyalinnya secara otomatis ke folder `android/app/src/main/assets/public`.

---

## Langkah 3: Buka di Android Studio & Buat APK
1. Buka aplikasi **Android Studio**.
2. Pilih **Open** (Buka Proyek) dan arahkan ke folder **`android`** yang ada di dalam proyek ini.
3. Tunggu proses Gradle Sync selesai (otomatis).
4. Klik menu atas: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
5. Setelah beberapa detik, Android Studio akan menampilkan notifikasi *APK(s) generated successfully*.
6. Klik tulisan **locate** untuk mengambil file `app-debug.apk`.

---

## Langkah 4: Pasang di HP Android Anda
1. Kirim file `app-debug.apk` ke HP Anda (via WhatsApp, Telegram, Google Drive, atau kabel data USB).
2. Ketuk file `app-debug.apk` di HP Anda untuk menginstal (aktifkan "Izinkan instalasi dari sumber tidak dikenal" jika diminta).
3. Buka aplikasi **JadwalKu**, masukkan jadwal Anda, dan izinkan notifikasi saat diminta.
4. Selesai! Kini alarm akan berdering menggunakan **Android AlarmManager asli** yang dibangunkan langsung oleh kernel sistem Android.
