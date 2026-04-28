import { Team, Match } from '@/types';

interface AppData {
  teams?: Team[];
  matches?: Match[];
  pathname?: string;
}

interface Answer {
  text: string;
  suggestions?: string[];
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function getLocalAnswer(raw: string, data: AppData): Answer {
  const q = raw.toLowerCase().trim();
  const { teams = [], matches = [] } = data;

  /* ── Saludos ── */
  if (/^(hola|hey|buenas|saludos|buenos|hi\b|buen dia)/.test(q)) {
    return {
      text: '¡Hola! 👋 Soy el árbitro de la Quiniela Mundial 2026 ⚽\n\n¿En qué te puedo ayudar?',
      suggestions: ['¿Cómo lleno mis predicciones?', '¿Cuántos puntos vale el marcador exacto?', '¿Cuántos equipos hay?'],
    };
  }

  /* ── Sistema de puntos ── */
  if (/punt(o|os|aje)|cuánto (vale|dan|gano|suma)|3 pt|marcador exact|sistem|puntua|tendencia/.test(q)) {
    return {
      text: '🏆 Sistema de puntos:\n\n⚽ 3 pts → Resultado Exacto\n   (predices 2-1 y termina 2-1)\n\n✅ 2 pts → Tendencia\n   (aciertas ganador o empate, pero marcador diferente)\n\n❌ 0 pts → Resultado incorrecto',
      suggestions: ['¿Cuál es la fecha límite?', '¿Cómo funciona la premiación?', '¿Cuándo se actualiza el ranking?'],
    };
  }

  /* ── Cómo llenar predicciones ── */
  if (/cómo (coloco|pongo|lleno|guardo|hago|predigo|anoto|escrib)|llenar|predic|guardar result|ingresar|colocar/.test(q)) {
    return {
      text: '📝 Para llenar tus predicciones:\n\n1️⃣ Ve a la sección Predicciones\n2️⃣ Selecciona el grupo (A, B, C... hasta L)\n3️⃣ En cada tarjeta de partido verás "Tu predicción"\n4️⃣ Escribe los goles de cada equipo\n5️⃣ Toca Guardar ⚽\n\n💡 Puedes editarlas hasta que el partido inicie.',
      suggestions: ['¿Puedo cambiar mi predicción?', '¿Cuántos partidos puedo predecir?'],
    };
  }

  /* ── Editar predicción ── */
  if (/cambiar|editar|modificar|corregir|actualizar (mi )?predic/.test(q)) {
    return {
      text: '🚫 Los pronósticos son definitivos.\n\nUna vez enviado, el pronóstico no se puede editar ni cambiar. Asegúrate antes de guardar.\n\n⏰ Fecha límite: 11 de junio a las 12:00 AM.',
    };
  }

  /* ── Fecha límite ── */
  if (/fecha.?límite|hasta cuándo|límite de|cuándo cierra|plazo|deadline/.test(q)) {
    return {
      text: '⏰ Fecha límite: 11 de junio a las 12:00 AM.\n\nDespués de esa hora no se aceptan nuevos pronósticos.\n\n🚫 Recuerda que los pronósticos enviados son definitivos — no se permiten ediciones.',
      suggestions: ['¿Cómo lleno mis predicciones?', '¿Cuándo inicia el Mundial?'],
    };
  }

  /* ── Premiación / premios ── */
  if (/premi|premio|gana|cuánto (me |se )?paga|distribuc|pozo|90%|70%|1er lugar|primer lugar/.test(q)) {
    return {
      text: '💰 Premiación del pozo:\n\n🥇 1er Lugar: 70%\n🥈 2do Lugar: 20%\n🥉 3er Lugar: 10%\n\nEl sistema retiene el 10% para gastos operativos. El 90% restante se reparte entre los tres primeros.',
      suggestions: ['¿Cómo se calcula el ranking?', '¿Cuál es la condición de pago?'],
    };
  }

  /* ── Condición de pago ── */
  if (/condici.n de pago|cancelar|pago|pagué|cómo pago|sin pagar/.test(q)) {
    return {
      text: '💳 Condición de pago:\n\nQuiniela sin cancelar, no juega. Debes completar el pago para que tus predicciones sean válidas y aparecer en el ranking oficial.\n\nContacta al administrador si tienes dudas sobre tu pago.',
    };
  }

  /* ── Tiempo oficial / prórroga ── */
  if (/prórroga|penalt|tiempo extra|90 minutos|tiempo oficial|added time|tiempo añadido/.test(q)) {
    return {
      text: "⏱️ Tiempo Oficial:\n\nLos pronósticos son válidos solo para los 90' reglamentarios, incluyendo el tiempo añadido.\n\n❌ No aplica para prórrogas ni tandas de penaltis.",
    };
  }

  /* ── Cuántos partidos ── */
  if (/cuántos partido|total partido|cuántos juego/.test(q)) {
    const total = matches.length;
    const pending = matches.filter(m => m.status === 'pending' || m.status === 'scheduled').length;
    const finished = matches.filter(m => m.status === 'finished').length;
    return {
      text: `⚽ Partidos en la quiniela:\n\n📋 Total: ${total || 72}\n⏳ Pendientes: ${pending}\n✅ Finalizados: ${finished}`,
    };
  }

  /* ── Cuántos equipos ── */
  if (/cuántos equipo|cuántas seleccion|total equipo|cuántas nacion|cuántos pais/.test(q)) {
    return {
      text: `🌍 El Mundial 2026 tiene ${teams.length || 48} equipos divididos en 12 grupos (A hasta L), con 4 equipos por grupo.`,
      suggestions: ['¿Qué equipos hay en el Grupo A?', '¿Cuáles son los grupos?'],
    };
  }

  /* ── Listar grupos ── */
  if (/cuáles son los grupos|todos los grupos|qué grupos hay|lista.*grupos/.test(q)) {
    if (teams.length === 0) {
      return { text: 'Hay 12 grupos: A, B, C, D, E, F, G, H, I, J, K y L.' };
    }
    const groupLetters = [...new Set(teams.map(t => t.group_letter))].sort();
    return {
      text: `📋 Los ${groupLetters.length} grupos del Mundial 2026:\n${groupLetters.map(g => `• Grupo ${g}`).join('\n')}`,
      suggestions: groupLetters.slice(0, 4).map(g => `¿Qué equipos hay en el Grupo ${g}?`),
    };
  }

  /* ── Equipos de un grupo específico ── */
  const groupMatch = q.match(/grupo\s+([a-l])/i);
  if (groupMatch) {
    const g = groupMatch[1].toUpperCase();
    const groupTeams = teams.filter(t => t.group_letter === g);
    if (groupTeams.length > 0) {
      return {
        text: `🏟️ Grupo ${g}:\n${groupTeams.map(t => `• ${t.name}`).join('\n')}`,
        suggestions: [`¿Partidos del Grupo ${g}?`],
      };
    }
    return { text: `No encontré equipos en el Grupo ${g}. Puede que aún no esté cargado.` };
  }

  /* ── Partidos de un grupo ── */
  const matchGroupQ = q.match(/partido[s]?.*grupo\s+([a-l])|grupo\s+([a-l]).*partido/i);
  if (matchGroupQ) {
    const g = (matchGroupQ[1] || matchGroupQ[2]).toUpperCase();
    const gMatches = matches.filter(m => m.group_letter === g).slice(0, 6);
    if (gMatches.length > 0) {
      const lines = gMatches.map(m =>
        `• ${m.teamA?.name ?? '?'} vs ${m.teamB?.name ?? '?'} — ${fmt(m.datetime)}`
      );
      return { text: `⚽ Partidos Grupo ${g}:\n${lines.join('\n')}` };
    }
    return { text: `No encontré partidos del Grupo ${g}.` };
  }

  /* ── Buscar equipo por nombre ── */
  if (teams.length > 0) {
    const found = teams.find(t => q.includes(t.name.toLowerCase()));
    if (found) {
      const teamMatches = matches
        .filter(m => m.teama_id === found.id || m.teamb_id === found.id)
        .slice(0, 4);
      let text = `🏳️ ${found.name}\n📍 Grupo ${found.group_letter}`;
      if (teamMatches.length > 0) {
        text += `\n\n⚽ Partidos:\n` + teamMatches.map(m => {
          const rival = m.teama_id === found.id ? m.teamB?.name : m.teamA?.name;
          const score = m.status === 'finished'
            ? ` (${m.scorea}-${m.scoreb})`
            : ` — ${fmt(m.datetime)}`;
          return `• vs ${rival ?? '?'}${score}`;
        }).join('\n');
      }
      return { text };
    }
  }

  /* ── Próximos partidos ── */
  if (/próximo|siguiente|cuándo (es|jug|empiez)|cuando hay partido/.test(q)) {
    const next = matches
      .filter(m => m.status === 'pending' || m.status === 'scheduled')
      .slice(0, 5);
    if (next.length > 0) {
      const lines = next.map(m =>
        `• ${m.teamA?.name ?? '?'} vs ${m.teamB?.name ?? '?'}\n  ${fmt(m.datetime)}`
      );
      return { text: `📅 Próximos partidos:\n\n${lines.join('\n\n')}` };
    }
    return { text: 'No hay partidos próximos registrados aún.' };
  }

  /* ── Partidos en vivo ── */
  if (/vivo|live|jugando ahora|en curso/.test(q)) {
    const live = matches.filter(m => m.status === 'live');
    if (live.length > 0) {
      const lines = live.map(m =>
        `🔴 ${m.teamA?.name} ${m.scorea ?? 0} - ${m.scoreb ?? 0} ${m.teamB?.name}`
      );
      return { text: `🔴 Partidos en vivo:\n\n${lines.join('\n')}` };
    }
    return { text: 'No hay partidos en vivo en este momento. ⏳' };
  }

  /* ── Ranking ── */
  if (/ranking|tabla|posici|quién va (primero|ganando|arriba)|clasificaci/.test(q)) {
    return {
      text: '🏆 El ranking muestra a todos los jugadores ordenados por puntos.\n\nSe actualiza automáticamente cuando el administrador registra los resultados de cada partido.\n\n👉 Ve a la sección Ranking para verlo.',
    };
  }

  /* ── Inicio del Mundial ── */
  if (/cuándo (empieza|inicia|comienza|arranca)|fecha (del|de|inicio)|cuándo es el mundial/.test(q)) {
    return {
      text: '📅 El Mundial 2026 inicia el 11 de junio de 2026 con el partido inaugural en el Estadio Azteca (México City).\n\n🏟️ Se juega en México 🇲🇽, EE.UU. 🇺🇸 y Canadá 🇨🇦.',
    };
  }

  /* ── Cómo registrarse ── */
  if (/registr|crear cuenta|cómo entrar|cómo unirme|sign up/.test(q)) {
    return {
      text: '📋 Para registrarte:\n\n1️⃣ Ve a la página de inicio\n2️⃣ Toca "Crear cuenta gratis"\n3️⃣ Ingresa tu email, nombre de usuario y contraseña\n4️⃣ ¡Listo! Podrás ingresar de inmediato ⚽',
    };
  }

  /* ── Ayuda general ── */
  if (/ayuda|qué puedes|cómo funciona (esto|la app|la quiniel)|para qué sirve/.test(q)) {
    return {
      text: '⚽ Soy el árbitro asistente de la Quiniela Mundial 2026.\n\nPuedo ayudarte con:\n• 📝 Cómo llenar predicciones\n• 🏆 Sistema de puntos\n• 🌍 Información de equipos y grupos\n• 📅 Fechas y partidos\n• 🏟️ Navegación de la app',
      suggestions: ['¿Cómo lleno mis predicciones?', '¿Cuántos puntos vale el marcador exacto?', '¿Cuál es la fecha límite?', '¿Cómo funciona la premiación?'],
    };
  }

  /* ── No entendió ── */
  return {
    text: 'Mmm, no estoy seguro de cómo responder eso 🤔\n\nPuedo ayudarte con predicciones, equipos, puntos, partidos y navegación de la app. ¿Qué necesitas saber?',
    suggestions: ['¿Cómo lleno mis predicciones?', '¿Cuántos puntos vale el marcador exacto?', '¿Qué equipos hay en el Grupo A?'],
  };
}
