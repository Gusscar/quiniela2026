// reset-simulation.mjs — Limpia la simulacion: vuelve todos los partidos a "pending"
// Uso: node scripts/reset-simulation.mjs

import { createClient } from '../node_modules/@supabase/supabase-js/dist/index.mjs';

const SUPABASE_URL = 'https://favkmffvexbnrlcmbrpo.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdmttZmZ2ZXhibnJsY21icnBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTcyMTE0MiwiZXhwIjoyMDkxMjk3MTQyfQ.j67dSQ1bGi5-NNyfbCXCnElXJ_9Bd0TbGkn6CUTibWo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('Obteniendo partidos...');
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id')
    .in('status', ['finished', 'live']);

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  if (matches.length === 0) {
    console.log('No hay partidos simulados para limpiar.');
    return;
  }

  console.log(`Limpiando ${matches.length} partidos...`);

  const ids = matches.map((m) => m.id);
  const { error: updateError } = await supabase
    .from('matches')
    .update({ status: 'pending', scorea: null, scoreb: null })
    .in('id', ids);

  if (updateError) {
    console.error('Error al limpiar:', updateError.message);
    process.exit(1);
  }

  console.log(`Listo. ${matches.length} partidos vueltos a "pending" con scores nulos.`);
  console.log('La quiniela esta lista para continuar normalmente.');
}

main();
