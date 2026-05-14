import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import AppShell from './components/AppShell.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import DashboardHome from './pages/DashboardHome.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import ClassroomDetail from './pages/ClassroomDetail.jsx';
import QuizTake from './pages/QuizTake.jsx';
import SchedulePage from './pages/SchedulePage.jsx';
import StudentAnalytics from './pages/StudentAnalytics.jsx';
import ProfileSettings from './pages/ProfileSettings.jsx';

function AdminPage() {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <AdminDashboard />;
}

function StudentAnalyticsGate() {
  const { user } = useAuth();
  if (user?.role !== 'student') return <Navigate to="/dashboard" replace />;
  return <StudentAnalytics />;
}

export default function App() {
  const { user, ready } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/dashboard/admin" element={<AdminPage />} />
          <Route path="/dashboard/schedule" element={<SchedulePage />} />
          <Route path="/dashboard/analytics" element={<StudentAnalyticsGate />} />
          <Route path="/dashboard/notifications" element={<NotificationsPage />} />
          <Route path="/dashboard/settings" element={<ProfileSettings />} />
          <Route path="/dashboard/classrooms/:id" element={<ClassroomDetail />} />
          <Route path="/dashboard/classrooms/:id/quiz/:quizId" element={<QuizTake />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ready && user ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
}
