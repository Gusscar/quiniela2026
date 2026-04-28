import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  // 1. Verify the requesting user is authenticated
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  // 2. Verify the requesting user is an admin
  const { data: adminCheck } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!adminCheck) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  // 3. Validate body
  const { userId, makeAdmin } = await req.json();
  if (!userId || typeof makeAdmin !== 'boolean') {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: 'userId inválido' }, { status: 400 });
  }
  // Prevent self-demotion (safety net)
  if (userId === user.id && !makeAdmin) {
    return NextResponse.json({ error: 'No puedes removerte a ti mismo' }, { status: 400 });
  }

  // 4. Toggle admin status using service role (bypasses RLS)
  if (makeAdmin) {
    const { error } = await supabaseAdmin.from('admin_users').insert({ id: userId });
    if (error && !error.message.includes('duplicate')) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabaseAdmin.from('admin_users').delete().eq('id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
