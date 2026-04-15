import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { calculatePoints } from '@/lib/scoring';
import { Standing } from '@/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  const { data: predictions, error: predictionsError } = await supabaseAdmin
    .from('predictions')
    .select('*, matches(*)');

  if (predictionsError) {
    return NextResponse.json({ error: predictionsError.message }, { status: 500 });
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('user_profiles')
    .select('*');

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const userPoints: Record<string, { points: number; count: number }> = {};

  predictions?.forEach((pred) => {
    if (!userPoints[pred.user_id]) {
      userPoints[pred.user_id] = { points: 0, count: 0 };
    }

    const predGoalsA = pred.goalsA ?? pred.goalsa ?? null;
    const predGoalsB = pred.goalsB ?? pred.goalsb ?? null;
    const points = calculatePoints(
      predGoalsA,
      predGoalsB,
      pred.matches?.scorea ?? pred.matches?.scoreA ?? null,
      pred.matches?.scoreb ?? pred.matches?.scoreB ?? null
    );

    if (predGoalsA !== null && predGoalsB !== null) {
      userPoints[pred.user_id].points += points;
      userPoints[pred.user_id].count += 1;
    }
  });

  const rankings: Standing[] = Object.entries(userPoints)
    .map(([userId, data]) => {
      const profile = profiles?.find((p) => p.id === userId);
      return {
        user_id: userId,
        username: profile?.username || 'Usuario',
        points: data.points,
        predictions_count: data.count,
        position: 0,
      };
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.predictions_count - a.predictions_count;
    })
    .map((standing, index) => ({ ...standing, position: index + 1 }));

  return NextResponse.json(rankings);
}
