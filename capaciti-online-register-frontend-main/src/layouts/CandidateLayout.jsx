import {
  Award,
  Bell,
  CheckSquare,
  Clock3,
  History,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Menu,
} from 'lucide-react';
import PromptCheckInPopup from '../features/candidate/checkins/PromptCheckInPopup';
import AppShell from './AppShell';

const navItems = [
  { label: 'Dashboard', to: '/candidate/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', to: '/candidate/attendance', icon: Clock3, end: true },
  { label: 'History', to: '/candidate/attendance/history', icon: History },
  { label: 'WFH Requests', to: '/candidate/wfh', icon: Home },
  { label: 'Check-ins', to: '/candidate/progress', icon: CheckSquare },
  { label: 'Scorecards', to: '/candidate/scorecards', icon: Award },
  { label: 'Notifications', to: '/candidate/notifications', icon: Bell, showsUnread: true },
  { label: 'Support', to: '/candidate/support', icon: LifeBuoy },
];

const mobileTabs = [
  { label: 'Home', to: '/candidate/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', to: '/candidate/attendance', icon: Clock3 },
  { label: 'WFH', to: '/candidate/wfh', icon: Home },
  { label: 'Check-ins', to: '/candidate/progress', icon: CheckSquare },
  {
    label: 'More',
    to: '/candidate/more',
    icon: Menu,
    match: ['/candidate/more', '/candidate/notifications', '/candidate/support', '/candidate/profile', '/candidate/scorecards'],
  },
];

const getPageInfo = (path) => {
  if (path.includes('dashboard')) return { title: 'Home', subtitle: 'Attendance, check-ins & WFH hub' };
  if (path.includes('attendance/history')) return { title: 'Attendance History', subtitle: 'Timesheet records and work verification' };
  if (path.includes('attendance')) return { title: 'Attendance', subtitle: 'Clock in/out and review today’s record' };
  if (path.includes('wfh/new')) return { title: 'New WFH Request', subtitle: 'Apply for remote work approval' };
  if (path.includes('wfh/')) return { title: 'WFH Request', subtitle: 'Request details and review status' };
  if (path.includes('wfh')) return { title: 'WFH Requests', subtitle: 'Submit and track remote working applications' };
  if (path.includes('progress')) return { title: 'Check-ins', subtitle: 'Morning Kickoff, Midday Pulse & EOD Wrap-Up' };
  if (path.includes('notifications')) return { title: 'Notifications', subtitle: 'Programme announcements and request updates' };
  if (path.includes('support')) return { title: 'Support', subtitle: 'Create and track your support requests' };
  if (path.includes('profile')) return { title: 'My Profile', subtitle: 'Account and campus details' };
  if (path.includes('scorecards')) return { title: 'Scorecards', subtitle: 'Assessment results and mentor feedback' };
  if (path.includes('more')) return { title: 'More', subtitle: 'Everything else in your workspace' };
  return { title: 'Candidate Portal', subtitle: 'CAPACITI Workforce Management' };
};

export const CandidateLayout = () => (
  <>
    <AppShell
      navItems={navItems}
      homePath="/candidate/dashboard"
      accent="primary"
      profilePath="/candidate/profile"
      getPageInfo={getPageInfo}
      mobileTabs={mobileTabs}
    />
    <PromptCheckInPopup />
  </>
);

export default CandidateLayout;
