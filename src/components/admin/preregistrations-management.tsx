'use client';

import { useQuery } from '@tanstack/react-query';

interface PreRegistration {
  user_id: string;
  email: string;
  username: string | null;
  registered_at: string;
}

export function PreregistrationsManagement() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-preregistrations'],
    queryFn: async () => {
      const res = await fetch('/api/admin/preregistrations?round=r16');
      if (!res.ok) throw new Error('Error al cargar pre-registros');
      const json = await res.json();
      return json.data as PreRegistration[];
    },
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 skeleton rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-sm">
        Error al cargar los pre-registros.
      </div>
    );
  }

  const list = data || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Pre-registros · Dieciseisavos</h2>
          <p className="text-sm text-muted-foreground">
            Usuarios interesados en la proxima quiniela
          </p>
        </div>
        <div className="bg-primary/10 text-primary border border-primary/20 rounded-xl px-4 py-2 text-center">
          <p className="text-2xl font-bold leading-none">{list.length}</p>
          <p className="text-[11px] mt-0.5">registrados</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Aun no hay pre-registros.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Ronda</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Fecha registro</th>
              </tr>
            </thead>
            <tbody>
              {list.map((reg, idx) => {
                const display = reg.username ?? reg.email;
                const date = new Date(reg.registered_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <tr
                    key={reg.user_id}
                    className="border-b border-border last:border-0 hover:bg-secondary/20 transition"
                  >
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{display}</p>
                      {reg.username && (
                        <p className="text-xs text-muted-foreground">{reg.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs font-medium bg-yellow-500/15 text-yellow-500 border border-yellow-500/25 px-2 py-0.5 rounded-full">
                        Dieciseisavos
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                      {date}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
