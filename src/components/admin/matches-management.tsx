'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getMatches } from '@/lib/matches';
import { toast } from 'sonner';
import { Match } from '@/types';

function Icon({ name, className = 'w-4 h-4' }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactElement> = {
    clock: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    live: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    check: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    save: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
      </svg>
    ),
  };
  return icons[name] || null;
}

const STATUS_OPTIONS = [
  { value: 'pending',  label: 'Pendiente', icon: 'clock',  cls: 'bg-muted hover:bg-muted/80' },
  { value: 'live',     label: 'En vivo',   icon: 'live',   cls: 'bg-destructive/20 text-destructive' },
  { value: 'finished', label: 'Finalizado',icon: 'check',  cls: 'bg-green-500/20 text-green-500' },
];

function MatchRow({ match }: { match: Match }) {
  const queryClient = useQueryClient();
  const [scoreA, setScoreA] = useState<string>(match.scorea?.toString() ?? '0');
  const [scoreB, setScoreB] = useState<string>(match.scoreb?.toString() ?? '0');

  const updateMatch = useMutation({
    mutationFn: async ({ status, scorea, scoreb }: { status: string; scorea?: number | null; scoreb?: number | null }) => {
      const { error } = await supabase
        .from('matches')
        .update({ status, scorea: scorea ?? null, scoreb: scoreb ?? null })
        .eq('id', match.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast.success('Partido actualizado');
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const handleStatusChange = (status: string) => {
    const needsScore = status === 'live' || status === 'finished';
    updateMatch.mutate({
      status,
      scorea: needsScore ? (parseInt(scoreA) || 0) : null,
      scoreb: needsScore ? (parseInt(scoreB) || 0) : null,
    });
  };

  const handleSaveScore = () => {
    updateMatch.mutate({
      status: match.status,
      scorea: parseInt(scoreA) || 0,
      scoreb: parseInt(scoreB) || 0,
    });
  };

  const date = new Date(match.datetime).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  const isActive = match.status === 'live' || match.status === 'finished';

  return (
    <div className={`bg-secondary rounded-xl p-4 space-y-3 ${updateMatch.isPending ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Teams + date */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">{date} · Grupo {match.group_letter}</span>
        <div className="flex items-center gap-2 font-medium text-sm">
          <span>{match.teamA?.name ?? '?'}</span>
          <span className="text-muted-foreground text-xs">vs</span>
          <span>{match.teamB?.name ?? '?'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status buttons */}
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              title={opt.label}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                match.status === opt.value
                  ? opt.cls
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <Icon name={opt.icon} className="w-3 h-3" />
              {opt.label}
            </button>
          ))}
        </div>

        {/* Score inputs — siempre visibles para editar */}
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="number"
            min="0"
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value)}
            disabled={!isActive}
            className="w-12 h-8 bg-card border border-border rounded-lg text-center text-sm font-bold disabled:opacity-40"
          />
          <span className="text-muted-foreground font-bold">-</span>
          <input
            type="number"
            min="0"
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value)}
            disabled={!isActive}
            className="w-12 h-8 bg-card border border-border rounded-lg text-center text-sm font-bold disabled:opacity-40"
          />
          {isActive && (
            <button
              onClick={handleSaveScore}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
              title="Guardar marcador"
            >
              <Icon name="save" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SyncButton({ onSynced }: { onSynced: () => void }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [result, setResult] = useState<string>('');

  const handleSync = async () => {
    setState('loading');
    try {
      const res = await fetch('/api/admin/sync-scores', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error desconocido');
      setResult(`${data.updated} partido(s) actualizado(s)`);
      setState('ok');
      onSynced();
      setTimeout(() => setState('idle'), 4000);
    } catch (err: any) {
      setResult(err.message);
      setState('error');
      setTimeout(() => setState('idle'), 5000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={state === 'loading'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
          state === 'ok' ? 'bg-green-600/20 text-green-400' :
          state === 'error' ? 'bg-destructive/20 text-destructive' :
          'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
        } disabled:opacity-50`}
        title="Sincronizar resultados desde football-data.org"
      >
        <svg className={`w-3.5 h-3.5 ${state === 'loading' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {state === 'loading' ? 'Sincronizando...' : 'Sincronizar'}
      </button>
      {result && (
        <span className={`text-xs ${state === 'error' ? 'text-destructive' : 'text-green-400'}`}>
          {result}
        </span>
      )}
    </div>
  );
}

export function MatchesManagement() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'live' | 'finished'>('all');
  const queryClient = useQueryClient();

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: getMatches,
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="h-6 w-40 skeleton rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
        </div>
      </div>
    );
  }

  const filtered = filter === 'all' ? matches : matches.filter((m) => m.status === filter);

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">Partidos ({matches.length})</h2>
          <SyncButton onSynced={() => queryClient.invalidateQueries({ queryKey: ['matches'] })} />
        </div>
        <div className="flex gap-1">
          {(['all', 'pending', 'live', 'finished'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-muted'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendiente' : f === 'live' ? 'En vivo' : 'Finalizado'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">No hay partidos</p>
        ) : (
          filtered.map((match) => <MatchRow key={match.id} match={match} />)
        )}
      </div>
    </div>
  );
}
