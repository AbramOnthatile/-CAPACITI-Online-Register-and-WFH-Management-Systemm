import { wfhRequests } from '../data/mockWFH';

export const getWFHRequests = async () => wfhRequests;

export const createWFHRequest = async (payload) => ({
  success: true,
  request: {
    ...payload,
    id: `wfh-${Date.now()}`,
    status: 'Pending',
    reviewedBy: '—',
    submittedAt: new Date().toISOString(),
  },
});

export const updateWFHStatus = async (id, status, comment) => ({
  success: true,
  id,
  status,
  comment,
});
