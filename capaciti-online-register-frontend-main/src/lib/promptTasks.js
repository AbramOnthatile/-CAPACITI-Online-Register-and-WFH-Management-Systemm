import { PromptStage, PromptStatus } from '../api/types';

export const MAX_TASKS = 10;

export const taskStatusOptions = [
  ['ON_TRACK', 'On track'],
  ['DONE', 'Done'],
  ['DELAYED', 'Delayed'],
  ['BLOCKED', 'Blocked'],
];

export const taskStatusLabel = Object.fromEntries(taskStatusOptions);

const stageOrder = [PromptStage.MORNING_KICKOFF, PromptStage.MIDDAY_PULSE, PromptStage.EOD_WRAP_UP];

export const sameTitle = (left, right) => left.trim().toLowerCase() === right.trim().toLowerCase();

// Tasks saved in a check-in response; older responses kept a plain "deliverables" list.
export function tasksFrom(response) {
  if (Array.isArray(response?.tasks)) {
    return response.tasks
      .filter((task) => typeof task?.title === 'string')
      .map((task) => ({ title: task.title, status: task.status ?? '', added: Boolean(task.added) }));
  }
  if (Array.isArray(response?.deliverables)) {
    return response.deliverables.filter((title) => typeof title === 'string').map((title) => ({ title, status: '', added: false }));
  }
  return [];
}

// What a midday or end-of-day check starts from: the latest earlier task list and the morning plan.
export function planFor(prompts, stage) {
  const earlier = prompts
    .filter((prompt) => prompt.status === PromptStatus.SUBMITTED && stageOrder.indexOf(prompt.stage) < stageOrder.indexOf(stage))
    .sort((left, right) => stageOrder.indexOf(left.stage) - stageOrder.indexOf(right.stage));
  const morning = earlier.find((prompt) => prompt.stage === PromptStage.MORNING_KICKOFF);
  const latest = earlier.at(-1);
  return {
    current: tasksFrom(latest?.response),
    morning: tasksFrom(morning?.response).map((task) => task.title),
    morningSubmitted: Boolean(morning),
  };
}
