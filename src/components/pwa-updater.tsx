'use client';

import { useEffect, useState, useRef } from 'react';

const PULL_THRESHOLD = 75; // px needed to trigger refresh

export function PWAUpdater() {
  const [updateReady, setUpdateReady] = useState(false);
  const [pullY, setPullY] = useState(0);
  const isPulling = useRef(false);
  const startY = useRef(0);

  // Listen for SW_UPDATED message from service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'SW_UPDATED') setUpdateReady(true);
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  // Pull-to-refresh touch gesture
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!isPulling.current) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) setPullY(Math.min(delta, PULL_THRESHOLD * 1.3));
    };

    const onEnd = () => {
      if (pullY >= PULL_THRESHOLD) window.location.reload();
      isPulling.current = false;
      setPullY(0);
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [pullY]);

  const progress = Math.min(pullY / PULL_THRESHOLD, 1);
  const ready = progress >= 1;

  return (
    <>
      {/* Pull-to-refresh indicator */}
      {pullY > 8 && (
        <div
          className="fixed left-1/2 z-50 flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-xl pointer-events-none transition-opacity"
          style={{
            top: `${70 + pullY * 0.3}px`,
            transform: 'translateX(-50%)',
            opacity: progress,
          }}
        >
          <svg
            className={`w-4 h-4 text-primary ${ready ? 'animate-spin' : ''}`}
            style={{ transform: ready ? undefined : `rotate(${progress * 270}deg)` }}
            fill="none" viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-90" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="text-xs font-medium text-foreground whitespace-nowrap">
            {ready ? 'Suelta para actualizar' : 'Desliza para actualizar'}
          </span>
        </div>
      )}

      {/* Update available banner */}
      {updateReady && (
        <div className="fixed top-20 left-0 right-0 z-50 flex justify-center px-4 slide-up">
          <div className="flex items-center gap-3 bg-primary text-primary-foreground rounded-2xl px-4 py-3 shadow-2xl">
            <span className="text-sm">🆕 Nueva versión disponible</span>
            <button
              onClick={() => window.location.reload()}
              className="bg-white/20 hover:bg-white/30 text-sm font-bold px-3 py-1 rounded-xl transition active:scale-95"
            >
              Actualizar
            </button>
            <button
              onClick={() => setUpdateReady(false)}
              className="text-white/70 hover:text-white transition"
              aria-label="Cerrar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
