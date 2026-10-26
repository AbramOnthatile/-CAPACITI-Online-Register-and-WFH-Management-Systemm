import { UserRole } from '../api/types';

export const demoOnly = {
  notice: 'Demo sign-ins are available when mock mode is enabled.',
  demoAccounts: [
    { role: UserRole.CANDIDATE, title: 'Candidate', name: 'Aphiwe Ndlovu', email: 'candidate@capaciti.test', tag: 'Demo Candidate' },
    { role: UserRole.TECH_CHAMP, title: 'Tech Champion', name: 'Lerato Dlamini', email: 'champion@capaciti.test', tag: 'Demo Champion' },
    { role: UserRole.ADMIN, title: 'Administrator', name: 'Musa Zulu', email: 'admin@capaciti.test', tag: 'Demo Admin' },
  ],
};
