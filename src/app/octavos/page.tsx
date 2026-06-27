'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTeams, groupTeamsByGroup } from '@/lib/teams';
import { getMatches } from '@/lib/matches';
import { Group, Team, Match } from '@/types';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';

const ALL_GROUPS: Group[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

interface TeamStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  position: number;
}

function computeGroupStandings(group: Group, teams: Team[], matches: Match[]): TeamStanding[] {
  const groupMatches = matches.filter(
    (m) => m.group_letter === group && m.status === 'finished'
  );

  const standings: TeamStanding[] = teams.map((team) => {
    const teamMatches = groupMatches.filter(
      (m) => m.teama_id === team.id || m.teamb_id === team.id
    );
    let won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;

    teamMatches.forEach((m) => {
      const isHome = m.teama_id === team.id;
      const myGoals = isHome ? (m.scorea ?? 0) : (m.scoreb ?? 0);
      const oppGoals = isHome ? (m.scoreb ?? 0) : (m.scorea ?? 0);
      gf += myGoals;
      ga += oppGoals;
      if (myGoals > oppGoals) won++;
      else if (myGoals === oppGoals) drawn++;
      else lost++;
    });

    return {
      team,
      played: teamMatches.length,
      won,
      drawn,
      lost,
      goalsFor: gf,
      goalsAgainst: ga,
      points: won * 3 + drawn,
      position: 0,
    };
  });

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    return b.goalsFor - a.goalsFor;
  });

  standings.forEach((s, i) => { s.position = i + 1; });
  return standings;
}

interface GroupResult {
  group: Group;
  complete: boolean;
  standings: TeamStanding[];
}

function computeAllGroups(
  teams: Team[],
  matches: Match[],
  groupedTeams: Record<Group, Team[]>
): GroupResult[] {
  return ALL_GROUPS.map((group) => {
    const gTeams = groupedTeams[group] || [];
    const finishedCount = matches.filter(
      (m) => m.group_letter === group && m.status === 'finished'
    ).length;
    const complete = gTeams.length > 0 && finishedCount >= 6;
    const standings = gTeams.length > 0
      ? computeGroupStandings(group, gTeams, matches)
      : [];
    return { group, complete, standings };
  });
}

function QualifiedCard({ standing, label }: { standing: TeamStanding; label: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
      {standing.team.flag_url ? (
        <img src={standing.team.flag_url} alt={standing.team.name} className="w-9 h-9 object-contain shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center font-bold text-sm shrink-0">
          {standing.team.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{standing.team.name}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-center">
        <div>
          <p className="text-sm font-bold text-primary">{standing.points}</p>
          <p className="text-[10px] text-muted-foreground">Pts</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{standing.goalsFor}-{standing.goalsAgainst}</p>
          <p className="text-[10px] text-muted-foreground">GF-GC</p>
        </div>
      </div>
    </div>
  );
}

function PlaceholderCard({ label }: { label: string }) {
  return (
    <div className="bg-card/40 rounded-xl border border-dashed border-border/60 p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-muted/40 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm text-muted-foreground/60 italic">{label}</p>
    </div>
  );
}

export default function OctavosPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [preRegistered, setPreRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState('');

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

  const { data: preRegData } = useQuery({
    queryKey: ['preregistration', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch('/api/preregistration?round=r16');
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
    staleTime: 60000,
  });

  useEffect(() => {
    if (preRegData?.registered) setPreRegistered(true);
  }, [preRegData]);

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

  const groupResults: GroupResult[] = groupedTeams && !loadingTeams
    ? computeAllGroups(teams!, matches, groupedTeams)
    : ALL_GROUPS.map((g) => ({ group: g, complete: false, standings: [] }));

  const allGroupsComplete = groupResults.every((gr) => gr.complete);

  // All third-place teams from completed groups, for best-8 calculation
  const allThirds = groupResults
    .filter((gr) => gr.complete && gr.standings.length >= 3)
    .map((gr) => ({ group: gr.group, standing: gr.standings[2] }));

  allThirds.sort((a, b) => {
    if (b.standing.points !== a.standing.points) return b.standing.points - a.standing.points;
    const gdA = a.standing.goalsFor - a.standing.goalsAgainst;
    const gdB = b.standing.goalsFor - b.standing.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    return b.standing.goalsFor - a.standing.goalsFor;
  });

  const best8Thirds = allGroupsComplete ? allThirds.slice(0, 8) : [];

  // Count confirmed
  const confirmedTop2Count = groupResults.filter((gr) => gr.complete).length * 2;
  const confirmedTotal = confirmedTop2Count + best8Thirds.length;

  const handlePreRegister = async () => {
    setRegistering(true);
    setRegError('');
    try {
      const res = await fetch('/api/preregistration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: 'r16' }),
      });
      if (!res.ok) {
        const data = await res.json();
        setRegError(data.error || 'Error al registrar');
        return;
      }
      setPreRegistered(true);
      queryClient.invalidateQueries({ queryKey: ['preregistration'] });
    } catch {
      setRegError('Error de conexion. Intenta de nuevo.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">Dieciseisavos de Final</h1>
          <span className="text-xs font-medium bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-2 py-0.5 rounded-full">
            Proximo
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {confirmedTotal > 0
            ? `${confirmedTotal} de 32 clasificados confirmados.`
            : 'Los clasificados se iran confirmando al finalizar cada grupo.'
          }
        </p>
      </div>

      {/* Pre-registration card */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base mb-0.5">Quiniela Dieciseisavos 2026</h2>
            <p className="text-sm text-muted-foreground mb-3">
              {preRegistered
                ? 'Ya estas registrado. Te avisaremos cuando la quiniela este habilitada.'
                : 'Registrate ahora para participar en la quiniela de los Dieciseisavos de Final.'}
            </p>

            {/* Monto e info */}
            {!preRegistered && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-primary">$10.000</span>
                  <span className="text-xs text-muted-foreground">pesos · cuota de participacion</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-start gap-1.5">
                    <svg className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mismas reglas de puntuacion que la fase de grupos
                  </div>
                  <div className="flex items-start gap-1.5">
                    <svg className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Predices el marcador exacto de los 16 partidos
                  </div>
                  <div className="flex items-start gap-1.5">
                    <svg className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    El pago se confirma para habilitar tu acceso
                  </div>
                </div>
              </div>
            )}

            {preRegistered ? (
              <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Pre-registro confirmado · Pendiente de pago
              </div>
            ) : (
              <>
                {regError && <p className="text-destructive text-xs mb-2">{regError}</p>}
                <button
                  onClick={handlePreRegister}
                  disabled={registering}
                  className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition text-sm disabled:opacity-50"
                >
                  {registering ? 'Registrando...' : 'Quiero participar'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Groups: top 2 per group */}
      {loadingTeams ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
              <div className="w-9 h-9 skeleton rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="w-32 h-3.5 skeleton rounded" />
                <div className="w-20 h-3 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              Clasificados por grupo (24 cupos)
            </h2>
            <div className="space-y-6">
              {groupResults.map((gr) => (
                <div key={gr.group}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-secondary text-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                      {gr.group}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">Grupo {gr.group}</span>
                    {gr.complete && (
                      <span className="text-[10px] font-medium bg-green-500/15 text-green-500 border border-green-500/25 px-1.5 py-0.5 rounded-full ml-auto">
                        Finalizado
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {gr.complete && gr.standings.length >= 2 ? (
                      <>
                        <QualifiedCard
                          standing={gr.standings[0]}
                          label={`Grupo ${gr.group} · 1°`}
                        />
                        <QualifiedCard
                          standing={gr.standings[1]}
                          label={`Grupo ${gr.group} · 2°`}
                        />
                      </>
                    ) : (
                      <>
                        <PlaceholderCard label="1° del grupo · Por definir" />
                        <PlaceholderCard label="2° del grupo · Por definir" />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Best 8 thirds */}
          <section className="mb-8">
            <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
              Mejores terceros (8 cupos)
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Los 8 mejores terceros entre los 12 grupos tambien clasifican.
            </p>
            {allGroupsComplete ? (
              <div className="space-y-2">
                {best8Thirds.map(({ group, standing }) => (
                  <QualifiedCard
                    key={standing.team.id}
                    standing={standing}
                    label={`Grupo ${group} · 3° clasificado`}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <PlaceholderCard key={i} label="3° clasificado · Se define al terminar todos los grupos" />
                ))}
              </div>
            )}
          </section>

          {/* Info footer */}
          <div className="bg-secondary/30 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground text-sm mb-1">Formato Dieciseisavos 2026</p>
            <p>• Top 2 de cada uno de los 12 grupos = 24 equipos</p>
            <p>• Los 8 mejores terceros entre todos los grupos = 8 equipos</p>
            <p>• Total: 32 equipos clasificados en 16 partidos</p>
          </div>
        </>
      )}
    </div>
  );
}
