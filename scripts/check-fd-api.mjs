import { readFileSync } from 'fs';

const envContent = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line.startsWith('#') || !line.includes('=')) return;
  const [key, ...val] = line.split('=');
  env[key.trim()] = val.join('=').trim();
});

const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches?season=2026', {
  headers: { 'X-Auth-Token': env.FOOTBALL_DATA_API_KEY },
});

if (!res.ok) {
  console.error('Error', res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
const matches = data.matches ?? [];
console.log('Total matches:', matches.length);

// Show quarterfinal / semifinal stage matches
const relevant = matches.filter(m => ['QUARTER_FINALS', 'SEMI_FINALS', 'FINAL', 'THIRD_PLACE'].includes(m.stage));
for (const m of relevant) {
  console.log(`[${m.stage}] ${m.utcDate} :: ${m.homeTeam?.name} vs ${m.awayTeam?.name} -- status=${m.status} score=${m.score?.fullTime?.home ?? '?'}-${m.score?.fullTime?.away ?? '?'}`);
}
