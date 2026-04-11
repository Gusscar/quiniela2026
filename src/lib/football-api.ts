// football-data.org API client for World Cup 2026
// Free tier: 10 req/min, covers WC
// Register at: https://www.football-data.org/client/register

const BASE_URL = 'https://api.football-data.org/v4';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY ?? '';

export type ApiMatchStatus = 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED';

export interface ApiMatch {
  id: number;
  utcDate: string;
  status: ApiMatchStatus;
  homeTeam: { id: number; name: string; shortName: string; tla: string };
  awayTeam: { id: number; name: string; shortName: string; tla: string };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
}

export async function fetchWCMatches(): Promise<ApiMatch[]> {
  const res = await fetch(`${BASE_URL}/competitions/WC/matches?season=2026`, {
    headers: { 'X-Auth-Token': API_KEY },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`football-data.org error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.matches as ApiMatch[];
}

// Map API status → our DB status
export function mapStatus(apiStatus: ApiMatchStatus): 'pending' | 'live' | 'finished' {
  switch (apiStatus) {
    case 'IN_PLAY':
    case 'PAUSED':
      return 'live';
    case 'FINISHED':
      return 'finished';
    default:
      return 'pending';
  }
}

// Normalize team name for fuzzy matching:
// removes accents, lowercases, trims common suffixes
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/\bfc\b|\bsc\b|\bcf\b/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

// English API name → possible Spanish/local DB names
// Used as fallback when normalization doesn't match directly
const NAME_ALIASES: Record<string, string[]> = {
  'brazil':           ['brasil'],
  'spain':            ['espana', 'españa'],
  'france':           ['francia'],
  'england':          ['inglaterra'],
  'germany':          ['alemania'],
  'netherlands':      ['paises bajos', 'holanda', 'holland'],
  'belgium':          ['belgica'],
  'italy':            ['italia'],
  'croatia':          ['croacia'],
  'switzerland':      ['suiza'],
  'denmark':          ['dinamarca'],
  'turkey':           ['turquia'],
  'greece':           ['grecia'],
  'hungary':          ['hungria'],
  'romania':          ['rumania'],
  'norway':           ['noruega'],
  'poland':           ['polonia'],
  'czech republic':   ['republica checa', 'czechia'],
  'czechia':          ['republica checa'],
  'united states':    ['estados unidos', 'usa'],
  'usa':              ['estados unidos'],
  'mexico':           ['mexico'],
  'canada':           ['canada'],
  'panama':           ['panama'],
  'costa rica':       ['costa rica'],
  'el salvador':      ['el salvador'],
  'trinidad and tobago': ['trinidad y tobago'],
  'peru':             ['peru'],
  'ecuador':          ['ecuador'],
  'colombia':         ['colombia'],
  'venezuela':        ['venezuela'],
  'chile':            ['chile'],
  'bolivia':          ['bolivia'],
  'paraguay':         ['paraguay'],
  'uruguay':          ['uruguay'],
  'argentina':        ['argentina'],
  'morocco':          ['marruecos'],
  'senegal':          ['senegal'],
  'egypt':            ['egipto'],
  'nigeria':          ['nigeria'],
  'ivory coast':      ['costa de marfil'],
  "cote d'ivoire":    ['costa de marfil'],
  'cameroon':         ['camerun'],
  'south africa':     ['sudafrica'],
  'south korea':      ['corea del sur', 'korea republic'],
  'korea republic':   ['corea del sur'],
  'iran':             ['iran'],
  'saudi arabia':     ['arabia saudita'],
  'australia':        ['australia'],
  'japan':            ['japon'],
  'indonesia':        ['indonesia'],
  'china':            ['china'],
  'uzbekistan':       ['uzbekistan'],
  'united arab emirates': ['emiratos arabes unidos', 'uae'],
  'qatar':            ['qatar'],
  'new zealand':      ['nueva zelanda'],
  'gabon':            ['gabon'],
};

// Given an API team name, return all normalized variants to try
export function getNameVariants(apiName: string): string[] {
  const base = normalizeName(apiName);
  const aliases = NAME_ALIASES[base] ?? [];
  return [base, ...aliases];
}
