import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../../hooks/useAuth";


export default function RoleGuard({ role, permission }) {
  const { user } = useAuth();


  const hasRole = !role || user.roles.includes(role);
  const hasPermission = !permission || user.permissions.includes(permission);


  if (!hasRole || !hasPermission) return <Navigate to="/not-allowed" replace />;
  return <Outlet />;
}
