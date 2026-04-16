import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { fetchWCMatches, mapStatus, normalizeName, getNameVariants } from '@/lib/football-api';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function isAuthorized(req: NextRequest): Promise<boolean> {
  // Allow Vercel cron via Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get('authorization');
  if (authHeader && process.env.CRON_SECRET) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (token === process.env.CRON_SECRET) return true;
  }

  // Allow logged-in admin users
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabaseAdmin.from('admin_users').select('id').eq('id', user.id).single();
    return !!data;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!await isAuthorized(req)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  if (!process.env.FOOTBALL_DATA_API_KEY) {
    return NextResponse.json({ error: 'FOOTBALL_DATA_API_KEY no configurada' }, { status: 500 });
  }

  // 1. Fetch DB teams and build name → id map
  const { data: teams, error: teamsErr } = await supabaseAdmin.from('teams').select('id, name');
  if (teamsErr) return NextResponse.json({ error: teamsErr.message }, { status: 500 });

  // normalized_name → team_id
  const nameToId = new Map<string, string>();
  for (const t of teams ?? []) {
    nameToId.set(normalizeName(t.name), t.id);
  }

  // 2. Fetch DB matches
  const { data: dbMatches, error: matchesErr } = await supabaseAdmin
    .from('matches')
    .select('id, teama_id, teamb_id, datetime, status, scorea, scoreb');
  if (matchesErr) return NextResponse.json({ error: matchesErr.message }, { status: 500 });

  // Build lookup: `${teama_id}:${teamb_id}` → match row
  const matchIndex = new Map<string, typeof dbMatches[0]>();
  for (const m of dbMatches ?? []) {
    matchIndex.set(`${m.teama_id}:${m.teamb_id}`, m);
    matchIndex.set(`${m.teamb_id}:${m.teama_id}`, m); // also reversed
  }

  // 3. Fetch API matches
  let apiMatches;
  try {
    apiMatches = await fetchWCMatches();
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }

  // 4. Match and update
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const apiMatch of apiMatches) {
    const newStatus = mapStatus(apiMatch.status);

    // Skip pending matches with no score change needed
    if (newStatus === 'pending') { skipped++; continue; }

    // Resolve home team ID
    const homeVariants = getNameVariants(apiMatch.homeTeam.name);
    const awayVariants = getNameVariants(apiMatch.awayTeam.name);

    let homeId: string | undefined;
    let awayId: string | undefined;

    for (const v of homeVariants) {
      const id = nameToId.get(v);
      if (id) { homeId = id; break; }
    }
    for (const v of awayVariants) {
      const id = nameToId.get(v);
      if (id) { awayId = id; break; }
    }

    if (!homeId || !awayId) {
      errors.push(`No encontrado: ${apiMatch.homeTeam.name} vs ${apiMatch.awayTeam.name}`);
      continue;
    }

    // Find DB match
    const dbMatch = matchIndex.get(`${homeId}:${awayId}`) ?? matchIndex.get(`${awayId}:${homeId}`);
    if (!dbMatch) {
      errors.push(`Partido no en DB: ${apiMatch.homeTeam.name} vs ${apiMatch.awayTeam.name}`);
      continue;
    }

    // Determine score orientation (home may be teama or teamb in DB)
    const homeIsA = dbMatch.teama_id === homeId;
    const scorea = homeIsA
      ? (apiMatch.score.fullTime.home ?? null)
      : (apiMatch.score.fullTime.away ?? null);
    const scoreb = homeIsA
      ? (apiMatch.score.fullTime.away ?? null)
      : (apiMatch.score.fullTime.home ?? null);

    // Skip if nothing changed
    if (dbMatch.status === newStatus && dbMatch.scorea === scorea && dbMatch.scoreb === scoreb) {
      skipped++;
      continue;
    }

    const { error: updateErr } = await supabaseAdmin
      .from('matches')
      .update({ status: newStatus, scorea, scoreb })
      .eq('id', dbMatch.id);

    if (updateErr) {
      errors.push(`Error actualizando ${dbMatch.id}: ${updateErr.message}`);
    } else {
      updated++;
    }
  }

  return NextResponse.json({
    ok: true,
    updated,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  });
}

// Also allow GET for Vercel cron (cron uses GET by default)
export async function GET(req: NextRequest) {
  return POST(req);
}
