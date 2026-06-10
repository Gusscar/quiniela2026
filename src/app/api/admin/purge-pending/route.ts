import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(_req: NextRequest) {
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

  const { data: adminCheck } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!adminCheck) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  // Get admin IDs to exclude them from purge
  const { data: admins } = await supabaseAdmin.from('admin_users').select('id');
  const adminIds = new Set((admins ?? []).map((a: { id: string }) => a.id));

  // Find users with payment_status != 'paid' (null or 'pending'), excluding admins
  // Must use .or() because .neq() does not match NULL rows in SQL
  const { data: pendingProfiles, error: fetchError } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .or('payment_status.is.null,payment_status.eq.pending');

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const toDelete = (pendingProfiles ?? []).filter(
    (p: { id: string }) => !adminIds.has(p.id) && p.id !== user.id
  );

  let deleted = 0;
  const errors: string[] = [];

  for (const profile of toDelete) {
    const id = profile.id;

    const { error: predError } = await supabaseAdmin.from('predictions').delete().eq('user_id', id);
    if (predError) { errors.push(`predictions(${id}): ${predError.message}`); continue; }

    await supabaseAdmin.from('admin_users').delete().eq('id', id);

    const { error: profileError } = await supabaseAdmin.from('user_profiles').delete().eq('id', id);
    if (profileError) { errors.push(`profile(${id}): ${profileError.message}`); continue; }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) { errors.push(`auth(${id}): ${authError.message}`); continue; }

    deleted++;
  }

  return NextResponse.json({ success: true, deleted, errors });
}
