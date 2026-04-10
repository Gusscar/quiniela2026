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
    created_at: row.created_at,
  }));
}

export async function savePrediction(
  userId: string,
  matchId: string,
  goalsA: number | null,
  goalsB: number | null
): Promise<void> {
  const { error } = await supabase.from('predictions').upsert(
    {
      user_id: userId,
      match_id: matchId,
      goalsa: goalsA,
      goalsb: goalsB,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,match_id',
    }
  );

  if (error) throw error;
}
