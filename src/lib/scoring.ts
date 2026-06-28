export type ScoringResult = 0 | 1 | 2 | 3 | 4;

// Fase de grupos: 3 pts exacto, 2 pts resultado correcto, 0 pts incorrecto
export function calculatePoints(
  predA: number | null,
  predB: number | null,
  actualA: number | undefined,
  actualB: number | undefined
): ScoringResult {
  if (predA === null || predB === null || actualA == null || actualB == null) return 0;

  if (predA === actualA && predB === actualB) return 3;

  const predResult = Math.sign(predA - predB);
  const actualResult = Math.sign(actualA - actualB);

  if (predResult === actualResult) return 2;

  return 0;
}

// Eliminatorias: 3 pts exacto, 2 pts resultado correcto, +1 si predijo empate y acertó quien avanza
export function calculateKnockoutPoints(
  predA: number | null,
  predB: number | null,
  predAdvancing: 'A' | 'B' | null | undefined,
  actualA: number | undefined,
  actualB: number | undefined,
  actualAdvancing: 'A' | 'B' | null | undefined
): ScoringResult {
  if (predA === null || predB === null || actualA == null || actualB == null) return 0;

  const exactScore = predA === actualA && predB === actualB;
  const predResult = Math.sign(predA - predB);   // -1 win B / 0 draw / 1 win A
  const actualResult = Math.sign(actualA - actualB);
  const correctResult = predResult === actualResult;

  let pts = 0;
  if (exactScore) pts = 3;
  else if (correctResult) pts = 2;
  else return 0;

  // +1 si el partido terminó empatado en 120 min y acertó el equipo que avanza
  if (actualResult === 0 && predResult === 0 && predAdvancing && actualAdvancing && predAdvancing === actualAdvancing) {
    pts += 1;
  }

  return pts as ScoringResult;
}
