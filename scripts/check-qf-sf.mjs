import { createClient } from '../node_modules/@supabase/supabase-js/dist/index.mjs';
import { readFileSync } from 'fs';

const envContent = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line.startsWith('#') || !line.includes('=')) return;
  const [key, ...val] = line.split('=');
  env[key.trim()] = val.join('=').trim();
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: teams } = await sb.from('teams').select('id, name');
const teamMap = new Map(teams.map(t => [t.id, t.name]));

const { data: matches } = await sb.from('matches').select('*').in('group_letter', ['Q', 'S', 'T', 'N', 'R']).order('datetime');

for (const m of matches) {
  console.log(`[${m.group_letter}] id=${m.id} ${m.datetime} :: ${teamMap.get(m.teama_id)} vs ${teamMap.get(m.teamb_id)} -- score: ${m.scorea ?? '?'}-${m.scoreb ?? '?'} venue=${m.venue ?? m.city ?? ''}`);
}
