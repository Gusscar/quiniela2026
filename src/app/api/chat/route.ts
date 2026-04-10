import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el árbitro asistente de "Quiniela Mundial 2026", una app web donde los usuarios predicen resultados de partidos del Mundial de Fútbol 2026.

Sobre la app:
- 48 equipos, 12 grupos (A-L), 72 partidos de fase grupal
- Los usuarios se registran, inician sesión y predicen marcadores de cada partido
- Sistema de puntos: 3 pts por marcador exacto, 1 pt por acertar el ganador/empate, 0 pts si falla
- Hay un ranking global con todos los usuarios
- El administrador actualiza los marcadores reales el día del partido

Páginas disponibles:
- /predictions → Predicciones
- /teams → Equipos con banderas y estadísticas
- /rankings → Ranking global
- /rules → Reglas

Responde SIEMPRE en español. Sé amigable, usa emojis de fútbol ocasionalmente ⚽🏆. Respuestas cortas (máximo 3 párrafos).`;

export async function POST(request: NextRequest) {
  // Require authentication
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

  try {
    const body = await request.json();
    const { messages, page } = body;

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Mensajes inválidos' }, { status: 400 });
    }
    // Limit conversation length to prevent abuse
    if (messages.length > 20) {
      return NextResponse.json({ error: 'Conversación muy larga' }, { status: 400 });
    }
    // Validate last message length
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg?.content || typeof lastMsg.content !== 'string' || lastMsg.content.length > 500) {
      return NextResponse.json({ error: 'Mensaje inválido o muy largo' }, { status: 400 });
    }

    const pageContext = page && typeof page === 'string' ? `\n\nPágina actual: ${page}` : '';

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT + pageContext,
      messages: messages.slice(-10), // send only last 10 messages to limit token usage
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ reply: text });
  } catch {
    return NextResponse.json({ error: 'Error al procesar tu pregunta' }, { status: 500 });
  }
}
