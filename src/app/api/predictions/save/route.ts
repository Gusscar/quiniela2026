import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const { matchId, goalsA, goalsB } = body;

  // Validate inputs
  if (!matchId || typeof matchId !== 'string') {
    return NextResponse.json({ error: 'matchId inválido' }, { status: 400 });
  }
  if (
    typeof goalsA !== 'number' || typeof goalsB !== 'number' ||
    !Number.isInteger(goalsA) || !Number.isInteger(goalsB) ||
    goalsA < 0 || goalsA > 50 || goalsB < 0 || goalsB > 50
  ) {
    return NextResponse.json({ error: 'Marcador inválido' }, { status: 400 });
  }

  // Check global quiniela deadline: 2 hours before first match
  const { data: firstMatch } = await supabaseAdmin
    .from('matches')
    .select('datetime')
    .order('datetime', { ascending: true })
    .limit(1)
    .single();

  if (firstMatch) {
    const deadline = new Date(firstMatch.datetime).getTime() - 2 * 60 * 60 * 1000;
    if (Date.now() >= deadline) {
      return NextResponse.json(
        { error: 'El plazo de predicciones ha cerrado.' },
        { status: 403 }
      );
    }
  }

  // Also verify the individual match hasn't started
  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('datetime, status')
    .eq('id', matchId)
    .single();

  if (!match) {
    return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 });
  }
  if (match.status !== 'pending' && match.status !== 'scheduled') {
    return NextResponse.json({ error: 'Este partido ya no acepta predicciones' }, { status: 403 });
  }
  if (new Date() >= new Date(match.datetime)) {
    return NextResponse.json({ error: 'Este partido ya comenzó' }, { status: 403 });
  }

  // Save prediction
  const { error } = await supabaseAdmin.from('predictions').upsert(
    {
      user_id: user.id,
      match_id: matchId,
      goalsa: goalsA,
      goalsb: goalsB,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,match_id' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
