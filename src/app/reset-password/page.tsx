'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for error in URL hash (e.g. expired link)
    const hash = window.location.hash;
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const errorCode = params.get('error_code');
      if (errorCode === 'otp_expired' || params.get('error') === 'access_denied') {
        setLinkExpired(true);
        return;
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
        return;
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.push('/login?reset=true');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0d3320_0%,_#080f1a_60%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-5xl float select-none">🔐</span>
          <h1 className="text-3xl font-black mt-2">
            <span className="gradient-text">Nueva Contraseña</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Mundial 2026 · Quiniela</p>
        </div>

        <div className="bg-card/90 backdrop-blur rounded-2xl p-6 border border-border shadow-xl">
          {linkExpired ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">⏰</div>
              <div className="bg-destructive/20 text-destructive rounded-xl p-4 text-sm">
                El enlace expiró o ya fue usado. Solicita uno nuevo.
              </div>
              <Link
                href="/forgot-password"
                className="block w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition text-center text-sm"
              >
                Solicitar nuevo enlace
              </Link>
            </div>
          ) : !ready ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground text-sm">Verificando enlace...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-destructive/20 text-destructive rounded-xl p-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nueva contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirmar contraseña</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 active:scale-95 transition glow-green disabled:opacity-50 text-base"
                >
                  {loading ? '⏳ Guardando...' : '🔐 Guardar contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
