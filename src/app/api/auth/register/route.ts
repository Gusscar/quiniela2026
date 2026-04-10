import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

async function notifyTelegram(email: string, username: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

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

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  }).catch(() => {}); // fallo silencioso — no bloquea el registro
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
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

    // Notificación Telegram (no bloqueante)
    notifyTelegram(email, username);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
