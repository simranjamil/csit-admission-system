import { Routes, Route } from "react-router-dom";
import LandingPage from "../features/public/LandingPage";
import LoginPage from "../features/auth/LoginPage";
import AdminDashboardPage from "../features/dashboard/AdminDashboardPage";
import UserManagementPage from "../features/admin/UserManagementPage";
import InterviewerDashboardPage from "../features/interviews/InterviewerDashboardPage";
import NotAllowedPage from "../errors/NotAllowedPage";
import NotFoundPage from "../errors/NotFoundPage";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import RoleGuard from "../components/layout/RoleGuard";
import AppShell from "../components/layout/AppShell";
 
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/not-allowed" element={<NotAllowedPage />} />
 
      {/* Logged-in pages */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* Admin area */}
          <Route element={<RoleGuard role="Admin" />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            {/* naye admin pages yahan add honge */}
          </Route>
 
          {/* Interviewer area */}
          <Route element={<RoleGuard permission="interview.submit" />}>
            <Route path="/interviewer" element={<InterviewerDashboardPage />} />
          </Route>
        </Route>
      </Route>
 
      {/* Baqi har unknown URL */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
