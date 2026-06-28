import { supabase } from '@/lib/supabase';
import { Prediction } from '@/types';

export async function getPredictions(userId: string): Promise<Prediction[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    match_id: row.match_id,
    goalsA: row.goalsA ?? row.goalsa ?? null,
    goalsB: row.goalsB ?? row.goalsb ?? null,
    advancing_team: row.advancing_team ?? null,
    created_at: row.created_at,
  }));
}

export async function savePrediction(
  _userId: string,
  matchId: string,
  goalsA: number | null,
  goalsB: number | null,
  advancingTeam?: 'A' | 'B' | null
): Promise<void> {
  const res = await fetch('/api/predictions/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId, goalsA, goalsB, advancingTeam }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al guardar');
  }
}
