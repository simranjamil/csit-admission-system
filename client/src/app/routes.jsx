import { Routes, Route } from "react-router-dom";
import LandingPage from "../features/public/LandingPage";
import LoginPage from "../features/auth/LoginPage";
import NotFoundPage from "../errors/NotFoundPage";


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

