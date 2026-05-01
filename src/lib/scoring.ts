export type ScoringResult = 0 | 1 | 2 | 3;

export function calculatePoints(
  predA: number | null,
  predB: number | null,
  actualA: number | undefined,
  actualB: number | undefined
): ScoringResult {
  if (predA === null || predB === null || actualA == null || actualB == null) {
    return 0;
  }

  // Exact score match (3 pts) — covers both wins and draws
  if (predA === actualA && predB === actualB) {
    return 3;
  }

  const predResult = Math.sign(predA - predB);   // -1 / 0 / 1
  const actualResult = Math.sign(actualA - actualB);

  // Correct winner (non-draw), wrong score → 2 pts
  if (predResult !== 0 && predResult === actualResult) {
    return 2;
  }

  // Predicted draw + actual draw, wrong exact score → 1 pt
  if (predResult === 0 && actualResult === 0) {
    return 1;
  }

  return 0;
}
