import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// Service role used server-side only — key never reaches the client.
// Needed to read another user's predictions regardless of RLS.
// The RLS policy "Authenticated read finished predictions" covers client-side
// access, but the compare page intentionally shows all match statuses.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  // Verify the requesting user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { userId } = await params;
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: 'userId inválido' }, { status: 400 });
  }

  // Verify the target user exists as a registered participant
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from('predictions')
    .select('*')
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const normalized = (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    match_id: row.match_id,
    goalsA: row.goalsA ?? row.goalsa ?? null,
    goalsB: row.goalsB ?? row.goalsb ?? null,
  }));

  return NextResponse.json(normalized);
}
