'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

const STORAGE_KEY = 'prereg_r16_modal_dismissed';

export function PreregModal() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [alreadyReg, setAlreadyReg] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    // Don't show if already dismissed
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Check if already pre-registered
    fetch('/api/preregistration?round=r16')
      .then((r) => r.json())
      .then((data) => {
        if (data.registered) {
          setAlreadyReg(true);
          return;
        }
        // Show modal after short delay
        setTimeout(() => setVisible(true), 1500);
      })
      .catch(() => {
        setTimeout(() => setVisible(true), 1500);
      });
  }, [user, loading]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const goToOctavos = () => {
    dismiss();
    router.push('/predictions');
  };

  if (!visible || alreadyReg) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-green-400 to-primary" />

        <div className="p-6">
          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icon */}
          <div className="w-14 h-14 bg-primary/15 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>

          {/* Content */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              Nueva quiniela disponible
            </p>
            <h2 className="text-xl font-black mb-2">
              Dieciseisavos de Final
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              La fase de grupos esta terminando. Pre-registrate ahora para participar en la proxima quiniela del Mundial 2026.
            </p>

            {/* Price highlight */}
            <div className="bg-secondary/50 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Cuota de participacion</p>
                <p className="text-2xl font-black text-primary">$10.000</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Mismas reglas</p>
                <p className="text-xs font-medium">que fase de grupos</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={goToOctavos}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition text-sm"
            >
              Ver y pre-registrarme
            </button>
            <button
              onClick={dismiss}
              className="w-full text-muted-foreground text-sm py-2 hover:text-foreground transition"
            >
              Recordar despues
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
