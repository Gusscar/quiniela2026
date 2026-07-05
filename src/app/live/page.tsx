'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

const KNOCKOUT_ROUNDS: Record<string, string> = {
  R: 'Octavos de Final',
  Q: 'Cuartos de Final',
  S: 'Semifinal',
  T: 'Tercer Lugar',
  N: 'Final',
};

interface TeamInfo { name: string; flag_url: string | null }
interface UserPred {
  user_id: string;
  username: string;
  goalsA: number | null;
  goalsB: number | null;
  advancing_team: 'A' | 'B' | null;
}
interface LiveMatch {
  id: string;
  status: string;
  datetime: string;
  scorea: number | null;
  scoreb: number | null;
  advancing_team: 'A' | 'B' | null;
  group_letter: string | null;
  teamA: TeamInfo | null;
  teamB: TeamInfo | null;
  predictions: UserPred[];
}

function Flag({ url, name }: { url: string | null; name: string }) {
  if (!url) return <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs">{name[0]}</span>;
  return <img src={url} alt={name} className="w-6 h-6 object-contain rounded-sm shrink-0" />;
}

function MatchBlock({ match, myId }: { match: LiveMatch; myId: string }) {
  const isLive = match.status === 'live';
  const isKnockout = match.group_letter && KNOCKOUT_ROUNDS[match.group_letter];
  const roundLabel = isKnockout ? KNOCKOUT_ROUNDS[match.group_letter!] : `Grupo ${match.group_letter}`;

  const total = match.predictions.length;
  const withPred = match.predictions.filter(p => p.goalsA !== null).length;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Match header */}
      <div className={`px-4 py-3 border-b border-border ${isLive ? 'bg-red-500/10' : 'bg-secondary/40'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">{roundLabel}</span>
          {isLive ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              En vivo
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {new Date(match.datetime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="font-semibold text-sm truncate">{match.teamA?.name ?? '?'}</span>
            <Flag url={match.teamA?.flag_url ?? null} name={match.teamA?.name ?? '?'} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {match.scorea !== null && match.scoreb !== null ? (
              <span className={`text-2xl font-black tabular-nums px-3 py-1 rounded-xl ${isLive ? 'bg-red-500/20 text-red-300' : 'bg-secondary'}`}>
                {match.scorea} – {match.scoreb}
              </span>
            ) : (
              <span className="text-2xl font-black text-muted-foreground/40 px-3">vs</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-1 justify-start">
            <Flag url={match.teamB?.flag_url ?? null} name={match.teamB?.name ?? '?'} />
            <span className="font-semibold text-sm truncate">{match.teamB?.name ?? '?'}</span>
          </div>
        </div>
        {match.advancing_team && (
          <p className="text-center text-xs text-muted-foreground mt-2">
            Avanza: <span className="font-semibold text-foreground">
              {match.advancing_team === 'A' ? match.teamA?.name : match.teamB?.name}
            </span>
          </p>
        )}
      </div>

      {/* Predictions list */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between py-2 border-b border-border mb-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Predicciones
          </span>
          <span className="text-xs text-muted-foreground">{withPred}/{total} jugadores</span>
        </div>

        {match.predictions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nadie ha predicho este partido aún.</p>
        ) : (
          <div className="divide-y divide-border">
            {match.predictions.map((pred) => {
              const hasPred = pred.goalsA !== null && pred.goalsB !== null;
              const isDraw = hasPred && pred.goalsA === pred.goalsB;
              const advancingName = pred.advancing_team === 'A'
                ? match.teamA?.name
                : pred.advancing_team === 'B'
                ? match.teamB?.name
                : null;
              const isMe = pred.user_id === myId;

              return (
                <div
                  key={pred.user_id}
                  className={`flex items-center justify-between py-2.5 ${isMe ? 'bg-primary/5 -mx-4 px-4' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      {pred.username.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-sm truncate ${isMe ? 'font-semibold' : 'font-medium'}`}>
                      {pred.username}{isMe ? ' (yo)' : ''}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0 ml-3">
                    {hasPred ? (
                      <>
                        <span className="text-sm font-bold tabular-nums">
                          {pred.goalsA} – {pred.goalsB}
                        </span>
                        {isDraw && advancingName && (
                          <span className="text-[10px] text-muted-foreground leading-none">
                            avanza: <span className="font-semibold text-foreground">{advancingName}</span>
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground/40 italic">sin predicción</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LivePage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [fetching, setFetching] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/live');
      if (!res.ok) return;
      const json = await res.json();
      setMatches(json.matches ?? []);
      setLastUpdated(new Date());
    } catch {
      // silent
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">En Vivo</h1>
        {lastUpdated && (
          <span className="text-xs text-muted-foreground">
            Actualizado {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-6">Predicciones de todos los jugadores para el partido actual</p>

      {fetching ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 skeleton rounded-2xl" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl block mb-4">⏳</span>
          <p className="font-semibold text-lg mb-1">Sin partido activo</p>
          <p className="text-sm text-muted-foreground">Cuando empiece un partido aparecerán las predicciones aquí.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {matches.map((match) => (
            <MatchBlock key={match.id} match={match} myId={user.id} />
          ))}
        </div>
      )}
    </div>
  );
}
