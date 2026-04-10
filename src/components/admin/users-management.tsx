'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  is_admin: boolean | null;
  created_at: string;
}

function Icon({ name, className = 'w-4 h-4' }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactElement> = {
    shield: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    shielnoff: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18" /><path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38" /><line x1="2" y1="2" x2="22" y2="22" />
      </svg>
    ),
    refresh: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      </svg>
    ),
  };
  return icons[name] || null;
}

export function UsersManagement() {
  const queryClient = useQueryClient();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: admins } = await supabase
        .from('admin_users')
        .select('id');

      return profiles?.map((profile) => ({
        ...profile,
        is_admin: admins?.some((a) => a.id === profile.id) || false,
      })) as (UserProfile & { is_admin: boolean })[];
    },
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      const res = await fetch('/api/admin/toggle-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, makeAdmin: !isAdmin }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Error al actualizar');
      }
    },
    onSuccess: (_, { isAdmin }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(isAdmin ? 'Admin removido' : 'Admin agregado');
    },
    onError: () => {
      toast.error('Error al actualizar');
    },
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="h-6 w-40 skeleton rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 skeleton rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Usuarios</h2>
        <button
          onClick={() => refetch()}
          className="p-2 hover:bg-secondary rounded-lg transition"
        >
          <Icon name="refresh" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-muted-foreground border-b border-border">
              <th className="pb-3 font-medium">Usuario</th>
              <th className="pb-3 font-medium">ID</th>
              <th className="pb-3 font-medium">Fecha</th>
              <th className="pb-3 font-medium">Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-secondary/50">
                <td className="py-3">
                  <span className="font-medium">
                    {user.username || 'Sin nombre'}
                  </span>
                </td>
                <td className="py-3 text-muted-foreground text-sm">
                  {user.id.slice(0, 8)}...
                </td>
                <td className="py-3 text-muted-foreground text-sm">
                  {new Date(user.created_at).toLocaleDateString('es-ES')}
                </td>
                <td className="py-3">
                  <button
                    onClick={() => toggleAdmin.mutate({ userId: user.id, isAdmin: user.is_admin })}
                    className={`p-2 rounded-lg transition ${
                      user.is_admin
                        ? 'bg-primary/20 text-primary hover:bg-primary/30'
                        : 'bg-secondary hover:bg-muted'
                    }`}
                    title={user.is_admin ? 'Remover admin' : 'Hacer admin'}
                  >
                    {user.is_admin ? (
                      <Icon name="shield" />
                    ) : (
                      <Icon name="shielnoff" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!users || users.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            No hay usuarios registrados
          </div>
        )}
      </div>
    </div>
  );
}
