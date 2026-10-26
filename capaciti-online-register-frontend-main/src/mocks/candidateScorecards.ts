import type { MyScorecardDto } from '../api/scorecardTypes';

const myScorecards: MyScorecardDto[] = [
  {
    assessmentId: 'my-week-2026-10-23',
    title: 'Weekly Scorecard — 19 October',
    type: 'WEEKLY',
    assessmentDate: '2026-10-23',
    scores: { attendance: 5, communication: 4, accountability: 4, creativity: 3, delivery: 4, techSkills: 4 },
    overallPercent: 80,
    feedbackStrengths: 'Communicates progress clearly and collaborates well with the team.',
    feedbackImprovements: 'Break larger tasks into smaller milestones and share progress regularly.',
    feedback: 'Keep building on this progress and raise any blockers early.',
    groupFeedback: 'The cohort showed steady progress this week. Continue sharing blockers early and reviewing work with peers.',
  },
  {
    assessmentId: 'my-week-2026-10-16',
    title: 'Weekly Scorecard — 12 October',
    type: 'WEEKLY',
    assessmentDate: '2026-10-16',
    scores: { attendance: 4, communication: 4, accountability: 3, creativity: 4, delivery: 3, techSkills: 4 },
    overallPercent: 73,
    feedbackStrengths: 'Shows curiosity and asks useful questions during team sessions.',
    feedbackImprovements: 'Share delivery risks earlier so the team can help remove blockers.',
    feedback: 'Good progress this week. Continue applying feedback to project tasks.',
    groupFeedback: 'Good collaboration across the group. Next week, focus on breaking delivery goals into smaller milestones.',
  },
  {
    assessmentId: 'my-project-2026-10-09',
    title: 'Project Foundations Review',
    type: 'PROJECT',
    assessmentDate: '2026-10-09',
    scores: { attendance: 4, communication: 3, accountability: 4, creativity: 4, delivery: 3, techSkills: 3 },
    overallPercent: 70,
    feedbackStrengths: 'Takes ownership of assigned tasks and contributes ideas.',
    feedbackImprovements: 'Practice explaining technical decisions and documenting key choices.',
    feedback: 'A positive project checkpoint. Keep a steady pace and ask for review early.',
    groupFeedback: 'Candidates demonstrated a positive start to the month. Maintain consistent attendance and communication.',
  },
];

const mockCandidateId = 'user-candidate-1';

export function getMockMyScorecards(candidateId: string | undefined): MyScorecardDto[] {
  return candidateId === mockCandidateId ? myScorecards.map((scorecard) => ({
    ...scorecard,
    scores: { ...scorecard.scores },
  })) : [];
}
