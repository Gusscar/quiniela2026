// simulate.mjs — Simula resultados de partidos con goles aleatorios
// Uso: node scripts/simulate.mjs
// Para limpiar: node scripts/reset-simulation.mjs

import { createClient } from '../node_modules/@supabase/supabase-js/dist/index.mjs';

const SUPABASE_URL = 'https://favkmffvexbnrlcmbrpo.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdmttZmZ2ZXhibnJsY21icnBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTcyMTE0MiwiZXhwIjoyMDkxMjk3MTQyfQ.j67dSQ1bGi5-NNyfbCXCnElXJ_9Bd0TbGkn6CUTibWo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function randomScore() {
  // Distribución más realista de goles: mayoría 0-3
  const weights = [30, 25, 20, 12, 7, 4, 2]; // 0,1,2,3,4,5,6 goles
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return 0;
}

async function main() {
  console.log('Obteniendo partidos...');
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, teama_id, teamb_id, status')
    .order('datetime');

  if (error) {
    console.error('Error al obtener partidos:', error.message);
    process.exit(1);
  }

  console.log(`Total de partidos: ${matches.length}`);

  const updates = matches.map((m) => ({
    id: m.id,
    status: 'finished',
    scorea: randomScore(),
    scoreb: randomScore(),
  }));

  // Actualizar de a uno (update por id)
  let updated = 0;
  for (const u of updates) {
    const { error: updateError } = await supabase
      .from('matches')
      .update({ status: u.status, scorea: u.scorea, scoreb: u.scoreb })
      .eq('id', u.id);

    if (updateError) {
      console.error(`Error al actualizar partido ${u.id}:`, updateError.message);
      process.exit(1);
    }
    updated++;
    if (updated % 10 === 0) console.log(`  Actualizados: ${updated}/${updates.length}`);
  }
  console.log(`  Actualizados: ${updated}/${updates.length}`);

  console.log('\n--- RESULTADOS SIMULADOS ---');
  // Mostrar resumen
  const { data: matchesWithTeams, error: e2 } = await supabase
    .from('matches')
    .select('id, scorea, scoreb, teama_id, teamb_id, teams!matches_teama_id_fkey(name), teams2:teams!matches_teamb_id_fkey(name)')
    .eq('status', 'finished')
    .order('datetime')
    .limit(20);

  if (!e2 && matchesWithTeams) {
    matchesWithTeams.forEach((m) => {
      const ta = m.teams?.name ?? m.teama_id;
      const tb = m.teams2?.name ?? m.teamb_id;
      console.log(`  ${ta} ${m.scorea} - ${m.scoreb} ${tb}`);
    });
    if (matches.length > 20) console.log(`  ... y ${matches.length - 20} partidos mas`);
  }

  console.log(`\nSimulacion completada. ${updated} partidos marcados como "finished".`);
  console.log('Abre la app para ver el ranking.');
  console.log('Para limpiar: node scripts/reset-simulation.mjs');
}

main();
