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
    <div className="w-full max-w-md bg-card rounded-xl p-8 border border-border">
      <h1 className="text-2xl font-bold text-center mb-6 text-primary">Iniciar Sesión</h1>

      {registered && confirm && (
        <div className="bg-yellow-500/20 text-yellow-600 rounded-lg p-3 mb-4">
          ¡Cuenta creada! Revisa tu email y confirma tu cuenta antes de iniciar sesión.
        </div>
      )}

      {registered && !confirm && (
        <div className="bg-primary/20 text-primary rounded-lg p-3 mb-4">
          ¡Cuenta creada! Ahora puedes iniciar sesión.
        </div>
      )}

      {error && (
        <div className="bg-destructive/20 text-destructive rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            {...registerForm('email')}
            type="email"
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="tu@email.com"
          />
          {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            {...registerForm('password')}
            type="password"
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="••••••••"
          />
          {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>

      <p className="text-center mt-6 text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div className="w-full max-w-md bg-card rounded-xl p-8 border border-border animate-pulse h-96" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
