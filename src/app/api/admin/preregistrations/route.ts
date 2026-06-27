import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: adminData } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!adminData) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  const round = req.nextUrl.searchParams.get('round') || 'r16';
  const metaKey = `prereg_${round}`;

  // List all auth users and filter by metadata
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const preregistered = users
    .filter((u) => u.user_metadata?.[metaKey] === true)
    .map((u) => ({
      user_id: u.id,
      email: u.email,
      username: u.user_metadata?.username ?? null,
      registered_at: u.user_metadata?.[`${metaKey}_at`] ?? u.created_at,
    }))
    .sort((a, b) => new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime());

  return NextResponse.json({ data: preregistered });
}
