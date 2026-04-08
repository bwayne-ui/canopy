// lib/grades.ts
// IC and Manager career hierarchy + entitlement comparison.
//
// Tracks:
//   IC track:    P1 (Associate)        < P2 (Sr Associate) < P3 (IC Manager)  < P4 (Sr IC Mgr) < P5 (Director IC)
//   Mgmt track:  M2 (Asst Manager)     < M3 (Manager)      < M4 (Sr Manager)  < M5 (Director)  < M6 (Sr Director)
//
// Approximate equivalence: M{n} ≈ P{n+1} (a brand-new manager at M2 sits roughly at the IC-Manager P3 level).
// The shared "weight" lets us compare across tracks: weight(P3) == weight(M2).

export type Grade = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6';

export const ALL_GRADES: Grade[] = ['P1', 'P2', 'P3', 'P4', 'P5', 'M2', 'M3', 'M4', 'M5', 'M6'];

export const GRADE_LABEL: Record<Grade, string> = {
  P1: 'P1 — Associate',
  P2: 'P2 — Sr Associate',
  P3: 'P3 — IC Manager',
  P4: 'P4 — Sr IC Manager',
  P5: 'P5 — Director (IC)',
  M2: 'M2 — Assistant Manager',
  M3: 'M3 — Manager',
  M4: 'M4 — Sr Manager',
  M5: 'M5 — Director',
  M6: 'M6 — Sr Director',
};

/**
 * Map a grade to a numeric weight for cross-track comparison.
 * P{n} → n. M{n} → n + 1 (so M2 ≈ P3, M3 ≈ P4, …).
 */
export function gradeWeight(grade: string | null | undefined): number {
  if (!grade) return 0;
  const m = grade.match(/^([PM])([1-9])$/);
  if (!m) return 0;
  const track = m[1];
  const level = Number(m[2]);
  return track === 'P' ? level : level + 1;
}

/**
 * Does `userGrade` satisfy a report's `minGrade` entitlement?
 * - null/empty minGrade → open to anyone with a grade.
 * - userGrade must be a valid grade.
 */
export function meetsEntitlement(userGrade: string | null | undefined, minGrade: string | null | undefined): boolean {
  if (!minGrade) return Boolean(userGrade);
  return gradeWeight(userGrade) >= gradeWeight(minGrade);
}
