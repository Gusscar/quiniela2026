import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  // Rate limit: 10 attempts per IP per 15 minutes
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera 15 minutos.' },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
  }

  let response = NextResponse.json({ success: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.json({ success: true });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // After the first match cutoff (1 hour before), only paid users can log in
  const { data: firstMatch } = await supabaseAdmin
    .from('matches')
    .select('datetime')
    .order('datetime', { ascending: true })
    .limit(1)
    .single();

  if (firstMatch) {
    const cutoff = new Date(firstMatch.datetime).getTime() - 60 * 60 * 1000;
    if (Date.now() >= cutoff) {
      const [{ data: profile }, { data: adminCheck }] = await Promise.all([
        supabaseAdmin
          .from('user_profiles')
          .select('payment_status')
          .eq('id', authData.user.id)
          .single(),
        supabaseAdmin
          .from('admin_users')
          .select('id')
          .eq('id', authData.user.id)
          .maybeSingle(),
      ]);

      if (!adminCheck && profile?.payment_status !== 'paid') {
        await supabase.auth.signOut();
        return NextResponse.json(
          { error: 'El torneo ya comenzó. Solo participantes con pago confirmado pueden ingresar.' },
          { status: 403 }
        );
      }
    }
  }

  return response;
}
