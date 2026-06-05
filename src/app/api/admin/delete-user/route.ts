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

  const { data: adminCheck } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!adminCheck) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  const { userId } = await req.json();
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: 'userId inválido' }, { status: 400 });
  }
  if (userId === user.id) {
    return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
  }

  // Delete dependent rows first (FKs don't have ON DELETE CASCADE)
  const { error: predError } = await supabaseAdmin
    .from('predictions')
    .delete()
    .eq('user_id', userId);
  if (predError) return NextResponse.json({ error: predError.message }, { status: 500 });

  const { error: adminRoleError } = await supabaseAdmin
    .from('admin_users')
    .delete()
    .eq('id', userId);
  if (adminRoleError) return NextResponse.json({ error: adminRoleError.message }, { status: 500 });

  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .delete()
    .eq('id', userId);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  // Now delete the auth user
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
