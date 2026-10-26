import type { CriterionScores, ScoreCriterion } from '../api/scorecardTypes';

export const scoreCriteria: { key: ScoreCriterion; label: string }[] = [
  { key: 'attendance', label: 'Attendance' },
  { key: 'communication', label: 'Communication' },
  { key: 'accountability', label: 'Accountability' },
  { key: 'creativity', label: 'Creativity & Ownership' },
  { key: 'delivery', label: 'Project Delivery' },
  { key: 'techSkills', label: 'Tech Skills' },
];

export type ScoreTone = 'success' | 'light-success' | 'warning' | 'orange' | 'danger';

export function overallPercent(scores: CriterionScores): number | null {
  const values = scoreCriteria.map(({ key }) => scores[key]);
  const numericValues: number[] = [];
  for (const score of values) {
    if (typeof score !== 'number' || !Number.isFinite(score)) return null;
    numericValues.push(score);
  }
  return Math.round((numericValues.reduce((sum, score) => sum + score, 0) / 30) * 100);
}

export function scoreTone(score: number): ScoreTone {
  switch (score) {
    case 5: return 'success';
    case 4: return 'light-success';
    case 3: return 'warning';
    case 2: return 'orange';
    case 1: return 'danger';
    default: return 'danger';
  }
}

export function percentTone(percent: number): ScoreTone {
  if (percent >= 90) return 'success';
  if (percent >= 75) return 'light-success';
  if (percent >= 60) return 'warning';
  if (percent >= 40) return 'orange';
  return 'danger';
}
