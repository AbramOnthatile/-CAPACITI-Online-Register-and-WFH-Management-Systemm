import { UserRole } from '../api/types';

export const demoOnly = {
  notice: 'Fills in the demo email. Enter the demo password to sign in.',
  demoAccounts: [
    { role: UserRole.CANDIDATE, title: 'Candidate', name: 'Aphiwe Ndlovu', email: 'candidate1@capaciti.com', tag: 'Demo Candidate' },
    { role: UserRole.TECH_CHAMP, title: 'Tech Champion', name: 'Lerato Dlamini', email: 'champ@capaciti.com', tag: 'Demo Champion' },
    { role: UserRole.ADMIN, title: 'Administrator', name: 'Musa Zulu', email: 'admin@capaciti.com', tag: 'Demo Admin' },
  ],
};
