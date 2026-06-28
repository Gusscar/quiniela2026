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

  // Verify admin
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: adminCheck } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (!adminCheck) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  const { matchId, status, scorea, scoreb, advancingTeam } = await req.json();
  if (!matchId || !status) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }
  if (!['pending', 'live', 'finished'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
  }

  const validAdvancing = advancingTeam === 'A' || advancingTeam === 'B' ? advancingTeam : null;

  const { error } = await supabaseAdmin
    .from('matches')
    .update({ status, scorea: scorea ?? null, scoreb: scoreb ?? null, advancing_team: validAdvancing })
    .eq('id', matchId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
