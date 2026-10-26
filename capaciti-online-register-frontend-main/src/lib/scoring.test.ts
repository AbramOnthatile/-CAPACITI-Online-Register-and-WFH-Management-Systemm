import assert from 'node:assert/strict';
import test from 'node:test';
import type { CriterionScores } from '../api/scorecardTypes.ts';
import { overallPercent } from './scoring.ts';

test('overallPercent calculates the expected assessment percentage', () => {
  const scores: CriterionScores = {
    attendance: 5,
    communication: 3,
    accountability: 5,
    creativity: 3,
    delivery: 3,
    techSkills: 3,
  };

  assert.equal(overallPercent(scores), 73);
});

test('overallPercent returns null when any criterion has no score', () => {
  const scores: CriterionScores = {
    attendance: 5,
    communication: 3,
    accountability: 5,
    creativity: 3,
    delivery: 3,
    techSkills: null,
  };

  assert.equal(overallPercent(scores), null);
});

test('overallPercent rounds a half percentage up', () => {
  const scores: CriterionScores = {
    attendance: 5,
    communication: 5,
    accountability: 4,
    creativity: 3,
    delivery: 3.65,
    techSkills: 2,
  };

  assert.equal(overallPercent(scores), 76);
});
