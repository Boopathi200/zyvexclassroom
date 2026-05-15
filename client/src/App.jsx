import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import AppShell from './components/AppShell.jsx';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const DashboardHome = lazy(() => import('./pages/DashboardHome.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'));
const ClassroomDetail = lazy(() => import('./pages/ClassroomDetail.jsx'));
const QuizTake = lazy(() => import('./pages/QuizTake.jsx'));
const SchedulePage = lazy(() => import('./pages/SchedulePage.jsx'));
const StudentAnalytics = lazy(() => import('./pages/StudentAnalytics.jsx'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings.jsx'));

function PageFallback() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center">
      <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );
}

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
    <Suspense fallback={<PageFallback />}>
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
    </Suspense>
  );
}
