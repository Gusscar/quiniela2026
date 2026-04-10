'use client';

import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7;

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [iosDevice, setIosDevice] = useState(false);

  useEffect(() => {
    // Always register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Skip if already installed
    if (isInStandaloneMode()) return;

    // Skip if dismissed recently
    const ts = localStorage.getItem(DISMISSED_KEY);
    if (ts) {
      const daysSince = (Date.now() - Number(ts)) / 86_400_000;
      if (daysSince < DISMISS_DAYS) return;
    }

    const ios = isIOS();
    setIosDevice(ios);

    if (ios) {
      // iOS doesn't fire beforeinstallprompt — show manual guide after 4s
      const id = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(id);
    }

    // Android / Chrome desktop
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 slide-up">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md mx-auto overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <img src="/icon-192.png" alt="Quiniela" className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight">Quiniela Mundial 2026</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {iosDevice ? 'Añade la app a tu pantalla de inicio' : 'Instala la app para acceso rápido'}
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Cerrar"
            className="text-muted-foreground hover:text-foreground transition p-1 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* iOS instructions */}
        {iosDevice ? (
          <div className="px-4 pb-4 space-y-2">
            {[
              { n: 1, text: <>Toca el botón <strong>Compartir</strong> ⬆️ en Safari</> },
              { n: 2, text: <>Selecciona <strong>"Añadir a pantalla de inicio"</strong></> },
              { n: 3, text: <>Toca <strong>Añadir</strong> — ¡listo! ✅</> },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-center gap-2.5 text-sm">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {n}
                </span>
                <span className="text-muted-foreground">{text}</span>
              </div>
            ))}
            <button
              onClick={dismiss}
              className="w-full mt-1 py-2 text-xs text-muted-foreground hover:text-foreground transition"
            >
              Ya la tengo instalada
            </button>
          </div>
        ) : (
          /* Android / Chrome */
          <div className="flex items-center gap-2 px-4 pb-4">
            <button
              onClick={dismiss}
              className="flex-1 py-2 text-sm text-muted-foreground hover:text-foreground bg-secondary hover:bg-muted rounded-xl transition"
            >
              Ahora no
            </button>
            <button
              onClick={install}
              className="flex-1 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:opacity-90 active:scale-95 transition"
            >
              ⚽ Instalar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
