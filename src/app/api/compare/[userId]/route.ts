import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  // Verify the requesting user is authenticated
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { userId } = await params;
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: 'userId inválido' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('predictions')
    .select('id, user_id, match_id, goalsA, goalsB, goalsa, goalsb')
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
