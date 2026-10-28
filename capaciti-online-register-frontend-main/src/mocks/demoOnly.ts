import { UserRole } from '../api/types';

export const demoOnly = {
  notice: 'Fills in the demo email. Enter the demo password to sign in.',
  demoAccounts: [
    { role: UserRole.CANDIDATE, title: 'Candidate', name: 'Aphiwe Ndlovu', email: 'candidate1@example.com', tag: 'Demo Candidate' },
    { role: UserRole.TECH_CHAMP, title: 'Tech Champion', name: 'Lerato Dlamini', email: 'champ@example.com', tag: 'Demo Champion' },
    { role: UserRole.ADMIN, title: 'Administrator', name: 'Musa Zulu', email: 'admin@example.com', tag: 'Demo Admin' },
  ],
};
