import {
  LayoutDashboard,
  Users,
  TicketCheck,
  ScrollText,
  FileBarChart,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStatusMetadata } from '../lib/status';
import AppShell from './AppShell';

const navItems = [
  { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'User Directory', to: '/admin/users', icon: Users },
  { label: 'Blockers & Tickets', to: '/admin/escalations', icon: TicketCheck },
  { label: 'Audit Trail', to: '/admin/audit-log', icon: ScrollText },
  { label: 'Programme Reports', to: '/admin/reports', icon: FileBarChart },
];

const getPageInfo = (path) => {
  if (path.includes('dashboard')) return { title: 'Executive Operations', subtitle: 'User, attendance and support operations' };
  if (path.includes('users')) return { title: 'User Management', subtitle: 'Candidates, Tech Champions and administrative privileges' };
  if (path.includes('escalations')) return { title: 'Blockers & Tickets', subtitle: 'Support ticket tracking and resolution' };
  if (path.includes('audit-log')) return { title: 'System Audit Trail', subtitle: 'Immutable compliance logging and security tracking' };
  if (path.includes('reports')) return { title: 'Executive Analytics', subtitle: 'Attendance and WFH request summaries' };
  return { title: 'Administration Console', subtitle: 'CAPACITI Workforce Management' };
};

export const AdminLayout = () => {
  const { user } = useAuth();
  return (
    <AppShell
      navItems={navItems}
      homePath="/admin/dashboard"
      accent="navy"
      workspace={{ label: 'Administration', icon: Sliders, detail: user?.email }}
      roleLabel={user ? getStatusMetadata(user.role).label : ''}
      getPageInfo={getPageInfo}
    />
  );
};

export default AdminLayout;
