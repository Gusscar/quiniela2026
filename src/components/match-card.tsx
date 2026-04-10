'use client';

import { useState, useEffect } from 'react';
import { Match } from '@/types';

interface MatchCardProps {
  match: Match;
  children?: React.ReactNode;
}

function useCountdown(datetime: string) {
  const [diff, setDiff] = useState(() => new Date(datetime).getTime() - Date.now());

  useEffect(() => {
    const tick = () => setDiff(new Date(datetime).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 60_000); // update every minute
    return () => clearInterval(id);
  }, [datetime]);

  return diff;
}

function Countdown({ datetime }: { datetime: string }) {
  const diff = useCountdown(datetime);

  if (diff <= 0) return null;

  const totalMinutes = Math.floor(diff / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  let label: string;
  if (days >= 1) {
    label = `Faltan ${days}d ${hours}h`;
  } else if (hours >= 1) {
    label = `Faltan ${hours}h ${minutes}m`;
  } else {
    label = `Faltan ${minutes}m`;
  }

  // Urgency color
  let cls: string;
  if (diff > 7 * 86400_000) {
    cls = 'text-muted-foreground';
  } else if (diff > 3 * 86400_000) {
    cls = 'text-blue-400';
  } else if (diff > 86400_000) {
    cls = 'text-amber-400 font-semibold';
  } else if (diff > 6 * 3600_000) {
    cls = 'text-orange-400 font-semibold';
  } else {
    cls = 'text-red-400 font-bold animate-pulse';
  }

  return (
    <span className={`text-xs ${cls}`}>
      ⏱ {label}
    </span>
  );
}

export function MatchCard({ match, children }: MatchCardProps) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    pending:   { label: 'Pendiente', className: 'bg-muted text-muted-foreground' },
    scheduled: { label: 'Pendiente', className: 'bg-muted text-muted-foreground' },
    live:      { label: '🔴 En vivo', className: 'bg-destructive/10 text-destructive font-semibold' },
    finished:  { label: 'Finalizado', className: 'bg-muted text-muted-foreground' },
  };

  const status = statusConfig[match.status] ?? { label: match.status, className: 'bg-muted text-muted-foreground' };
  const isFinishedOrLive = match.status === 'finished' || match.status === 'live';
  const isPending = match.status === 'pending' || match.status === 'scheduled';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/40 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
          Grupo {match.group_letter}
        </span>
        <span className="text-xs text-muted-foreground">{formatDate(match.datetime)}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>
          {status.label}
        </span>
      </div>

      {/* Countdown bar — only for upcoming matches */}
      {isPending && (
        <div className="flex items-center justify-center px-4 py-1.5 bg-secondary/20 border-b border-border/50">
          <Countdown datetime={match.datetime} />
        </div>
      )}

      {/* Teams */}
      <div className="flex items-center justify-between px-4 py-5 gap-3">

        {/* Team A */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          {match.teamA?.flag_url ? (
            <img src={match.teamA.flag_url} alt={match.teamA.name} className="w-10 h-10 object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
              {match.teamA?.name?.slice(0, 2).toUpperCase() ?? 'A'}
            </div>
          )}
          <span className="text-sm font-semibold text-center leading-tight line-clamp-2">
            {match.teamA?.name ?? 'Equipo A'}
          </span>
        </div>

        {/* Center */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          {isFinishedOrLive ? (
            <span className="text-2xl font-bold tabular-nums bg-secondary px-4 py-1 rounded-xl">
              {match.scorea ?? 0} - {match.scoreb ?? 0}
            </span>
          ) : (
            <span className="text-xl font-bold text-muted-foreground">VS</span>
          )}
        </div>

        {/* Team B */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          {match.teamB?.flag_url ? (
            <img src={match.teamB.flag_url} alt={match.teamB.name} className="w-10 h-10 object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
              {match.teamB?.name?.slice(0, 2).toUpperCase() ?? 'B'}
            </div>
          )}
          <span className="text-sm font-semibold text-center leading-tight line-clamp-2">
            {match.teamB?.name ?? 'Equipo B'}
          </span>
        </div>
      </div>

      {/* Prediction zone */}
      {children && (
        <div className="border-t border-border bg-secondary/20 px-4 py-3">
          <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">
            Tu predicción
          </p>
          {children}
        </div>
      )}
    </div>
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/40 border-b border-border">
        <div className="w-16 h-3 skeleton rounded" />
        <div className="w-24 h-3 skeleton rounded" />
        <div className="w-16 h-3 skeleton rounded" />
      </div>
      <div className="flex items-center justify-between px-4 py-5 gap-3">
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-10 h-10 skeleton rounded-full" />
          <div className="w-20 h-4 skeleton rounded" />
        </div>
        <div className="w-12 h-8 skeleton rounded-xl" />
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-10 h-10 skeleton rounded-full" />
          <div className="w-20 h-4 skeleton rounded" />
        </div>
      </div>
      <div className="border-t border-border bg-secondary/20 px-4 py-3">
        <div className="w-full h-10 skeleton rounded-xl" />
      </div>
    </div>
  );
}
