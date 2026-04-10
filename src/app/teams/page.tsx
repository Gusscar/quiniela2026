'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTeams, groupTeamsByGroup } from '@/lib/teams';
import { getMatches } from '@/lib/matches';
import { Group, Team, Match } from '@/types';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';

const groups: Group[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

interface TeamStats {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  matches: Match[];
}

function computeStats(teamId: string, matches: Match[]): TeamStats {
  const teamMatches = matches.filter(
    (m) => m.teama_id === teamId || m.teamb_id === teamId
  );

  let won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;
  const played = teamMatches.filter((m) => m.status === 'finished').length;

  teamMatches.forEach((m) => {
    if (m.status !== 'finished') return;
    const isHome = m.teama_id === teamId;
    const myGoals = isHome ? (m.scorea ?? 0) : (m.scoreb ?? 0);
    const oppGoals = isHome ? (m.scoreb ?? 0) : (m.scorea ?? 0);
    gf += myGoals;
    ga += oppGoals;
    if (myGoals > oppGoals) won++;
    else if (myGoals === oppGoals) drawn++;
    else lost++;
  });

  return {
    played,
    won,
    drawn,
    lost,
    goalsFor: gf,
    goalsAgainst: ga,
    points: won * 3 + drawn,
    matches: teamMatches,
  };
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function TeamCard({ team, matches }: { team: Team; matches: Match[] }) {
  const [expanded, setExpanded] = useState(false);
  const stats = computeStats(team.id, matches);
  const upcoming = stats.matches.filter((m) => m.status !== 'finished').slice(0, 3);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition text-left"
      >
        {team.flag_url ? (
          <img src={team.flag_url} alt={team.name} className="w-10 h-10 object-contain shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold shrink-0">
            {team.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{team.name}</p>
          <p className="text-xs text-muted-foreground">Grupo {team.group_letter}</p>
        </div>
        {/* Mini stats */}
        <div className="flex items-center gap-3 shrink-0 mr-2">
          <div className="text-center">
            <p className="text-sm font-bold text-primary">{stats.points}</p>
            <p className="text-xs text-muted-foreground">Pts</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold">{stats.played}</p>
            <p className="text-xs text-muted-foreground">PJ</p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded stats */}
      {expanded && (
        <div className="border-t border-border">
          {/* Stats row */}
          <div className="grid grid-cols-5 gap-2 px-4 py-4 bg-secondary/20">
            <StatBadge label="PJ" value={stats.played} color="text-foreground" />
            <StatBadge label="G" value={stats.won} color="text-green-500" />
            <StatBadge label="E" value={stats.drawn} color="text-yellow-500" />
            <StatBadge label="P" value={stats.lost} color="text-destructive" />
            <StatBadge label="Pts" value={stats.points} color="text-primary" />
          </div>

          {/* Attack / Defense */}
          <div className="grid grid-cols-2 gap-px bg-border">
            <div className="bg-card px-4 py-3 text-center">
              <p className="text-2xl font-bold text-green-500">{stats.goalsFor}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Goles a favor</p>
            </div>
            <div className="bg-card px-4 py-3 text-center">
              <p className="text-2xl font-bold text-destructive">{stats.goalsAgainst}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Goles en contra</p>
            </div>
          </div>

          {/* Upcoming matches */}
          {upcoming.length > 0 && (
            <div className="px-4 py-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Próximos partidos
              </p>
              <div className="space-y-2">
                {upcoming.map((m) => {
                  const isHome = m.teama_id === team.id;
                  const opponent = isHome ? m.teamB : m.teamA;
                  const date = new Date(m.datetime).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  });
                  return (
                    <div key={m.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground text-xs">{date}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">{isHome ? 'vs' : 'en'}</span>
                        {opponent?.flag_url && (
                          <img src={opponent.flag_url} alt="" className="w-4 h-4 object-contain" />
                        )}
                        <span className="font-medium">{opponent?.name ?? 'Por definir'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {stats.played === 0 && (
            <div className="px-4 py-3 border-t border-border text-center text-xs text-muted-foreground">
              Las estadísticas se actualizarán cuando inicie el torneo
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TeamCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
      <div className="w-10 h-10 skeleton rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-28 h-4 skeleton rounded" />
        <div className="w-16 h-3 skeleton rounded" />
      </div>
    </div>
  );
}

export default function TeamsPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  const { data: teams, isLoading: loadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
    staleTime: 60000,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['matches'],
    queryFn: getMatches,
    staleTime: 60000,
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

  const groupedTeams = teams ? groupTeamsByGroup(teams) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Equipos</h1>

      {loadingTeams ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <TeamCardSkeleton key={i} />)}
        </div>
      ) : !teams || teams.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay equipos disponibles</div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => {
            const groupTeams = groupedTeams?.[group] || [];
            if (groupTeams.length === 0) return null;
            return (
              <section key={group}>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-sm">
                    {group}
                  </span>
                  Grupo {group}
                </h2>
                <div className="space-y-2">
                  {groupTeams.map((team) => (
                    <TeamCard key={team.id} team={team} matches={matches} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
