'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const navLinks = [
  { href: '/predictions', label: 'Predicciones' },
  { href: '/rankings', label: 'Ranking' },
  { href: '/teams', label: 'Equipos' },
  { href: '/rules', label: 'Reglas' },
];

function ShieldIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { user, logout: logoutStore } = useAuthStore();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single();

      setIsAdmin(!!data);
    }

    checkAdmin();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    logoutStore();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          <Link href="/predictions" className="text-xl font-bold text-primary">
            Quiniela Mundial
          </Link>

          {user && (
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      pathname === link.href
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      pathname === '/admin'
                        ? 'bg-yellow-500 text-black'
                        : 'text-yellow-500 hover:text-yellow-400 hover:bg-secondary'
                    }`}
                    title="Panel de Admin"
                  >
                    <ShieldIcon />
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  title="Mi perfil"
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition shrink-0 ${
                    pathname === '/profile'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-muted text-foreground'
                  }`}
                >
                  {(user.user_metadata?.username ?? user.email ?? 'U').charAt(0).toUpperCase()}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm px-4 py-2 bg-secondary hover:bg-muted rounded-lg transition"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
