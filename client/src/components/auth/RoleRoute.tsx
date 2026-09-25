import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { AppRole } from "../../services/role.service";

export function RoleRoute({ allowedRoles }: { allowedRoles: AppRole[] }) {
  const { user, roles, loading } = useAuth();

  if (loading) {
    return <div className="page-shell">Loading permissions...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.some((role) => roles.includes(role))) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
