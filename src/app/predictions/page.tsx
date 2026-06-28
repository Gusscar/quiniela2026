'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { getMatches } from '@/lib/matches';
import { getPredictions } from '@/lib/predictions';
import { PredictionInput } from '@/components/prediction-input';
import { MatchCard, MatchCardSkeleton } from '@/components/match-card';
import { Match, Prediction } from '@/types';
import { useRouter } from 'next/navigation';

const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function useCountdown(target: Date | null) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    if (!target) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.getTime()]);
  if (!now || !target) return { time: null, isExpired: false };
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { time: null, isExpired: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { time: { days, hours, mins, secs }, isExpired: false };
}

export default function PredictionsPage() {
  const { user, loading, isAdmin } = useAuthStore();
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

  // Separate group stage from knockout matches
  const r16Matches = useMemo(() =>
    (matches ?? []).filter((m) => !m.group_letter || !GROUP_LETTERS.includes(m.group_letter))
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()),
    [matches]
  );

  // Cierre global: 30 min antes del primer partido R16
  const deadline = useMemo(() => {
    if (!r16Matches.length) return null;
    return new Date(new Date(r16Matches[0].datetime).getTime() - 30 * 60 * 1000);
  }, [r16Matches]);

  const { time: countdown, isExpired: quinielaClosed } = useCountdown(deadline);

  const predictionsMap = useMemo(() => {
    const map = new Map<string, Prediction>();
    predictions?.forEach((p) => map.set(p.match_id, p));
    return map;
  }, [predictions]);

  const totalPredicted = r16Matches.filter((m) => predictionsMap.has(m.id)).length;
  const totalMatches = r16Matches.length;
  const pct = totalMatches > 0 ? Math.round((totalPredicted / totalMatches) * 100) : 0;
  const isComplete = totalMatches > 0 && totalPredicted >= totalMatches;

  if (loading || !user || isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">Dieciseisavos de Final</h1>
          <span className="text-xs font-medium bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-2 py-0.5 rounded-full">
            Nueva ronda
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Predice los 16 partidos eliminatorios</p>
      </div>

      {/* Countdown */}
      {r16Matches.length > 0 && (
        quinielaClosed ? (
          <div className="mb-4 bg-destructive/10 border border-destructive/30 rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <span className="text-sm font-medium text-destructive">Los pronósticos están cerrados.</span>
          </div>
        ) : countdown ? (
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
        ) : null
      )}

      {/* Progress */}
      {r16Matches.length > 0 && !loadingPredictions && !loadingMatches && (
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
              ? '¡Listos para los Dieciseisavos! 🎉'
              : `${totalMatches - totalPredicted} partidos sin predecir`}
          </p>
        </div>
      )}

      {/* Matches list */}
      <div className="space-y-3">
        {matchesError ? (
          <div className="text-center py-12 text-destructive">
            Error cargando partidos: {(matchesError as Error).message}
          </div>
        ) : loadingMatches || loadingPredictions ? (
          [...Array(6)].map((_, i) => <MatchCardSkeleton key={i} />)
        ) : r16Matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-semibold text-lg mb-1">Proximamente</p>
            <p className="text-sm text-muted-foreground">
              Los partidos de Dieciseisavos se habilitarán en breve.
            </p>
          </div>
        ) : (
          r16Matches.map((match: Match) => (
            <MatchCard key={match.id} match={match}>
              <PredictionInput
                match={match}
                prediction={predictionsMap.get(match.id)}
                userId={user.id}
                onSave={refetchPredictions}
                quinielaClosed={quinielaClosed}
              />
            </MatchCard>
          ))
        )}
      </div>
    </div>
  );
}
