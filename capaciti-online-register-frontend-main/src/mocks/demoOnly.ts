import { UserRole } from '../api/types';

// Same accounts and names as the backend DemoDataSeeder.
// VITE_DEMO_PASSWORD is the seeder's SEED_PASSWORD; set it in .env.local, never in a committed file.
export const demoOnly = {
  password: import.meta.env.VITE_DEMO_PASSWORD?.trim() || '',
  notice: 'Fills in the demo email. Enter the demo password to sign in.',
  demoAccounts: [
    { role: UserRole.CANDIDATE, title: 'Candidate', name: 'Candidate 1', email: 'candidate1@capaciti.com' },
    { role: UserRole.TECH_CHAMP, title: 'Tech Champion', name: 'Demo Champion', email: 'champ@capaciti.com' },
    { role: UserRole.ADMIN, title: 'Administrator', name: 'Demo Admin', email: 'admin@capaciti.com' },
  ],
};
