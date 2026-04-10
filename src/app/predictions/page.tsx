'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { getMatches, groupMatchesByGroup } from '@/lib/matches';
import { getPredictions } from '@/lib/predictions';
import { PredictionInput } from '@/components/prediction-input';
import { MatchCard, MatchCardSkeleton } from '@/components/match-card';
import { Group, Match, Prediction } from '@/types';
import { useRouter } from 'next/navigation';

const groups: Group[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const emptyGroups: Record<Group, Match[]> = {
  A: [], B: [], C: [], D: [], E: [], F: [], G: [], H: [],
  I: [], J: [], K: [], L: [],
};

export default function PredictionsPage() {
  const { user, loading } = useAuthStore();
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
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const predictionsMap = new Map<string, Prediction>();
  predictions?.forEach((p) => predictionsMap.set(p.match_id, p));

  const groupedMatches = matches ? groupMatchesByGroup(matches) : emptyGroups;
  const currentGroupMatches = groupedMatches[selectedGroup];

  const totalMatches = matches?.length ?? 72;
  const totalPredicted = predictions?.length ?? 0;
  const pct = totalMatches > 0 ? Math.round((totalPredicted / totalMatches) * 100) : 0;
  const isComplete = totalPredicted >= totalMatches;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Mis Predicciones</h1>

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
        {groups.map((group) => (
          <button
            key={group}
            onClick={() => setSelectedGroup(group)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              selectedGroup === group
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-muted'
            }`}
          >
            Grupo {group}
          </button>
        ))}
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
