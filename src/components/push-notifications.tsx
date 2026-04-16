'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushNotifications() {
  const { user } = useAuthStore();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!VAPID_PUBLIC_KEY) return;

    setSupported(true);
    setPermission(Notification.permission);

    // Don't show if user dismissed
    const key = `push-dismissed-${user.id}`;
    if (localStorage.getItem(key)) setDismissed(true);
  }, [user]);

  const subscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });

      setPermission('granted');
    } catch {
      setPermission(Notification.permission);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => {
    if (!user) return;
    localStorage.setItem(`push-dismissed-${user.id}`, '1');
    setDismissed(true);
  };

  // Only show the prompt if: logged in, supported, not yet decided, not dismissed
  if (!user || !supported || permission !== 'default' || dismissed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-30 slide-up max-w-md mx-auto">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        <span className="text-2xl shrink-0 mt-0.5">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Notificaciones de partidos</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Entérate cuando arranque un partido o salga el resultado
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={dismiss}
              className="flex-1 py-1.5 text-xs text-muted-foreground bg-secondary hover:bg-muted rounded-lg transition"
            >
              Ahora no
            </button>
            <button
              onClick={subscribe}
              disabled={loading}
              className="flex-1 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 active:scale-95 transition disabled:opacity-50"
            >
              {loading ? 'Activando...' : 'Activar'}
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground transition p-1 shrink-0"
          aria-label="Cerrar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
