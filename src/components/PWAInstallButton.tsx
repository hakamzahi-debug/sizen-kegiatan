import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, Share2, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        id="btn-pwa-install"
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition shadow-2xs hover:border-emerald-400"
        title="Pasang aplikasi ke Layar Utama HP agar mudah dibuka seperti aplikasi bawaan"
      >
        <Smartphone className="w-4 h-4 text-emerald-700" />
        <span>Pasang di HP</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          id="btn-pwa-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition shadow-2xs hover:border-slate-400"
          title="Petunjuk pasang aplikasi di iPhone / iPad"
        >
          <Smartphone className="w-4 h-4 text-slate-600" />
          <span>Pasang di iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold">Pasang di iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-600">
                <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl">
                  <div className="p-1.5 bg-white border border-slate-200 rounded-md text-blue-600 mt-0.5">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Langkah 1:</span>
                    <p className="mt-0.5">Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah browser Safari.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl">
                  <div className="p-1.5 bg-white border border-slate-200 rounded-md text-emerald-600 mt-0.5">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Langkah 2:</span>
                    <p className="mt-0.5">Gulir ke bawah lalu pilih menu <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Generic fallback install prompt on modern browsers
  return (
    <button
      type="button"
      id="btn-pwa-install-generic"
      onClick={() => {
        alert('Untuk memasang aplikasi ini di layar utama HP:\n\n1. Buka menu browser (ikon titik tiga ⋮ di pojok kanan atas)\n2. Pilih "Tambahkan ke Layar Utama" / "Install App".');
      }}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition shadow-2xs hover:border-slate-400"
      title="Pasang aplikasi di layar utama HP"
    >
      <Download className="w-4 h-4 text-slate-600" />
      <span className="hidden sm:inline">Pasang App</span>
    </button>
  );
};
