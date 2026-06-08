'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        setError(error || 'Error al enviar el correo');
        return;
      }

      setSent(true);
    } catch {
      setError('Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0d3320_0%,_#080f1a_60%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-5xl float select-none">🔑</span>
          <h1 className="text-3xl font-black mt-2">
            <span className="gradient-text">Recuperar Contraseña</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Mundial 2026 · Quiniela</p>
        </div>

        <div className="bg-card/90 backdrop-blur rounded-2xl p-6 border border-border shadow-xl">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">📧</div>
              <div className="bg-primary/20 text-primary rounded-xl p-4 text-sm">
                Si el email está registrado, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam.
              </div>
              <Link href="/login" className="block text-center text-sm text-primary hover:underline font-medium mt-4">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-sm mb-4">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              {error && (
                <div className="bg-destructive/20 text-destructive rounded-xl p-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
                    placeholder="tu@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 active:scale-95 transition glow-green disabled:opacity-50 text-base"
                >
                  {loading ? '⏳ Enviando...' : '📧 Enviar enlace'}
                </button>
              </form>

              <p className="text-center mt-5 text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Volver al inicio de sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
