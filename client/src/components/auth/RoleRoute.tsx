import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { AppRole } from "../../services/role.service";

export function RoleRoute({ allowedRoles }: { allowedRoles: AppRole[] }) {
  const { user, roles, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-shell">Loading permissions...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />;
  }

  if (!allowedRoles.some((role) => roles.includes(role))) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
