// Service Web Audio API & Vibration API untuk Pengingat Alarm & Getar HP
let audioCtx: AudioContext | null = null;
let currentAlarmInterval: number | null = null;
let isRinging = false;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (err) {
    console.warn('Web Audio API not supported:', err);
    return null;
  }
}

/**
 * Memainkan nada harmonis chime tunggal (nada jernih dan bergetar halus)
 */
function playTone(freq: number, startTime: number, duration: number, volume: number = 0.8) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);

  // Envelope lembut dengan attack cepat dan decay alami
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume * 0.4, 0.01), startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

/**
 * Memainkan melodi bel/alarm 4 nada (C5 - E5 - G5 - C6)
 */
export function playChimeSequence(volume: number = 0.8) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    playTone(freq, now + idx * 0.18, 0.5, volume);
  });
}

/**
 * Memulai alarm berdering berulang sampai dihentikan pengguna
 */
export function startAlarmRinging(volume: number = 0.8, shouldVibrate: boolean = true) {
  stopAlarmRinging();
  isRinging = true;

  // Bunyi pertama langsung
  playChimeSequence(volume);
  if (shouldVibrate) {
    triggerVibration();
  }

  // Ulangi setiap 2.2 detik
  currentAlarmInterval = window.setInterval(() => {
    if (!isRinging) return;
    playChimeSequence(volume);
    if (shouldVibrate) {
      triggerVibration();
    }
  }, 2200);
}

/**
 * Menghentikan alarm berdering
 */
export function stopAlarmRinging() {
  isRinging = false;
  if (currentAlarmInterval !== null) {
    clearInterval(currentAlarmInterval);
    currentAlarmInterval = null;
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0); // Stop vibration
    } catch {
      // ignore
    }
  }
}

/**
 * Menggetarkan perangkat HP menggunakan Vibration API
 */
export function triggerVibration() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Pola: Getar 400ms, jeda 200ms, getar 400ms, jeda 200ms, getar 600ms
      navigator.vibrate([400, 200, 400, 200, 600]);
    } catch (e) {
      console.warn('Vibration API error:', e);
    }
  }
}

/**
 * Memeriksa apakah perangkat mendukung fitur getar
 */
export function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

// ==========================================
// BACKGROUND KEEP-ALIVE SERVICE (ANTI-SLEEP)
// Memungkinkan alarm berbunyi saat layar HP mati
// ==========================================

let silentAudioEl: HTMLAudioElement | null = null;
let keepAliveRunning = false;
let wakeLockSentinel: unknown = null;

/**
 * Membuat data URI audio hening (WAV 1 detik)
 */
function getSilentAudioBlobURL(): string {
  const sampleRate = 8000;
  const numSamples = sampleRate * 1;
  const buffer = new Uint8Array(44 + numSamples);
  
  // RIFF header
  buffer.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  const fileSize = 36 + numSamples;
  buffer[4] = fileSize & 0xff;
  buffer[5] = (fileSize >> 8) & 0xff;
  buffer[6] = (fileSize >> 16) & 0xff;
  buffer[7] = (fileSize >> 24) & 0xff;
  buffer.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"
  buffer.set([0x66, 0x6d, 0x74, 0x20], 12); // "fmt "
  buffer.set([16, 0, 0, 0], 16); // Subchunk1Size (16 for PCM)
  buffer.set([1, 0], 20); // AudioFormat (1 for PCM)
  buffer.set([1, 0], 22); // NumChannels (1 mono)
  buffer.set([sampleRate & 0xff, (sampleRate >> 8) & 0xff, 0, 0], 24); // SampleRate
  buffer.set([sampleRate & 0xff, (sampleRate >> 8) & 0xff, 0, 0], 28); // ByteRate
  buffer.set([1, 0], 32); // BlockAlign (1)
  buffer.set([8, 0], 34); // BitsPerSample (8)
  buffer.set([0x64, 0x61, 0x74, 0x61], 36); // "data"
  buffer[40] = numSamples & 0xff;
  buffer[41] = (numSamples >> 8) & 0xff;
  buffer[42] = (numSamples >> 16) & 0xff;
  buffer[43] = (numSamples >> 24) & 0xff;
  buffer.fill(128, 44); // PCM silence (value 128)

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/**
 * Memulai audio hening latar belakang agar browser / HP tidak menidurkan proses JavaScript saat layar mati
 */
export async function startBackgroundKeepAlive(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (keepAliveRunning && silentAudioEl && !silentAudioEl.paused) return true;

  try {
    if (!silentAudioEl) {
      silentAudioEl = new Audio(getSilentAudioBlobURL());
      silentAudioEl.loop = true;
      silentAudioEl.volume = 0.01; // nyaris hening
    }

    await silentAudioEl.play();
    keepAliveRunning = true;

    // Registrasikan MediaSession ke sistem Android
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Alarm Jadwal Aktif ⏰',
        artist: 'JadwalKu Siaga di Latar Belakang',
        album: 'Aplikasi Siaga Berdering Saat Layar Mati',
      });
      navigator.mediaSession.playbackState = 'playing';
    }

    // Coba minta WakeLock jika didukung
    if ('wakeLock' in navigator && !wakeLockSentinel) {
      try {
        wakeLockSentinel = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } }).wakeLock.request('screen');
      } catch {
        // Abaikan jika tidak didukung/ditolak
      }
    }

    return true;
  } catch (err) {
    console.warn('Gagal memulai Background Keep-Alive Audio:', err);
    return false;
  }
}

/**
 * Menghentikan audio latar belakang
 */
export function stopBackgroundKeepAlive() {
  if (silentAudioEl) {
    try {
      silentAudioEl.pause();
    } catch {
      // ignore
    }
  }
  keepAliveRunning = false;

  if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
    try {
      navigator.mediaSession.playbackState = 'none';
    } catch {
      // ignore
    }
  }

  if (wakeLockSentinel) {
    try {
      (wakeLockSentinel as { release: () => Promise<void> }).release();
    } catch {
      // ignore
    }
    wakeLockSentinel = null;
  }
}

export function isKeepAliveActive(): boolean {
  return keepAliveRunning;
}
