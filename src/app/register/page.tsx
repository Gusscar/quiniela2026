'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Celebration } from '@/components/celebration';

const schema = yup.object({
  email: yup.string().email('Email inválido').required('Email requerido'),
  username: yup.string().min(3, 'Mínimo 3 caracteres').max(20, 'Máximo 20 caracteres').required('Nombre de usuario requerido'),
  password: yup.string().min(8, 'Mínimo 8 caracteres').required('Contraseña requerida'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Las contraseñas deben coincidir')
    .required('Confirmar contraseña requerido'),
});

type FormData = yup.InferType<typeof schema>;

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const router = useRouter();

  const { register: registerForm, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password, username: data.username }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Error al registrar');
        return;
      }

      setCelebrating(true);
      setTimeout(() => router.push('/login?registered=true'), 2200);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <Celebration active={celebrating} />

      {/* BG */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0d3320_0%,_#080f1a_60%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-5xl float select-none">⚽</span>
          <h1 className="text-3xl font-black mt-2">
            <span className="gradient-text">Crea tu cuenta</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Mundial 2026 · Quiniela</p>
        </div>

        <div className="bg-card/90 backdrop-blur rounded-2xl p-6 border border-border shadow-xl">
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
              <label className="block text-sm font-medium mb-1.5">Nombre de usuario</label>
              <input
                {...registerForm('username')}
                type="text"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
                placeholder="tu_usuario"
              />
              {errors.username && <p className="text-destructive text-xs mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Contraseña</label>
              <input
                {...registerForm('password')}
                type="password"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Confirmar contraseña</label>
              <input
                {...registerForm('confirmPassword')}
                type="password"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || celebrating}
              className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 active:scale-95 transition glow-green disabled:opacity-50 text-base"
            >
              {loading ? '⏳ Creando cuenta...' : celebrating ? '🎉 ¡Bienvenido!' : '⚽ Crear Cuenta'}
            </button>
          </form>

          <p className="text-center mt-5 text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
