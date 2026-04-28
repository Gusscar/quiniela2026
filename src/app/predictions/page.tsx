'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { getMatches, groupMatchesByGroup } from '@/lib/matches';
import { getPredictions } from '@/lib/predictions';
import { PredictionInput } from '@/components/prediction-input';
import { MatchCard, MatchCardSkeleton } from '@/components/match-card';
import { Group, Match, Prediction } from '@/types';
import { useRouter } from 'next/navigation';

const groups: Group[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const DEADLINE = new Date('2026-06-11T00:00:00');

function useCountdown(target: Date) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return null;
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs };
}

const emptyGroups: Record<Group, Match[]> = {
  A: [], B: [], C: [], D: [], E: [], F: [], G: [], H: [],
  I: [], J: [], K: [], L: [],
};

export default function PredictionsPage() {
  const { user, loading, isAdmin } = useAuthStore();
  const [selectedGroup, setSelectedGroup] = useState<Group>('A');
  const router = useRouter();

  const { data: matches, isLoading: loadingMatches, error: matchesError } = useQuery({
    queryKey: ['matches'],
    queryFn: getMatches,
  });

  const { data: predictions, isLoading: loadingPredictions, refetch: refetchPredictions } = useQuery({
    queryKey: ['predictions', user?.id],
    queryFn: () => getPredictions(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && isAdmin) router.push('/admin');
  }, [user, loading, isAdmin, router]);

  const countdown = useCountdown(DEADLINE);

  const predictionsMap = useMemo(() => {
    const map = new Map<string, Prediction>();
    predictions?.forEach((p) => map.set(p.match_id, p));
    return map;
  }, [predictions]);

  const groupedMatches = matches ? groupMatchesByGroup(matches) : emptyGroups;
  const currentGroupMatches = groupedMatches[selectedGroup];

  const groupStats = useMemo(() => {
    const stats = {} as Record<Group, { predicted: number; total: number }>;
    for (const g of groups) {
      const ms = groupedMatches[g];
      stats[g] = { total: ms.length, predicted: ms.filter(m => predictionsMap.has(m.id)).length };
    }
    return stats;
  }, [groupedMatches, predictionsMap]);

  if (loading || !user || isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const totalMatches = matches?.length ?? 72;
  const totalPredicted = predictions?.length ?? 0;
  const pct = totalMatches > 0 ? Math.round((totalPredicted / totalMatches) * 100) : 0;
  const isComplete = totalPredicted >= totalMatches;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Mis Predicciones</h1>

      {/* Countdown to deadline */}
      {countdown && (
        <div className="mb-4 bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⏰</span>
            <span className="text-sm font-medium">Cierre de pronósticos</span>
          </div>
          <div className="flex items-center gap-1 tabular-nums text-sm font-bold">
            {countdown.days > 0 && (
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg">{countdown.days}d</span>
            )}
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg">{String(countdown.hours).padStart(2, '0')}h</span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg">{String(countdown.mins).padStart(2, '0')}m</span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg">{String(countdown.secs).padStart(2, '0')}s</span>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {!loadingPredictions && !loadingMatches && (
        <div className="mb-6 bg-card border border-border rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {isComplete ? '🏆 ¡Todas completadas!' : '⚽ Progreso de predicciones'}
            </span>
            <span className={`text-sm font-bold tabular-nums ${isComplete ? 'text-primary' : 'text-foreground'}`}>
              {totalPredicted}/{totalMatches}
            </span>
          </div>
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isComplete ? 'bg-primary' : 'bg-primary/70'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {isComplete
              ? 'Listos para el Mundial 🎉'
              : `${totalMatches - totalPredicted} partidos sin predecir — ¡no pierdas puntos!`}
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {groups.map((group) => {
          const stats = groupStats[group];
          const done = stats.total > 0 && stats.predicted === stats.total;
          return (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition flex flex-col items-center gap-0.5 ${
                selectedGroup === group
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-muted'
              }`}
            >
              <span>Grupo {group}</span>
              {!loadingPredictions && !loadingMatches && stats.total > 0 && (
                <span className={`text-[10px] font-normal leading-none ${
                  selectedGroup === group
                    ? 'text-primary-foreground/70'
                    : done ? 'text-green-500' : 'text-muted-foreground'
                }`}>
                  {stats.predicted}/{stats.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {matchesError ? (
          <div className="text-center py-12 text-destructive">
            Error cargando partidos: {(matchesError as Error).message}
          </div>
        ) : loadingMatches || loadingPredictions ? (
          <>
            {[...Array(6)].map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </>
        ) : currentGroupMatches.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay partidos en este grupo
          </div>
        ) : (
          currentGroupMatches.map((match: Match) => (
            <MatchCard key={match.id} match={match}>
              <PredictionInput
                match={match}
                prediction={predictionsMap.get(match.id)}
                userId={user.id}
                onSave={refetchPredictions}
              />
            </MatchCard>
          ))
        )}
      </div>
    </div>
  );
}
