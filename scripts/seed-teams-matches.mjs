// =============================================
// Seed: equipos y partidos desde el Excel
// Uso: node scripts/seed-teams-matches.mjs
// =============================================
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import xlsx from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Leer .env.local manualmente
const envPath = join(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf8');
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

// Flag URLs por nombre de equipo
const FLAGS = {
  'Mexico': 'https://flagcdn.com/w80/mx.png',
  'South Africa': 'https://flagcdn.com/w80/za.png',
  'Korea Republic': 'https://flagcdn.com/w80/kr.png',
  'Czechia': 'https://flagcdn.com/w80/cz.png',
  'Canada': 'https://flagcdn.com/w80/ca.png',
  'Bosnia-Herzegovina': 'https://flagcdn.com/w80/ba.png',
  'Qatar': 'https://flagcdn.com/w80/qa.png',
  'Switzerland': 'https://flagcdn.com/w80/ch.png',
  'Brazil': 'https://flagcdn.com/w80/br.png',
  'Morocco': 'https://flagcdn.com/w80/ma.png',
  'Haiti': 'https://flagcdn.com/w80/ht.png',
  'Scotland': 'https://flagcdn.com/w80/gb-sct.png',
  'USA': 'https://flagcdn.com/w80/us.png',
  'Paraguay': 'https://flagcdn.com/w80/py.png',
  'Australia': 'https://flagcdn.com/w80/au.png',
  'Turkey': 'https://flagcdn.com/w80/tr.png',
  'Germany': 'https://flagcdn.com/w80/de.png',
  'Curaçao': 'https://flagcdn.com/w80/cw.png',
  "Côte d'Ivoire": 'https://flagcdn.com/w80/ci.png',
  'Ecuador': 'https://flagcdn.com/w80/ec.png',
  'Netherlands': 'https://flagcdn.com/w80/nl.png',
  'Japan': 'https://flagcdn.com/w80/jp.png',
  'Sweden': 'https://flagcdn.com/w80/se.png',
  'Tunisia': 'https://flagcdn.com/w80/tn.png',
  'Belgium': 'https://flagcdn.com/w80/be.png',
  'Egypt': 'https://flagcdn.com/w80/eg.png',
  'IR Iran': 'https://flagcdn.com/w80/ir.png',
  'New Zealand': 'https://flagcdn.com/w80/nz.png',
  'Spain': 'https://flagcdn.com/w80/es.png',
  'Cabo Verde': 'https://flagcdn.com/w80/cv.png',
  'Saudi Arabia': 'https://flagcdn.com/w80/sa.png',
  'Uruguay': 'https://flagcdn.com/w80/uy.png',
  'France': 'https://flagcdn.com/w80/fr.png',
  'Senegal': 'https://flagcdn.com/w80/sn.png',
  'Iraq': 'https://flagcdn.com/w80/iq.png',
  'Norway': 'https://flagcdn.com/w80/no.png',
  'Argentina': 'https://flagcdn.com/w80/ar.png',
  'Algeria': 'https://flagcdn.com/w80/dz.png',
  'Austria': 'https://flagcdn.com/w80/at.png',
  'Jordan': 'https://flagcdn.com/w80/jo.png',
  'Portugal': 'https://flagcdn.com/w80/pt.png',
  'Congo DR': 'https://flagcdn.com/w80/cd.png',
  'Uzbekistan': 'https://flagcdn.com/w80/uz.png',
  'Colombia': 'https://flagcdn.com/w80/co.png',
  'England': 'https://flagcdn.com/w80/gb-eng.png',
  'Croatia': 'https://flagcdn.com/w80/hr.png',
  'Ghana': 'https://flagcdn.com/w80/gh.png',
  'Panama': 'https://flagcdn.com/w80/pa.png',
};

async function main() {
  console.log('Conectando a:', env.NEXT_PUBLIC_SUPABASE_URL);

  // Leer Excel
  const wb = xlsx.readFile('C:/Users/Gustavo/Desktop/quinielaPromo/quiniela-2026-06-11.xlsx');
  const ws = wb.Sheets['Predicciones'];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
  const headers = data[0].slice(2);

  // Extraer equipos únicos por grupo
  const teamsMap = new Map(); // "name|group" -> {name, group}
  const matchDefs = [];

  headers.forEach(h => {
    const match = h.match(/^([A-L]): (.+) vs (.+)$/);
    if (!match) return;
    const [, group, teamA, teamB] = match;
    const keyA = `${teamA.trim()}|${group}`;
    const keyB = `${teamB.trim()}|${group}`;
    if (!teamsMap.has(keyA)) teamsMap.set(keyA, { name: teamA.trim(), group_letter: group });
    if (!teamsMap.has(keyB)) teamsMap.set(keyB, { name: teamB.trim(), group_letter: group });
    matchDefs.push({ group, teamA: teamA.trim(), teamB: teamB.trim() });
  });

  // 1. Insertar equipos
  console.log(`\nInsertando ${teamsMap.size} equipos...`);
  const teamsList = [...teamsMap.values()].map(t => ({
    name: t.name,
    group_letter: t.group_letter,
    flag_url: FLAGS[t.name] || null,
  }));

  const { data: insertedTeams, error: teamsError } = await supabase
    .from('teams')
    .insert(teamsList)
    .select();

  if (teamsError) {
    console.error('Error insertando equipos:', teamsError.message);
    process.exit(1);
  }
  console.log(`✓ ${insertedTeams.length} equipos insertados`);

  // Mapa nombre -> id
  const teamIdMap = new Map();
  insertedTeams.forEach(t => teamIdMap.set(t.name, t.id));

  // 2. Insertar partidos (sin datetime - se actualiza después)
  console.log(`\nInsertando ${matchDefs.length} partidos...`);
  const matchesToInsert = matchDefs.map(m => ({
    teama_id: teamIdMap.get(m.teamA),
    teamb_id: teamIdMap.get(m.teamB),
    group_letter: m.group,
    status: 'finished',
    datetime: new Date('2026-06-01T00:00:00Z').toISOString(), // placeholder
  }));

  const { data: insertedMatches, error: matchesError } = await supabase
    .from('matches')
    .insert(matchesToInsert)
    .select();

  if (matchesError) {
    console.error('Error insertando partidos:', matchesError.message);
    process.exit(1);
  }
  console.log(`✓ ${insertedMatches.length} partidos insertados`);
  console.log('\n✅ Seed completado. Equipos y partidos listos en Supabase.');
  console.log('⚠️  Los partidos tienen status=finished y datetime placeholder.');
  console.log('   Actualiza los resultados desde el panel de admin.');
}

main().catch(console.error);
