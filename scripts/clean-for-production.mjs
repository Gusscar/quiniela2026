// clean-for-production.mjs
// Limpia toda la data de prueba y deja la app lista para usuarios reales.
// Conserva: equipos, partidos (estructura), admin_users.
// Elimina: predicciones, perfiles de usuario de prueba, cuentas auth de prueba.
//
// Uso: node scripts/clean-for-production.mjs

import { createClient } from '../node_modules/@supabase/supabase-js/dist/index.mjs';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Leer .env.local
function loadEnv() {
  try {
    const env = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
    for (const line of env.split('\n')) {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    }
  } catch {
    console.error('❌ No se encontró .env.local');
    process.exit(1);
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🧹 Limpieza para producción\n');

  // ── 1. Obtener IDs de admins para no borrarlos ─────────────────────────────
  const { data: admins, error: adminErr } = await supabase
    .from('admin_users')
    .select('id');

  if (adminErr) { console.error('Error leyendo admins:', adminErr.message); process.exit(1); }

  const adminIds = admins.map(a => a.id);
  console.log(`🛡️  Admins protegidos: ${adminIds.length}`);

  // ── 2. Borrar todas las predicciones ──────────────────────────────────────
  const { error: predErr, count: predCount } = await supabase
    .from('predictions')
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // condición siempre verdadera

  if (predErr) { console.error('Error borrando predicciones:', predErr.message); process.exit(1); }
  console.log(`✅ Predicciones eliminadas: ${predCount ?? '?'}`);

  // ── 3. Borrar perfiles de usuarios no-admin ────────────────────────────────
  let profilesQuery = supabase.from('user_profiles').delete({ count: 'exact' });
  if (adminIds.length > 0) {
    profilesQuery = profilesQuery.not('id', 'in', `(${adminIds.join(',')})`);
  } else {
    profilesQuery = profilesQuery.neq('id', '00000000-0000-0000-0000-000000000000');
  }

  const { error: profErr, count: profCount } = await profilesQuery;
  if (profErr) { console.error('Error borrando perfiles:', profErr.message); process.exit(1); }
  console.log(`✅ Perfiles eliminados: ${profCount ?? '?'}`);

  // ── 4. Borrar cuentas auth de usuarios no-admin ────────────────────────────
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) { console.error('Error listando usuarios auth:', listErr.message); process.exit(1); }

  const toDelete = users.filter(u => !adminIds.includes(u.id));
  let deleted = 0;
  for (const u of toDelete) {
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (error) {
      console.warn(`  ⚠️  No se pudo borrar ${u.email}: ${error.message}`);
    } else {
      deleted++;
    }
  }
  console.log(`✅ Cuentas auth eliminadas: ${deleted}`);

  // ── 5. Resetear marcadores de partidos a pending ───────────────────────────
  const { error: matchErr, count: matchCount } = await supabase
    .from('matches')
    .update({ status: 'pending', scorea: null, scoreb: null })
    .in('status', ['finished', 'live']);

  if (matchErr) { console.error('Error reseteando partidos:', matchErr.message); }
  else console.log(`✅ Partidos reseteados a pending: ${matchCount ?? 0}`);

  console.log('\n🎉 Listo. La quiniela está limpia y lista para los participantes.');
  console.log('   Equipos y partidos intactos. Admins conservados.');
}

main().catch(err => { console.error(err); process.exit(1); });
