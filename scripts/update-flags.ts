import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mapeo: nombre del equipo → código ISO 2 letras (flagcdn.com)
const FLAG_CODES: Record<string, string> = {
  'Algeria': 'dz',
  'Argentina': 'ar',
  'Australia': 'au',
  'Austria': 'at',
  'Belgium': 'be',
  'Bosnia-Herzegovina': 'ba',
  'Brazil': 'br',
  'Cabo Verde': 'cv',
  'Canada': 'ca',
  'Colombia': 'co',
  'Congo DR': 'cd',
  'Côte d\'Ivoire': 'ci',
  'Croatia': 'hr',
  'Curaçao': 'cw',
  'Czechia': 'cz',
  'Ecuador': 'ec',
  'Egypt': 'eg',
  'England': 'gb-eng',
  'France': 'fr',
  'Germany': 'de',
  'Ghana': 'gh',
  'Haiti': 'ht',
  'IR Iran': 'ir',
  'Iraq': 'iq',
  'Japan': 'jp',
  'Jordan': 'jo',
  'Korea Republic': 'kr',
  'Mexico': 'mx',
  'Morocco': 'ma',
  'Netherlands': 'nl',
  'New Zealand': 'nz',
  'Norway': 'no',
  'Panama': 'pa',
  'Paraguay': 'py',
  'Portugal': 'pt',
  'Qatar': 'qa',
  'Saudi Arabia': 'sa',
  'Scotland': 'gb-sct',
  'Senegal': 'sn',
  'South Africa': 'za',
  'Spain': 'es',
  'Sweden': 'se',
  'Switzerland': 'ch',
  'Tunisia': 'tn',
  'Turkey': 'tr',
  'Uruguay': 'uy',
  'USA': 'us',
  'Uzbekistan': 'uz',
};

function getFlagUrl(name: string): string {
  const code = FLAG_CODES[name];
  if (!code) {
    console.warn(`  ⚠️  Sin código para: ${name}`);
    return '';
  }
  return `https://flagcdn.com/w80/${code}.png`;
}

async function updateFlags() {
  console.log('🏳️  Actualizando banderas...\n');

  const { data: teams, error } = await supabase.from('teams').select('id, name');
  if (error) { console.error(error); process.exit(1); }

  let updated = 0;
  let skipped = 0;

  for (const team of teams!) {
    const flagUrl = getFlagUrl(team.name);
    if (!flagUrl) { skipped++; continue; }

    const { error: updateError } = await supabase
      .from('teams')
      .update({ flag_url: flagUrl })
      .eq('id', team.id);

    if (updateError) {
      console.error(`  ❌ Error en ${team.name}:`, updateError.message);
    } else {
      console.log(`  ✓ ${team.name}`);
      updated++;
    }
  }

  console.log(`\n✅ ${updated} banderas actualizadas, ${skipped} sin código.`);
}

updateFlags();
