import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

async function notifyTelegram(email: string, username: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados');
    return;
  }

  const now = new Date().toLocaleString('es-ES', {
    timeZone: 'America/Caracas',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const text =
    `⚽ *Nuevo registro en Quiniela 2026*\n\n` +
    `👤 Usuario: \`${username}\`\n` +
    `📧 Email: \`${email}\`\n` +
    `🕐 Hora: ${now}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
    const json = await res.json();
    if (!json.ok) console.error('[Telegram] Error:', json);
    else console.log('[Telegram] Notificación enviada a', chatId);
  } catch (err) {
    console.error('[Telegram] Fetch falló:', err);
  }
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, username } = body;

    // Server-side validation
    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'La contraseña debe tener entre 8 y 128 caracteres' }, { status: 400 });
    }
    if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json({ error: 'Usuario: 3-30 caracteres, solo letras, números y _' }, { status: 400 });
    }

    // Crear usuario sin requerir confirmación de email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { username },
      email_confirm: true,
    });

    if (userError) {
      if (userError.message.includes('already registered')) {
        return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 400 });
      }
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    // Crear perfil de usuario
    if (userData.user) {
      await supabaseAdmin.from('user_profiles').insert({
        id: userData.user.id,
        username,
      });
    }

    // Notificación Telegram
    await notifyTelegram(email, username);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
