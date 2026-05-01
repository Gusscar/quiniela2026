import { supabase } from '@/lib/supabase';
import { Match, Group, Team } from '@/types';

export async function getMatches(): Promise<Match[]> {
  const [matchesResult, teamsResult] = await Promise.all([
    supabase.from('matches').select('*').order('datetime'),
    supabase.from('teams').select('*'),
  ]);

  if (matchesResult.error) throw matchesResult.error;
  if (teamsResult.error) throw teamsResult.error;

  const teamsById = new Map<string, Team>();
  (teamsResult.data || []).forEach((t: Team) => teamsById.set(t.id, t));

  return (matchesResult.data || []).map((m: any) => ({
    id: m.id,
    teama_id: m.teama_id,
    teamb_id: m.teamb_id,
    datetime: m.datetime,
    group_letter: m.group_letter,
    status: m.status,
    scorea: m.scorea ?? m.scoreA ?? null,
    scoreb: m.scoreb ?? m.scoreB ?? null,
    teamA: teamsById.get(m.teama_id) ?? teamsById.get(m.teamA_id) ?? undefined,
    teamB: teamsById.get(m.teamb_id) ?? teamsById.get(m.teamB_id) ?? undefined,
  }));
}

export function groupMatchesByGroup(matches: Match[]): Record<Group, Match[]> {
  const groups: Record<Group, Match[]> = {
    A: [], B: [], C: [], D: [],
    E: [], F: [], G: [], H: [],
    I: [], J: [], K: [], L: [],
  };

  matches.forEach((match) => {
    const g = match.group_letter as Group;
    if (groups[g]) groups[g].push(match);
  });

  return groups;
}

export function isMatchLocked(match: Match): boolean {
  if (match.status !== 'pending' && match.status !== 'scheduled') return true;
  // Also lock if match datetime has already passed (in case DB status hasn't been synced yet)
  return new Date() >= new Date(match.datetime);
}
