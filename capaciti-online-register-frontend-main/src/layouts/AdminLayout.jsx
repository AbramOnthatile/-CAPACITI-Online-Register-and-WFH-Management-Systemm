import {
  LayoutDashboard,
  Users,
  TicketCheck,
  ScrollText,
  FileBarChart,
  MapPin,
} from 'lucide-react';
import AppShell from './AppShell';

const navItems = [
  { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'User Directory', to: '/admin/users', icon: Users },
  { label: 'Blockers & Tickets', to: '/admin/escalations', icon: TicketCheck },
  { label: 'Audit Trail', to: '/admin/audit-log', icon: ScrollText },
  { label: 'Programme Reports', to: '/admin/reports', icon: FileBarChart },
  { label: 'Campus Settings', to: '/admin/campus', icon: MapPin },
];

const getPageInfo = (path) => {
  if (path.includes('dashboard')) return { title: 'Executive Operations', subtitle: 'User, attendance and support operations' };
  if (path.includes('users')) return { title: 'User Management', subtitle: 'Candidates, Tech Champions and administrative privileges' };
  if (path.includes('escalations')) return { title: 'Blockers & Tickets', subtitle: 'Support ticket tracking and resolution' };
  if (path.includes('audit-log')) return { title: 'System Audit Trail', subtitle: 'Immutable compliance logging and security tracking' };
  if (path.includes('campus')) return { title: 'Campus Settings', subtitle: 'On-site clock-in location and networks' };
  if (path.includes('reports')) return { title: 'Executive Analytics', subtitle: 'Attendance and WFH request summaries' };
  return { title: 'Administration Console', subtitle: 'CAPACITI Workforce Management' };
};

export const AdminLayout = () => (
  <AppShell
    navItems={navItems}
    homePath="/admin/dashboard"
    accent="navy"
    getPageInfo={getPageInfo}
  />
);

export default AdminLayout;
