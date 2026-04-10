import { supabase } from '@/lib/supabase';
import { Team, Group } from '@/types';

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('group_letter')
    .order('name');

  if (error) throw error;
  return data || [];
}

export function groupTeamsByGroup(teams: Team[]): Record<Group, Team[]> {
  const groups: Record<Group, Team[]> = {
    A: [], B: [], C: [], D: [],
    E: [], F: [], G: [], H: [],
    I: [], J: [], K: [], L: [],
  };

  teams.forEach((team) => {
    if (team.group_letter && groups[team.group_letter]) {
      groups[team.group_letter].push(team);
    }
  });

  return groups;
}
