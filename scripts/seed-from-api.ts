import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const API_KEY = process.env.WC2026_API_KEY!;

function numToUuid(num: number): string {
  const hex = num.toString(16).padStart(32, '0');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

async function seedDatabase() {
  if (!API_KEY) {
    console.error('❌ Falta WC2026_API_KEY');
    process.exit(1);
  }

  console.log('🌱 Iniciando seed de datos...\n');

  try {
    console.log('📡 Obteniendo equipos...');
    const teamsResponse = await fetch('https://api.wc2026api.com/teams', {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });

    if (!teamsResponse.ok) {
      throw new Error(`Error: ${teamsResponse.status}`);
    }

    const teamsData = await teamsResponse.json();
    console.log(`   ✓ ${teamsData.length} equipos recibidos\n`);

    console.log('💾 Guardando equipos...');
    const teamsToInsert = teamsData.map((team: any) => ({
      id: numToUuid(team.id),
      name: team.name,
      group_letter: team.group_name,
      flag_url: team.flag_url || null,
      description: null
    }));

    const { error: teamsError } = await supabase.from('teams').upsert(teamsToInsert, {
      onConflict: 'id'
    });

    if (teamsError) throw teamsError;
    console.log(`   ✓ ${teamsToInsert.length} equipos guardados\n`);

    console.log('📡 Obteniendo partidos...');
    const matchesResponse = await fetch('https://api.wc2026api.com/matches?round=group', {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });

    if (!matchesResponse.ok) {
      throw new Error(`Error: ${matchesResponse.status}`);
    }

    const matchesData = await matchesResponse.json();
    console.log(`   ✓ ${matchesData.length} partidos recibidos\n`);

    console.log('💾 Guardando partidos...');
    const matchesToInsert = matchesData.map((match: any) => ({
      id: numToUuid(match.id),
      teama_id: numToUuid(match.home_team_id),
      teamb_id: numToUuid(match.away_team_id),
      datetime: match.kickoff_utc,
      group_letter: match.group_name,
      status: match.status === 'scheduled' ? 'pending' : match.status,
      scorea: match.home_score ?? null,
      scoreb: match.away_score ?? null
    }));

    const { error: matchesError } = await supabase.from('matches').upsert(matchesToInsert, {
      onConflict: 'id'
    });

    if (matchesError) {
      console.error('Error inserting matches:', matchesError);
      throw matchesError;
    }
    console.log(`   ✓ ${matchesToInsert.length} partidos guardados\n`);

    console.log('✅ Seed completado!');
    console.log(`   - ${teamsToInsert.length} equipos`);
    console.log(`   - ${matchesToInsert.length} partidos`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedDatabase();
