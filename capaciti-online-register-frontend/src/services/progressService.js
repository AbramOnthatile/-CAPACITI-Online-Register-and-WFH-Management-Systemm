import { progressEntries } from '../data/mockProgress';

export const getProgressEntries = async () => progressEntries;

export const createProgressEntry = async (payload) => ({
  success: true,
  entry: {
    ...payload,
    id: `prog-${Date.now()}`,
  },
});
