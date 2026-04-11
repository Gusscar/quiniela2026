'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { getMatches, groupMatchesByGroup } from '@/lib/matches';
import { getPredictions } from '@/lib/predictions';
import { calculatePoints } from '@/lib/scoring';
import { supabase } from '@/lib/supabase';
import { Group, Match, Prediction } from '@/types';

const GROUPS: Group[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const emptyGroups: Record<Group, Match[]> = {
  A: [], B: [], C: [], D: [], E: [], F: [], G: [], H: [],
  I: [], J: [], K: [], L: [],
};

interface UserProfile { id: string; username: string }
interface FriendPred { match_id: string; goalsA: number | null; goalsB: number | null }

function PredBadge({ pred, match, label }: {
  pred: Prediction | FriendPred | undefined;
  match: Match;
  label: string;
}) {
  const finished = match.status === 'finished';
  const hasPred = pred && pred.goalsA !== null && pred.goalsB !== null;

  let pts: 0 | 1 | 2 | 3 = 0;
  let badgeColor = '';
  if (finished && hasPred) {
    pts = calculatePoints(pred!.goalsA, pred!.goalsB, match.scorea ?? undefined, match.scoreb ?? undefined);
    badgeColor = pts === 3 ? 'bg-green-500/15 border-green-500/40 text-green-300'
      : pts === 2 ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
      : pts === 1 ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
      : 'bg-red-500/10 border-red-500/20 text-red-400';
  }

  return (
    <div className={`flex-1 flex flex-col items-center gap-1 rounded-xl border px-3 py-2 ${
      hasPred
        ? finished ? badgeColor : 'bg-secondary/60 border-border'
        : 'bg-secondary/20 border-border/30'
    }`}>
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      {hasPred ? (
        <span className="text-lg font-bold tabular-nums leading-none">
          {pred!.goalsA} – {pred!.goalsB}
        </span>
      ) : (
        <span className="text-lg font-bold text-muted-foreground/40">–</span>
      )}
      {finished && hasPred && (
        <span className="text-[10px] font-semibold">
          {pts === 3 ? '⭐ 3 pts' : pts === 2 ? '✅ 2 pts' : pts === 1 ? '🤝 1 pt' : '❌ 0 pts'}
        </span>
      )}
    </div>
  );
}

export default function ComparePage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState<Group>('A');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [friendId, setFriendId] = useState<string>('');
  const [friendName, setFriendName] = useState<string>('');
  const [friendPreds, setFriendPreds] = useState<FriendPred[]>([]);
  const [loadingFriend, setLoadingFriend] = useState(false);
  const [search, setSearch] = useState('');

  const { data: matches } = useQuery({ queryKey: ['matches'], queryFn: getMatches });
  const { data: myPreds } = useQuery({
    queryKey: ['predictions', user?.id],
    queryFn: () => getPredictions(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // Load user profiles (excluding self)
  useEffect(() => {
    if (!user) return;
    supabase.from('user_profiles').select('id, username').then(({ data }) => {
      setUsers((data || []).filter((u: UserProfile) => u.id !== user.id));
    });
  }, [user]);

  // Load friend predictions when selected
  const selectFriend = async (profile: UserProfile) => {
    setFriendId(profile.id);
    setFriendName(profile.username);
    setLoadingFriend(true);
    try {
      const res = await fetch(`/api/compare/${profile.id}`);
      const data = await res.json();
      setFriendPreds(Array.isArray(data) ? data : []);
    } catch {
      setFriendPreds([]);
    } finally {
      setLoadingFriend(false);
    }
  };

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>;
  }

  const myPredsMap = new Map((myPreds ?? []).map((p) => [p.match_id, p]));
  const friendPredsMap = new Map(friendPreds.map((p) => [p.match_id, p]));
  const grouped = matches ? groupMatchesByGroup(matches) : emptyGroups;
  const currentMatches = grouped[selectedGroup];

  const myName = user.user_metadata?.username ?? user.email?.split('@')[0] ?? 'Yo';
  const filteredUsers = search
    ? users.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()))
    : users;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Comparar predicciones</h1>
      <p className="text-sm text-muted-foreground mb-6">Elige un jugador para ver sus predicciones junto a las tuyas</p>

      {/* Friend selector */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar jugador por nombre..."
          className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-3"
        />
        {filteredUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            {users.length === 0 ? 'No hay otros jugadores registrados aún' : 'No se encontró ese jugador'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => selectFriend(u)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition active:scale-95 ${
                  friendId === u.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary border-border hover:bg-muted'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                  {u.username.charAt(0).toUpperCase()}
                </span>
                {u.username}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      {friendId && (
        <div className="flex items-center justify-center gap-4 mb-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500/50"/>
            <span>Exacto (3 pts)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500/50"/>
            <span>Ganador (2 pts)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"/>
            <span>Empate (1 pt)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50"/>
            <span>Fallo (0 pts)</span>
          </div>
        </div>
      )}

      {/* Group tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGroup(g)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              selectedGroup === g ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-muted'
            }`}
          >
            Grupo {g}
          </button>
        ))}
      </div>

      {/* Match comparison cards */}
      {!friendId ? (
        <div className="text-center py-16 text-muted-foreground">
          <span className="text-4xl block mb-3">👆</span>
          Selecciona un jugador para comparar
        </div>
      ) : loadingFriend ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {currentMatches.map((match) => {
            const myPred = myPredsMap.get(match.id);
            const friendPred = friendPredsMap.get(match.id);
            const finished = match.status === 'finished';
            const live = match.status === 'live';

            return (
              <div key={match.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Match header */}
                <div className="flex items-center justify-between px-4 py-2 bg-secondary/40 border-b border-border">
                  <div className="flex items-center gap-2 min-w-0">
                    {match.teamA?.flag_url && (
                      <img src={match.teamA.flag_url} className="w-5 h-5 object-contain shrink-0" alt="" />
                    )}
                    <span className="text-xs font-semibold truncate">{match.teamA?.name ?? '?'}</span>
                    <span className="text-xs text-muted-foreground shrink-0">vs</span>
                    <span className="text-xs font-semibold truncate">{match.teamB?.name ?? '?'}</span>
                    {match.teamB?.flag_url && (
                      <img src={match.teamB.flag_url} className="w-5 h-5 object-contain shrink-0" alt="" />
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                    live ? 'bg-destructive/20 text-destructive font-semibold'
                    : finished ? 'bg-muted text-muted-foreground'
                    : 'bg-muted text-muted-foreground'
                  }`}>
                    {live ? '🔴 En vivo' : finished ? `${match.scorea ?? 0}-${match.scoreb ?? 0}` : 'Pendiente'}
                  </span>
                </div>

                {/* Side-by-side predictions */}
                <div className="flex items-stretch gap-2 p-3">
                  <PredBadge pred={myPred} match={match} label={myName} />
                  <div className="flex items-center text-muted-foreground text-sm font-bold px-1">vs</div>
                  <PredBadge pred={friendPred} match={match} label={friendName} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
