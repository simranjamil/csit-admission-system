import { Routes, Route } from "react-router-dom";
import LandingPage from "../features/public/LandingPage";
import LoginPage from "../features/auth/LoginPage";
import AdminDashboardPage from "../features/dashboard/AdminDashboardPage";
import InterviewerDashboardPage from "../features/interviews/InterviewerDashboardPage";
import NotFoundPage from "../errors/NotFoundPage";
 
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/interviewer" element={<InterviewerDashboardPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}


