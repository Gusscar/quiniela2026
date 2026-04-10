'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { getMatches } from '@/lib/matches';
import { getPredictions } from '@/lib/predictions';
import { getRankings } from '@/lib/rankings';
import { calculatePoints } from '@/lib/scoring';

export default function ProfilePage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  const { data: matches } = useQuery({
    queryKey: ['matches'],
    queryFn: getMatches,
  });

  const { data: predictions } = useQuery({
    queryKey: ['predictions', user?.id],
    queryFn: () => getPredictions(user!.id),
    enabled: !!user,
  });

  const { data: rankings } = useQuery({
    queryKey: ['rankings'],
    queryFn: getRankings,
  });

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Compute stats from finished matches
  const matchesById = new Map((matches ?? []).map((m) => [m.id, m]));
  let totalPoints = 0;
  let exactCount = 0;
  let winnerCount = 0;
  let zeroCount = 0;
  let resolvedPredictions = 0;

  for (const pred of predictions ?? []) {
    const match = matchesById.get(pred.match_id);
    if (!match || match.status !== 'finished') continue;
    const pts = calculatePoints(
      pred.goalsA,
      pred.goalsB,
      match.scorea ?? undefined,
      match.scoreb ?? undefined,
    );
    resolvedPredictions++;
    totalPoints += pts;
    if (pts === 3) exactCount++;
    else if (pts === 1) winnerCount++;
    else zeroCount++;
  }

  const totalPredictions = predictions?.length ?? 0;
  const totalMatches = matches?.length ?? 72;
  const position = rankings?.find((r) => r.user_id === user.id)?.position ?? null;
  const totalPlayers = rankings?.length ?? 0;
  const username =
    rankings?.find((r) => r.user_id === user.id)?.username ??
    user.user_metadata?.username ??
    user.email?.split('@')[0] ??
    'Jugador';

  const initial = username.charAt(0).toUpperCase();
  const accuracy = resolvedPredictions > 0
    ? Math.round(((exactCount + winnerCount) / resolvedPredictions) * 100)
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shrink-0">
          {initial}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{username}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Main stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Ranking position */}
        <div className="bg-card border border-border rounded-2xl px-5 py-4 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Posición</span>
          <div className="flex items-end gap-1.5">
            <span className="text-3xl font-bold text-primary tabular-nums">
              {position != null ? `#${position}` : '—'}
            </span>
            {totalPlayers > 0 && (
              <span className="text-sm text-muted-foreground mb-0.5">de {totalPlayers}</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">en el ranking global</span>
        </div>

        {/* Total points */}
        <div className="bg-card border border-border rounded-2xl px-5 py-4 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Puntos</span>
          <span className="text-3xl font-bold tabular-nums">{totalPoints}</span>
          <span className="text-xs text-muted-foreground">pts acumulados</span>
        </div>

        {/* Exact score */}
        <div className="bg-card border border-border rounded-2xl px-5 py-4 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">🎯 Marcador exacto</span>
          <span className="text-3xl font-bold tabular-nums text-green-400">{exactCount}</span>
          <span className="text-xs text-muted-foreground">3 pts cada uno</span>
        </div>

        {/* Correct winner */}
        <div className="bg-card border border-border rounded-2xl px-5 py-4 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">✅ Ganador correcto</span>
          <span className="text-3xl font-bold tabular-nums text-blue-400">{winnerCount}</span>
          <span className="text-xs text-muted-foreground">1 pt cada uno</span>
        </div>
      </div>

      {/* Predictions progress */}
      <div className="bg-card border border-border rounded-2xl px-5 py-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Predicciones enviadas</span>
          <span className="text-sm font-bold tabular-nums">{totalPredictions}/{totalMatches}</span>
        </div>
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${totalMatches > 0 ? Math.round((totalPredictions / totalMatches) * 100) : 0}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {totalMatches - totalPredictions > 0
            ? `${totalMatches - totalPredictions} partidos aún sin predecir`
            : '🏆 ¡Completaste todas las predicciones!'}
        </p>
      </div>

      {/* Accuracy row */}
      {resolvedPredictions > 0 && (
        <div className="bg-card border border-border rounded-2xl px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Rendimiento en partidos finalizados</span>
            <span className="text-sm font-bold">{resolvedPredictions} evaluados</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 text-center bg-green-500/10 border border-green-500/20 rounded-xl py-2.5">
              <p className="text-xl font-bold text-green-400">{exactCount}</p>
              <p className="text-xs text-muted-foreground">Exactos</p>
            </div>
            <div className="flex-1 text-center bg-blue-500/10 border border-blue-500/20 rounded-xl py-2.5">
              <p className="text-xl font-bold text-blue-400">{winnerCount}</p>
              <p className="text-xs text-muted-foreground">Ganador</p>
            </div>
            <div className="flex-1 text-center bg-secondary border border-border rounded-xl py-2.5">
              <p className="text-xl font-bold text-muted-foreground">{zeroCount}</p>
              <p className="text-xs text-muted-foreground">Fallados</p>
            </div>
            {accuracy !== null && (
              <div className="flex-1 text-center bg-primary/10 border border-primary/20 rounded-xl py-2.5">
                <p className="text-xl font-bold text-primary">{accuracy}%</p>
                <p className="text-xs text-muted-foreground">Acierto</p>
              </div>
            )}
          </div>
        </div>
      )}

      {resolvedPredictions === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Aún no hay partidos finalizados con tus predicciones. ¡Vuelve cuando arranque el Mundial!
        </div>
      )}
    </div>
  );
}
