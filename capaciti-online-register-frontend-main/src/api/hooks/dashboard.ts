import { apiClient } from '../client';
import { UserRole, type CandidateDashboardDto, type ChampionDashboardDto } from '../types';
import { mockAttendance, mockPrompts, mockTickets, mockWfhRequests } from '../../mocks/entities';
import { readMockCollection } from '../../mocks/storage';
import { useApiQuery } from './shared';

export const dashboardKeys = {
  candidate: ['dashboard', UserRole.CANDIDATE] as const,
  champion: ['dashboard', UserRole.TECH_CHAMP] as const,
};

export function useDashboardApi(role: UserRole.CANDIDATE | UserRole.TECH_CHAMP, enabled = true) {
  const candidate = role === UserRole.CANDIDATE;
  const key = candidate ? dashboardKeys.candidate : dashboardKeys.champion;
  const query = useApiQuery<CandidateDashboardDto | ChampionDashboardDto>(
    key,
    () => apiClient.get<CandidateDashboardDto | ChampionDashboardDto>(`/dashboard/${candidate ? 'candidate' : 'champion'}`),
    () => {
      if (candidate) {
        const attendance = readMockCollection('attendance', mockAttendance);
        const wfh = readMockCollection('wfh-requests', mockWfhRequests);
        const prompts = readMockCollection('prompts:demo', mockPrompts);
        const tickets = readMockCollection('tickets', mockTickets);
        return {
          serverTime: new Date().toISOString(),
          today: attendance[0] ?? null,
          recentAttendance: attendance,
          currentWfh: wfh[0] ?? null,
          recentWfhRequests: wfh,
          promptsToday: prompts,
          openTickets: tickets.filter((ticket) => ticket.status === 'OPEN').length,
          prolongedTickets: tickets.filter((ticket) => ticket.isProlonged).length,
        };
      }
      return {
        date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date()),
        serverTime: new Date().toISOString(),
        expectedCandidates: 0,
        clockedIn: 0,
        onTime: 0,
        late: 0,
        absent: 0,
        notYetClockedIn: 0,
        onSite: 0,
        wfh: 0,
        wfhApprovedToday: 0,
        pendingWfhRequests: 0,
        openTickets: 0,
        prolongedBlockers: 0,
        promptsSubmitted: 0,
        promptsMissed: 0,
        aiFlaggedToday: 0,
        needsAttention: [],
      };
    },
    { enabled },
  );
  return { ...query, loading: query.isLoading, refresh: async () => { await query.refetch(); } };
}
