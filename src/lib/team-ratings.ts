// Reference statistics for World Cup 2026 teams
// Based on FIFA rankings and qualifying campaign performance
// Attack: goals scored per game in qualifying (normalized 0-100)
// Defense: solidity (100 = conceded 0, lower = conceded more)
// Form: last 10 games record in qualifying

export interface TeamRating {
  fifa_rank: number;
  attack: number;    // 0-100
  defense: number;   // 0-100
  form: ('W' | 'D' | 'L')[];  // last 5 results
}

const ratings: Record<string, TeamRating> = {
  // South America
  Argentina:    { fifa_rank: 1,  attack: 82, defense: 78, form: ['W','W','W','D','W'] },
  Brasil:       { fifa_rank: 5,  attack: 80, defense: 80, form: ['W','W','D','W','W'] },
  Colombia:     { fifa_rank: 9,  attack: 74, defense: 70, form: ['W','W','W','D','W'] },
  Uruguay:      { fifa_rank: 16, attack: 68, defense: 75, form: ['W','D','W','W','L'] },
  Ecuador:      { fifa_rank: 32, attack: 60, defense: 62, form: ['W','L','W','D','W'] },
  Paraguay:     { fifa_rank: 48, attack: 52, defense: 55, form: ['W','D','L','W','D'] },
  Venezuela:    { fifa_rank: 59, attack: 55, defense: 58, form: ['W','W','D','W','L'] },
  Chile:        { fifa_rank: 60, attack: 54, defense: 53, form: ['L','D','W','L','W'] },
  Bolivia:      { fifa_rank: 85, attack: 42, defense: 40, form: ['L','W','D','L','D'] },
  Perú:         { fifa_rank: 70, attack: 48, defense: 50, form: ['D','L','W','D','L'] },

  // CONCACAF
  México:       { fifa_rank: 15, attack: 70, defense: 65, form: ['W','W','D','W','W'] },
  'Estados Unidos': { fifa_rank: 11, attack: 72, defense: 68, form: ['W','W','W','D','W'] },
  Canadá:       { fifa_rank: 38, attack: 62, defense: 64, form: ['W','D','W','W','D'] },
  Panamá:       { fifa_rank: 43, attack: 55, defense: 60, form: ['W','D','W','L','W'] },
  Honduras:     { fifa_rank: 78, attack: 45, defense: 48, form: ['D','W','L','W','D'] },
  Jamaica:      { fifa_rank: 55, attack: 50, defense: 52, form: ['W','D','L','D','W'] },
  'El Salvador': { fifa_rank: 72, attack: 44, defense: 50, form: ['D','W','D','L','W'] },
  'Costa Rica': { fifa_rank: 49, attack: 50, defense: 55, form: ['W','D','W','D','L'] },
  'Trinidad y Tobago': { fifa_rank: 96, attack: 38, defense: 40, form: ['L','D','W','L','D'] },
  Guatemala:    { fifa_rank: 109, attack: 40, defense: 42, form: ['D','W','L','D','W'] },

  // Europe
  España:       { fifa_rank: 2,  attack: 88, defense: 85, form: ['W','W','W','W','D'] },
  Francia:      { fifa_rank: 3,  attack: 86, defense: 83, form: ['W','W','D','W','W'] },
  Inglaterra:   { fifa_rank: 4,  attack: 84, defense: 80, form: ['W','W','W','D','W'] },
  Alemania:     { fifa_rank: 12, attack: 76, defense: 73, form: ['W','D','W','W','D'] },
  Portugal:     { fifa_rank: 6,  attack: 83, defense: 74, form: ['W','W','W','D','W'] },
  'Países Bajos': { fifa_rank: 7, attack: 78, defense: 72, form: ['W','W','D','W','D'] },
  Bélgica:      { fifa_rank: 14, attack: 73, defense: 70, form: ['W','D','W','W','L'] },
  Italia:       { fifa_rank: 8,  attack: 72, defense: 78, form: ['W','W','D','W','D'] },
  Croacia:      { fifa_rank: 10, attack: 68, defense: 74, form: ['W','D','W','D','W'] },
  Austria:      { fifa_rank: 23, attack: 64, defense: 65, form: ['W','W','D','W','D'] },
  Dinamarca:    { fifa_rank: 19, attack: 66, defense: 68, form: ['W','W','D','D','W'] },
  Suiza:        { fifa_rank: 18, attack: 65, defense: 70, form: ['W','W','D','W','D'] },
  Escocia:      { fifa_rank: 35, attack: 58, defense: 60, form: ['W','D','W','D','W'] },
  Turquía:      { fifa_rank: 26, attack: 63, defense: 60, form: ['W','D','W','W','L'] },
  Grecia:       { fifa_rank: 46, attack: 52, defense: 58, form: ['D','W','W','D','W'] },
  Serbia:       { fifa_rank: 30, attack: 60, defense: 58, form: ['W','W','D','L','W'] },
  'República Checa': { fifa_rank: 34, attack: 56, defense: 60, form: ['W','D','W','D','L'] },
  Hungría:      { fifa_rank: 31, attack: 57, defense: 58, form: ['D','W','W','D','L'] },
  Rumanía:      { fifa_rank: 47, attack: 52, defense: 55, form: ['W','D','D','W','W'] },
  Noruega:      { fifa_rank: 28, attack: 62, defense: 60, form: ['W','W','W','D','D'] },
  Polonia:      { fifa_rank: 22, attack: 60, defense: 62, form: ['D','W','W','L','W'] },
  Albania:      { fifa_rank: 63, attack: 48, defense: 50, form: ['W','D','L','W','D'] },

  // Africa
  Marruecos:    { fifa_rank: 13, attack: 70, defense: 78, form: ['W','W','W','D','W'] },
  Senegal:      { fifa_rank: 20, attack: 65, defense: 68, form: ['W','W','D','W','D'] },
  Egipto:       { fifa_rank: 37, attack: 60, defense: 65, form: ['W','D','W','W','D'] },
  Nigeria:      { fifa_rank: 39, attack: 62, defense: 58, form: ['W','W','D','L','W'] },
  Mali:         { fifa_rank: 50, attack: 55, defense: 55, form: ['W','W','D','W','D'] },
  'Costa de Marfil': { fifa_rank: 41, attack: 60, defense: 58, form: ['W','D','W','W','L'] },
  Camerún:      { fifa_rank: 44, attack: 58, defense: 55, form: ['D','W','W','D','W'] },
  'Sudáfrica':  { fifa_rank: 52, attack: 52, defense: 54, form: ['W','D','D','W','L'] },
  Tanzania:     { fifa_rank: 104, attack: 40, defense: 42, form: ['L','W','D','L','W'] },
  Uganda:       { fifa_rank: 91, attack: 42, defense: 44, form: ['D','W','L','D','W'] },
  Angola:       { fifa_rank: 81, attack: 44, defense: 46, form: ['W','D','L','W','D'] },
  Mozambique:   { fifa_rank: 127, attack: 36, defense: 38, form: ['L','D','W','L','D'] },
  Gabón:        { fifa_rank: 82, attack: 44, defense: 46, form: ['D','W','D','L','W'] },

  // Asia
  Japón:        { fifa_rank: 17, attack: 72, defense: 70, form: ['W','W','W','D','W'] },
  'Corea del Sur': { fifa_rank: 21, attack: 68, defense: 65, form: ['W','W','D','W','D'] },
  Irán:         { fifa_rank: 25, attack: 62, defense: 66, form: ['W','D','W','W','D'] },
  'Arabia Saudita': { fifa_rank: 58, attack: 55, defense: 58, form: ['W','D','W','D','L'] },
  Australia:    { fifa_rank: 23, attack: 60, defense: 60, form: ['W','W','D','W','D'] },
  Qatar:        { fifa_rank: 37, attack: 50, defense: 52, form: ['W','D','W','L','D'] },
  Uzbekistán:   { fifa_rank: 67, attack: 52, defense: 54, form: ['W','W','D','D','W'] },
  'Emiratos Árabes Unidos': { fifa_rank: 66, attack: 48, defense: 52, form: ['D','W','D','W','L'] },
  China:        { fifa_rank: 92, attack: 42, defense: 45, form: ['L','D','W','L','D'] },
  Indonesia:    { fifa_rank: 130, attack: 35, defense: 38, form: ['L','L','D','W','L'] },

  // Oceania
  'Nueva Zelanda': { fifa_rank: 95, attack: 44, defense: 46, form: ['W','D','W','D','L'] },
};

// Aliases to handle English or variant names from the DB
const aliases: Record<string, string> = {
  // English → Spanish key
  'brazil': 'Brasil',
  'spain': 'España',
  'france': 'Francia',
  'england': 'Inglaterra',
  'germany': 'Alemania',
  'portugal': 'Portugal',
  'netherlands': 'Países Bajos',
  'holland': 'Países Bajos',
  'belgium': 'Bélgica',
  'italy': 'Italia',
  'croatia': 'Croacia',
  'switzerland': 'Suiza',
  'denmark': 'Dinamarca',
  'austria': 'Austria',
  'turkey': 'Turquía',
  'greece': 'Grecia',
  'serbia': 'Serbia',
  'hungary': 'Hungría',
  'romania': 'Rumanía',
  'norway': 'Noruega',
  'poland': 'Polonia',
  'albania': 'Albania',
  'scotland': 'Escocia',
  'czech republic': 'República Checa',
  'czechia': 'República Checa',
  'mexico': 'México',
  'united states': 'Estados Unidos',
  'usa': 'Estados Unidos',
  'canada': 'Canadá',
  'panama': 'Panamá',
  'honduras': 'Honduras',
  'jamaica': 'Jamaica',
  'el salvador': 'El Salvador',
  'costa rica': 'Costa Rica',
  'trinidad and tobago': 'Trinidad y Tobago',
  'guatemala': 'Guatemala',
  'argentina': 'Argentina',
  'colombia': 'Colombia',
  'uruguay': 'Uruguay',
  'ecuador': 'Ecuador',
  'paraguay': 'Paraguay',
  'venezuela': 'Venezuela',
  'chile': 'Chile',
  'bolivia': 'Bolivia',
  'peru': 'Perú',
  'morocco': 'Marruecos',
  'senegal': 'Senegal',
  'egypt': 'Egipto',
  'nigeria': 'Nigeria',
  'mali': 'Mali',
  'ivory coast': 'Costa de Marfil',
  "cote d'ivoire": 'Costa de Marfil',
  'cameroon': 'Camerún',
  'south africa': 'Sudáfrica',
  'tanzania': 'Tanzania',
  'uganda': 'Uganda',
  'angola': 'Angola',
  'mozambique': 'Mozambique',
  'gabon': 'Gabón',
  'japan': 'Japón',
  'south korea': 'Corea del Sur',
  'korea republic': 'Corea del Sur',
  'iran': 'Irán',
  'saudi arabia': 'Arabia Saudita',
  'australia': 'Australia',
  'qatar': 'Qatar',
  'uzbekistan': 'Uzbekistán',
  'united arab emirates': 'Emiratos Árabes Unidos',
  'uae': 'Emiratos Árabes Unidos',
  'china': 'China',
  'indonesia': 'Indonesia',
  'new zealand': 'Nueva Zelanda',
};

export function getTeamRating(teamName: string): TeamRating | null {
  // Direct match first
  if (ratings[teamName]) return ratings[teamName];
  // Case-insensitive alias lookup
  const key = aliases[teamName.toLowerCase()];
  if (key && ratings[key]) return ratings[key];
  // Case-insensitive direct match
  const lower = teamName.toLowerCase();
  const directKey = Object.keys(ratings).find((k) => k.toLowerCase() === lower);
  if (directKey) return ratings[directKey];
  return null;
}
