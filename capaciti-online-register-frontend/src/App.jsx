import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/auth/Login';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import Attendance from './pages/candidate/Attendance';
import AttendanceHistory from './pages/candidate/AttendanceHistory';
import WFHRequests from './pages/candidate/WFHRequests';
import NewWFHRequest from './pages/candidate/NewWFHRequest';
import WFHDetails from './pages/candidate/WFHDetails';
import DailyProgress from './pages/candidate/DailyProgress';
import Notifications from './pages/candidate/Notifications';
import Profile from './pages/candidate/Profile';
import ChampionDashboard from './pages/champion/ChampionDashboard';
import Candidates from './pages/champion/Candidates';
import CandidateDetails from './pages/champion/CandidateDetails';
import AttendanceMonitor from './pages/champion/AttendanceMonitor';
import ChampionWFHRequests from './pages/champion/WFHRequests';
import WFHReview from './pages/champion/WFHReview';
import ProgressReview from './pages/champion/ProgressReview';
import ChampionReports from './pages/champion/Reports';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Escalations from './pages/admin/Escalations';
import AuditLog from './pages/admin/AuditLog';
import AdminReports from './pages/admin/Reports';
import ErrorPage from './pages/ErrorPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import { useAuth } from './context/AuthContext';
import { CandidateLayout, ChampionLayout, AdminLayout } from './layouts';
import { ProtectedRoute, RoleRoute } from './routes';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to={user ? `/${user.role}/dashboard` : '/login'} replace />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/candidate" element={<RoleRoute allowedRoles={['candidate']}><CandidateLayout /></RoleRoute>}>
          <Route path="dashboard" element={<CandidateDashboard />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="attendance/history" element={<AttendanceHistory />} />
          <Route path="wfh" element={<WFHRequests />} />
          <Route path="wfh/new" element={<NewWFHRequest />} />
          <Route path="wfh/:id" element={<WFHDetails />} />
          <Route path="progress" element={<DailyProgress />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="/champion" element={<RoleRoute allowedRoles={['tech-champion']}><ChampionLayout /></RoleRoute>}>
          <Route path="dashboard" element={<ChampionDashboard />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="candidates/:id" element={<CandidateDetails />} />
          <Route path="attendance" element={<AttendanceMonitor />} />
          <Route path="wfh" element={<ChampionWFHRequests />} />
          <Route path="wfh/:id" element={<WFHReview />} />
          <Route path="progress" element={<ProgressReview />} />
          <Route path="reports" element={<ChampionReports />} />
        </Route>

        <Route path="/admin" element={<RoleRoute allowedRoles={['admin']}><AdminLayout /></RoleRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="escalations" element={<Escalations />} />
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
