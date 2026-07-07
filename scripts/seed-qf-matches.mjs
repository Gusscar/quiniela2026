// Seed: asigna equipos a los 4 placeholders de Cuartos de Final (group_letter = 'Q')
// Solo actualiza teama_id/teamb_id de partidos TBD vs TBD — no toca usuarios, predicciones ni puntos.
// Uso: node scripts/seed-qf-matches.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(join(__dirname, '../.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line.startsWith('#') || !line.includes('=')) return;
  const [key, ...val] = line.split('=');
  env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Cruces oficiales de Cuartos (hora UTC = datetime del placeholder existente)
const QF_MATCHES = [
  { teamA: 'France',    teamB: 'Morocco',     date: '2026-07-09T20:00:00Z' }, // Boston
  { teamA: 'Spain',     teamB: 'Belgium',     date: '2026-07-10T19:00:00Z' }, // Los Angeles
  { teamA: 'England',   teamB: 'Norway',      date: '2026-07-11T21:00:00Z' }, // Miami
  { teamA: 'Argentina', teamB: 'Switzerland', date: '2026-07-12T01:00:00Z' }, // Kansas City
];

async function main() {
  console.log('Conectando a:', env.NEXT_PUBLIC_SUPABASE_URL);

  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, name');

  if (teamsError) {
    console.error('Error obteniendo equipos:', teamsError.message);
    process.exit(1);
  }

  const teamMap = new Map(teams.map(t => [t.name, t.id]));
  const tbdId = teamMap.get('TBD');

  const missing = [];
  QF_MATCHES.forEach(m => {
    if (!teamMap.has(m.teamA)) missing.push(m.teamA);
    if (!teamMap.has(m.teamB)) missing.push(m.teamB);
  });

  if (missing.length > 0) {
    console.error('Equipos no encontrados en la DB:', [...new Set(missing)]);
    process.exit(1);
  }

  // Placeholders de Cuartos (TBD vs TBD)
  const { data: placeholders, error: phError } = await supabase
    .from('matches')
    .select('id, datetime, teama_id, teamb_id')
    .eq('group_letter', 'Q');

  if (phError) {
    console.error('Error obteniendo placeholders:', phError.message);
    process.exit(1);
  }

  for (const m of QF_MATCHES) {
    const ph = placeholders.find(p => new Date(p.datetime).getTime() === new Date(m.date).getTime());
    if (!ph) {
      console.error(`❌ No hay placeholder de Cuartos con fecha ${m.date} — omitido`);
      continue;
    }
    if (ph.teama_id !== tbdId || ph.teamb_id !== tbdId) {
      console.log(`⏭️  Placeholder ${m.date} ya tiene equipos asignados — omitido`);
      continue;
    }

    const { error: updError } = await supabase
      .from('matches')
      .update({ teama_id: teamMap.get(m.teamA), teamb_id: teamMap.get(m.teamB) })
      .eq('id', ph.id);

    if (updError) {
      console.error(`❌ Error actualizando ${m.teamA} vs ${m.teamB}:`, updError.message);
    } else {
      console.log(`✅ ${m.teamA} vs ${m.teamB} — ${m.date}`);
    }
  }
}

main().catch(console.error);
