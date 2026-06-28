'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  is_admin: boolean | null;
  payment_status: 'paid' | 'pending' | null;
  created_at: string;
}

function ConfirmDeleteModal({ username, onConfirm, onCancel, loading }: { username: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Eliminar usuario</h3>
        <p className="text-muted-foreground text-sm mb-6">
          ¿Seguro que quieres eliminar a <span className="text-foreground font-medium">{username}</span>? Esta acción es irreversible y borrará todas sus predicciones.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-muted text-sm transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmPurgeModal({ count, onConfirm, onCancel, loading }: { count: number; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Eliminar usuarios pendientes</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Se eliminarán <span className="text-foreground font-medium">{count} usuario{count !== 1 ? 's' : ''}</span> con pago pendiente. Esta acción es irreversible y borrará todas sus predicciones.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-muted text-sm transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? 'Eliminando...' : 'Eliminar todos'}
          </button>
        </div>
      </div>
    </div>
  );
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
    trash: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
      </svg>
    ),
  };
  return icons[name] || null;
}

export function UsersManagement() {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; username: string } | null>(null);
  const [confirmPurge, setConfirmPurge] = useState(false);

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

      const adminIds = new Set(admins?.map((a) => a.id) ?? []);
      return profiles
        ?.filter((profile) => !adminIds.has(profile.id))
        .map((profile) => ({ ...profile, is_admin: false })) as (UserProfile & { is_admin: boolean })[];
    },
  });

  const togglePayment = useMutation({
    mutationFn: async ({ userId, currentStatus }: { userId: string; currentStatus: string | null }) => {
      const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
      const res = await fetch('/api/admin/toggle-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Error al actualizar');
      }
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(newStatus === 'paid' ? 'Marcado como pagado' : 'Marcado como pendiente');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar pago');
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

  const purgePending = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/purge-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Error al purgar');
      }
      return res.json() as Promise<{ deleted: number; errors: string[] }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`${data.deleted} usuario${data.deleted !== 1 ? 's' : ''} eliminado${data.deleted !== 1 ? 's' : ''}`);
      setConfirmPurge(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Error al purgar');
      setConfirmPurge(false);
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Error al eliminar');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuario eliminado');
      setConfirmDelete(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
      setConfirmDelete(null);
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

  const pendingCount = users?.filter((u) => u.payment_status !== 'paid' && !u.is_admin).length ?? 0;

  return (
    <>
      {confirmDelete && (
        <ConfirmDeleteModal
          username={confirmDelete.username}
          loading={deleteUser.isPending}
          onConfirm={() => deleteUser.mutate(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {confirmPurge && (
        <ConfirmPurgeModal
          count={pendingCount}
          loading={purgePending.isPending}
          onConfirm={() => purgePending.mutate()}
          onCancel={() => setConfirmPurge(false)}
        />
      )}

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Usuarios</h2>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <button
                onClick={() => setConfirmPurge(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-500 text-sm font-medium transition"
                title="Eliminar usuarios con pago pendiente"
              >
                <Icon name="trash" />
                Purgar pendientes ({pendingCount})
              </button>
            )}
            <button
              onClick={() => refetch()}
              className="p-2 hover:bg-secondary rounded-lg transition"
            >
              <Icon name="refresh" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b border-border">
                <th className="pb-3 font-medium">Usuario</th>
                <th className="pb-3 font-medium">ID</th>
                <th className="pb-3 font-medium">Fecha</th>
                <th className="pb-3 font-medium">Pago</th>
                <th className="pb-3 font-medium">Admin</th>
                <th className="pb-3 font-medium"></th>
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
                      onClick={() => togglePayment.mutate({ userId: user.id, currentStatus: user.payment_status })}
                      className={`px-2 py-1 rounded-full text-xs font-semibold transition ${
                        user.payment_status === 'paid'
                          ? 'bg-green-600/20 text-green-500 hover:bg-green-600/30'
                          : 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                      }`}
                      title="Cambiar estado de pago"
                    >
                      {user.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </button>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => toggleAdmin.mutate({ userId: user.id, isAdmin: user.is_admin ?? false })}
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
                  <td className="py-3">
                    <button
                      onClick={() => setConfirmDelete({ id: user.id, username: user.username || 'Sin nombre' })}
                      className="p-2 rounded-lg bg-secondary hover:bg-red-600/20 hover:text-red-500 transition"
                      title="Eliminar usuario"
                    >
                      <Icon name="trash" />
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
    </>
  );
}
