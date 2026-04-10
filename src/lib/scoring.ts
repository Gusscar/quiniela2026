export type ScoringResult = 0 | 1 | 3;

export function calculatePoints(
  predA: number | null,
  predB: number | null,
  actualA: number | undefined,
  actualB: number | undefined
): ScoringResult {
  if (predA === null || predB === null || actualA === undefined || actualB === undefined) {
    return 0;
  }

  if (predA === actualA && predB === actualB) {
    return 3;
  }

  const predWinner = predA - predB;
  const actualWinner = actualA - actualB;

  if (Math.sign(predWinner) === Math.sign(actualWinner) && predWinner !== 0) {
    return 1;
  }

  if (predWinner === 0 && actualWinner === 0) {
    return 1;
  }

  return 0;
}
