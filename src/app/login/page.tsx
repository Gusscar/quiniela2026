'use client';

import { Suspense, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { login } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const schema = yup.object({
  email: yup.string().email('Email inválido').required('Email requerido'),
  password: yup.string().required('Contraseña requerida'),
});

type FormData = yup.InferType<typeof schema>;

function LoginForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const confirm = searchParams.get('confirm');

  const { register: registerForm, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (registered) {
      setError('');
    }
  }, [registered]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');

    try {
      await login(data.email, data.password);
      router.push('/predictions');
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('email not confirmed')) {
        setError('Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
      } else if (err.message?.toLowerCase().includes('invalid login credentials')) {
        setError('Email o contraseña incorrectos.');
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-6">
        <span className="text-5xl float select-none">⚽</span>
        <h1 className="text-3xl font-black mt-2">
          <span className="gradient-text">Iniciar Sesión</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Mundial 2026 · Quiniela</p>
      </div>

      <div className="bg-card/90 backdrop-blur rounded-2xl p-6 border border-border shadow-xl">
        {registered && confirm && (
          <div className="bg-yellow-500/20 text-yellow-600 rounded-xl p-3 mb-4 text-sm">
            ¡Cuenta creada! Revisa tu email y confirma tu cuenta antes de iniciar sesión.
          </div>
        )}

        {registered && !confirm && (
          <div className="bg-primary/20 text-primary rounded-xl p-3 mb-4 text-sm">
            ¡Cuenta creada! Ahora puedes iniciar sesión.
          </div>
        )}

        {error && (
          <div className="bg-destructive/20 text-destructive rounded-xl p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              {...registerForm('email')}
              type="email"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
              placeholder="tu@email.com"
            />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                {...registerForm('password')}
                type={showPassword ? 'text' : 'password'}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 active:scale-95 transition glow-green disabled:opacity-50 text-base"
          >
            {loading ? '⏳ Iniciando sesión...' : '⚽ Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center mt-5 text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0d3320_0%,_#080f1a_60%)] pointer-events-none" />
      <Suspense fallback={<div className="relative z-10 w-full max-w-md bg-card/90 rounded-2xl p-6 border border-border animate-pulse h-96" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
