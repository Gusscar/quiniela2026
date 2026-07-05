import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Fetch teams for lookup
  const { data: teamsData } = await supabaseAdmin.from('teams').select('id, name, flag_url');
  const teamsById = new Map((teamsData ?? []).map((t: any) => [t.id, t]));

  // 1. Try live matches first
  let { data: matchRows } = await supabaseAdmin
    .from('matches')
    .select('*')
    .eq('status', 'live')
    .order('datetime', { ascending: true });

  // 2. Fallback: most recently started match (within last 4 hours)
  if (!matchRows || matchRows.length === 0) {
    const cutoff = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabaseAdmin
      .from('matches')
      .select('*')
      .gte('datetime', cutoff)
      .lte('datetime', new Date().toISOString())
      .order('datetime', { ascending: false })
      .limit(2);
    matchRows = recent ?? [];
  }

  if (!matchRows || matchRows.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  const matchIds = matchRows.map((m: any) => m.id);

  // Get all predictions for these matches
  const { data: preds } = await supabaseAdmin
    .from('predictions')
    .select('*')
    .in('match_id', matchIds);

  // Get user profiles for all predictors
  const userIds = [...new Set((preds ?? []).map((p: any) => p.user_id))];
  const { data: profiles } = await supabaseAdmin
    .from('user_profiles')
    .select('id, username')
    .in('id', userIds);

  const profilesById = new Map((profiles ?? []).map((p: any) => [p.id, p.username]));

  // Get admin ids to exclude
  const { data: admins } = await supabaseAdmin.from('admin_users').select('id');
  const adminIds = new Set((admins ?? []).map((a: any) => a.id));

  const matches = matchRows.map((m: any) => {
    const teamA = teamsById.get(m.teama_id);
    const teamB = teamsById.get(m.teamb_id);
    const matchPreds = (preds ?? [])
      .filter((p: any) => p.match_id === m.id && !adminIds.has(p.user_id))
      .map((p: any) => ({
        user_id: p.user_id,
        username: profilesById.get(p.user_id) ?? 'Usuario',
        goalsA: p.goalsa ?? p.goalsA ?? null,
        goalsB: p.goalsb ?? p.goalsB ?? null,
        advancing_team: p.advancing_team ?? null,
      }))
      .sort((a: any, b: any) => a.username.localeCompare(b.username));

    return {
      id: m.id,
      status: m.status,
      datetime: m.datetime,
      scorea: m.scorea ?? null,
      scoreb: m.scoreb ?? null,
      advancing_team: m.advancing_team ?? null,
      group_letter: m.group_letter,
      teamA: teamA ? { name: teamA.name, flag_url: teamA.flag_url } : null,
      teamB: teamB ? { name: teamB.name, flag_url: teamB.flag_url } : null,
      predictions: matchPreds,
    };
  });

  return NextResponse.json({ matches });
}
