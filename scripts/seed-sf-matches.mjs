// Seed: asigna equipos a los 2 placeholders de Semifinales (group_letter = 'S')
// Solo actualiza teama_id/teamb_id de partidos TBD vs TBD — no toca usuarios, predicciones ni puntos.
// Uso: node scripts/seed-sf-matches.mjs
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

// Cruces oficiales de Semifinales (hora UTC = datetime del placeholder existente)
// France y Argentina avanzaron de Cuartos por penaltis tras empatar 1-1 con Norway y Switzerland.
const SF_MATCHES = [
  { teamA: 'France',   teamB: 'Spain',     date: '2026-07-14T19:00:00Z' },
  { teamA: 'England',  teamB: 'Argentina', date: '2026-07-15T19:00:00Z' },
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
  SF_MATCHES.forEach(m => {
    if (!teamMap.has(m.teamA)) missing.push(m.teamA);
    if (!teamMap.has(m.teamB)) missing.push(m.teamB);
  });

  if (missing.length > 0) {
    console.error('Equipos no encontrados en la DB:', [...new Set(missing)]);
    process.exit(1);
  }

  // Placeholders de Semifinales (TBD vs TBD)
  const { data: placeholders, error: phError } = await supabase
    .from('matches')
    .select('id, datetime, teama_id, teamb_id')
    .eq('group_letter', 'S');

  if (phError) {
    console.error('Error obteniendo placeholders:', phError.message);
    process.exit(1);
  }

  for (const m of SF_MATCHES) {
    const ph = placeholders.find(p => new Date(p.datetime).getTime() === new Date(m.date).getTime());
    if (!ph) {
      console.error(`❌ No hay placeholder de Semifinal con fecha ${m.date} — omitido`);
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
