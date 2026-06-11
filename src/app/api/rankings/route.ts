import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { calculatePoints } from '@/lib/scoring';
import { Standing } from '@/types';

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  // Paginate to bypass Supabase's server-side max_rows limit of 1000
  const PAGE_SIZE = 1000;
  const predictions: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('predictions')
      .select('*, matches(*)')
      .range(from, from + PAGE_SIZE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    predictions.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('payment_status', 'paid');

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const userPoints: Record<string, { points: number; count: number }> = {};

  predictions.forEach((pred) => {
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

  // Ensure all paid users appear, even those with no predictions
  for (const profile of profiles ?? []) {
    if (!userPoints[profile.id]) {
      userPoints[profile.id] = { points: 0, count: 0 };
    }
  }

  const paidProfileIds = new Set(profiles?.map((p) => p.id) ?? []);

  const rankings: Standing[] = Object.entries(userPoints)
    .filter(([userId]) => paidProfileIds.has(userId))
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
