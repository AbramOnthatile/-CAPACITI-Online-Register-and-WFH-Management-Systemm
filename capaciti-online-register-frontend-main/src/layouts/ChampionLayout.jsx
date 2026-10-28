import {
  LayoutDashboard,
  Users,
  Clock3,
  FileText,
  CheckCircle2,
  BarChart3,
  Megaphone,
  ClipboardList,
} from 'lucide-react';
import AppShell from './AppShell';

const navItems = [
  { label: 'Overview', to: '/champion/dashboard', icon: LayoutDashboard },
  { label: 'Candidates', to: '/champion/candidates', icon: Users },
  { label: 'Live Monitor', to: '/champion/attendance', icon: Clock3 },
  { label: 'WFH Review', to: '/champion/wfh', icon: FileText },
  { label: 'Check-ins', to: '/champion/progress', icon: CheckCircle2 },
  { label: 'Scorecards', to: '/champion/scorecards', icon: ClipboardList },
  { label: 'Reports', to: '/champion/reports', icon: BarChart3 },
  { label: 'Announcements', to: '/champion/announcements', icon: Megaphone },
];

const getPageInfo = (path) => {
  if (path.includes('dashboard')) return { title: 'Tech Champion Command', subtitle: 'Real-time candidate oversight & performance monitoring' };
  if (path.includes('candidates')) return { title: 'Candidate Directory', subtitle: 'View your assigned candidates' };
  if (path.includes('attendance')) return { title: 'Live Attendance Monitor', subtitle: 'Track recorded clock-ins and attendance statuses' };
  if (path.includes('wfh')) return { title: 'WFH Review Queue', subtitle: 'Review and approve remote working requests' };
  if (path.includes('progress')) return { title: 'Check-ins', subtitle: 'Review candidate check-in responses' };
  if (path.includes('reports')) return { title: 'Attendance & WFH Reports', subtitle: 'Attendance records and work-mode summaries' };
  if (path.includes('announcements')) return { title: 'Announcements', subtitle: 'Send updates to all active candidates' };
  if (path.includes('scorecards')) return { title: 'Mentor Scorecards', subtitle: 'Assess candidate progress and performance' };
  return { title: 'Tech Champion Panel', subtitle: 'CAPACITI Workforce Management' };
};

export const ChampionLayout = () => (
  <AppShell
    navItems={navItems}
    homePath="/champion/dashboard"
    accent="navy"
    getPageInfo={getPageInfo}
  />
);

export default ChampionLayout;
