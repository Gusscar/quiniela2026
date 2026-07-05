'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

const STORAGE_KEY = 'prereg_octavos_modal_dismissed';
const ROUND = 'octavos';

export function PreregModal() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading || !user) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    fetch(`/api/preregistration?round=${ROUND}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.registered) {
          setRegistered(true);
          return;
        }
        setTimeout(() => setVisible(true), 1000);
      })
      .catch(() => setTimeout(() => setVisible(true), 1000));
  }, [user, loading]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const handleRegister = async () => {
    setRegistering(true);
    setError('');
    try {
      const res = await fetch('/api/preregistration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: ROUND }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al registrar');
        return;
      }
      setRegistered(true);
      setTimeout(() => {
        dismiss();
        router.push('/predictions');
      }, 1500);
    } catch {
      setError('Error de conexion. Intenta de nuevo.');
    } finally {
      setRegistering(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!registered ? dismiss : undefined} />

      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-yellow-400 to-primary" />

        <div className="p-6">
          {!registered && (
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {registered ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-black mb-1">¡Pre-registro confirmado!</h2>
              <p className="text-sm text-muted-foreground">Redirigiendo a predicciones...</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 bg-yellow-500/15 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>

              <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wider mb-1">
                Octavos de Final · Mañana comienza
              </p>
              <h2 className="text-xl font-black mb-2">¿Sigues jugando?</h2>
              <p className="text-sm text-muted-foreground mb-4">
                El primer partido de Octavos es mañana. Pre-registrate ahora — si no lo haces, <span className="font-semibold text-foreground">no participas en esta ronda</span>.
              </p>

              <div className="bg-secondary/50 rounded-xl px-4 py-3 flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-muted-foreground">Cuota de participacion</p>
                  <p className="text-2xl font-black text-primary">$10.000</p>
                </div>
                <div className="text-right text-xs text-muted-foreground space-y-0.5">
                  <p>8 partidos</p>
                  <p>Mismas reglas</p>
                </div>
              </div>

              {error && <p className="text-destructive text-xs mb-2">{error}</p>}

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 active:scale-95 transition text-sm disabled:opacity-50"
                >
                  {registering ? 'Registrando...' : 'Si, quiero participar'}
                </button>
                <button
                  onClick={dismiss}
                  className="w-full text-muted-foreground text-sm py-2 hover:text-foreground transition"
                >
                  No, paso esta ronda
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
