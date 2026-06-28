// Seed: 16 partidos de Dieciseisavos de Final
// Uso: node scripts/seed-r16-matches.mjs
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

// 16 cruces con fechas (hora UTC)
const R16_MATCHES = [
  { teamA: 'South Africa',   teamB: 'Canada',            date: '2026-06-28T22:00:00Z' },
  { teamA: 'Brazil',         teamB: 'Japan',             date: '2026-06-29T18:00:00Z' },
  { teamA: 'Germany',        teamB: 'Paraguay',          date: '2026-06-29T22:00:00Z' },
  { teamA: 'Netherlands',    teamB: 'Morocco',           date: '2026-06-29T02:00:00Z' },
  { teamA: "Côte d'Ivoire",  teamB: 'Norway',            date: '2026-06-30T18:00:00Z' },
  { teamA: 'France',         teamB: 'Sweden',            date: '2026-06-30T22:00:00Z' },
  { teamA: 'Mexico',         teamB: 'Ecuador',           date: '2026-06-30T02:00:00Z' },
  { teamA: 'USA',            teamB: 'Bosnia-Herzegovina',date: '2026-07-01T18:00:00Z' },
  { teamA: 'England',        teamB: 'Congo DR',          date: '2026-07-01T22:00:00Z' },
  { teamA: 'Belgium',        teamB: 'Senegal',           date: '2026-07-01T02:00:00Z' },
  { teamA: 'Spain',          teamB: 'Austria',           date: '2026-07-02T18:00:00Z' },
  { teamA: 'Switzerland',    teamB: 'Algeria',           date: '2026-07-02T22:00:00Z' },
  { teamA: 'Portugal',       teamB: 'Croatia',           date: '2026-07-02T02:00:00Z' },
  { teamA: 'Australia',      teamB: 'Egypt',             date: '2026-07-03T18:00:00Z' },
  { teamA: 'Argentina',      teamB: 'Cabo Verde',        date: '2026-07-03T22:00:00Z' },
  { teamA: 'Colombia',       teamB: 'Ghana',             date: '2026-07-03T02:00:00Z' },
];

async function main() {
  console.log('Conectando a:', env.NEXT_PUBLIC_SUPABASE_URL);

  // Obtener todos los equipos
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, name');

  if (teamsError) {
    console.error('Error obteniendo equipos:', teamsError.message);
    process.exit(1);
  }

  const teamMap = new Map(teams.map(t => [t.name, t.id]));

  // Verificar que todos los equipos existen
  const missing = [];
  R16_MATCHES.forEach(m => {
    if (!teamMap.has(m.teamA)) missing.push(m.teamA);
    if (!teamMap.has(m.teamB)) missing.push(m.teamB);
  });

  if (missing.length > 0) {
    console.error('Equipos no encontrados en la DB:', [...new Set(missing)]);
    process.exit(1);
  }

  // Insertar los 16 partidos con group_letter = null (marca R16)
  const matchesToInsert = R16_MATCHES.map(m => ({
    teama_id: teamMap.get(m.teamA),
    teamb_id: teamMap.get(m.teamB),
    datetime: m.date,
    group_letter: null,
    status: 'scheduled',
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('matches')
    .insert(matchesToInsert)
    .select();

  if (insertError) {
    console.error('Error insertando partidos:', insertError.message);
    process.exit(1);
  }

  console.log(`✅ ${inserted.length} partidos de Dieciseisavos insertados:`);
  R16_MATCHES.forEach(m => console.log(`  ${m.teamA} vs ${m.teamB}`));
}

main().catch(console.error);
