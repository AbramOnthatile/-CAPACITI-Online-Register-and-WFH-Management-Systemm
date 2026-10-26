import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/auth/Login';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import Attendance from './pages/candidate/Attendance';
import AttendanceHistory from './pages/candidate/AttendanceHistory';
import WFHRequests from './pages/candidate/WFHRequests';
import NewWFHRequest from './pages/candidate/NewWFHRequest';
import WFHDetails from './pages/candidate/WFHDetails';
import CandidateCheckIns from './pages/candidate/CheckIns';
import Notifications from './pages/candidate/Notifications';
import Profile from './pages/candidate/Profile';
import ChampionDashboard from './pages/champion/ChampionDashboard';
import Candidates from './pages/champion/Candidates';
import CandidateDetails from './pages/champion/CandidateDetails';
import AttendanceMonitor from './pages/champion/AttendanceMonitor';
import ChampionWFHRequests from './pages/champion/WFHRequests';
import WFHReview from './pages/champion/WFHReview';
import ChampionCheckIns from './pages/champion/CheckIns';
import ChampionReports from './pages/champion/Reports';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import BlockersTickets from './pages/admin/BlockersTickets';
import AuditLog from './pages/admin/AuditLog';
import AdminReports from './pages/admin/Reports';
import ErrorPage from './pages/ErrorPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import { useAuth } from './context/AuthContext';
import { CandidateLayout, ChampionLayout, AdminLayout } from './layouts';
import { ProtectedRoute, RoleRoute } from './routes';
import { UserRole } from './api/types';

function App() {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === UserRole.CANDIDATE) return '/candidate/dashboard';
    if (user.role === UserRole.TECH_CHAMP) return '/champion/dashboard';
    if (user.role === UserRole.ADMIN) return '/admin/dashboard';
    return '/login';
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to={getDashboardPath()} replace />} />

      <Route element={<ProtectedRoute />}>
        {/* Candidate Portal */}
        <Route
          path="/candidate"
          element={
            <RoleRoute allowedRoles={[UserRole.CANDIDATE]}>
              <CandidateLayout />
            </RoleRoute>
          }
        >
          <Route path="dashboard" element={<CandidateDashboard />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="attendance/history" element={<AttendanceHistory />} />
          <Route path="wfh" element={<WFHRequests />} />
          <Route path="wfh/new" element={<NewWFHRequest />} />
          <Route path="wfh/:id" element={<WFHDetails />} />
          <Route path="progress" element={<CandidateCheckIns />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Tech Champion Command */}
        <Route
          path="/champion"
          element={
            <RoleRoute allowedRoles={[UserRole.TECH_CHAMP]}>
              <ChampionLayout />
            </RoleRoute>
          }
        >
          <Route path="dashboard" element={<ChampionDashboard />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="candidates/:id" element={<CandidateDetails />} />
          <Route path="attendance" element={<AttendanceMonitor />} />
          <Route path="wfh" element={<ChampionWFHRequests />} />
          <Route path="wfh/:id" element={<WFHReview />} />
          <Route path="progress" element={<ChampionCheckIns />} />
          <Route path="reports" element={<ChampionReports />} />
        </Route>

        {/* Executive Administration */}
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminLayout />
            </RoleRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="escalations" element={<BlockersTickets />} />
          <Route path="audit-log" element={<AuditLog />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>
      </Route>

      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}

export default App;
