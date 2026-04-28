// reset-simulation.mjs — Limpia la simulacion: vuelve todos los partidos a "pending"
// Uso: node scripts/reset-simulation.mjs

import { createClient } from '../node_modules/@supabase/supabase-js/dist/index.mjs';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const env = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
    for (const line of env.split('\n')) {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    }
  } catch { /* ya están en el entorno */ }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables de entorno. Verifica .env.local');
  process.exit(1);
}

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
