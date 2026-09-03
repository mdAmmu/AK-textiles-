import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import type { UserRole } from "../../types/user";
import LoadingScreen from "./LoadingScreen";

interface Props {
  role: UserRole | UserRole[];
  children: ReactNode;
}

export default function ProtectedRoute({ role, children }: Props) {
  const { user, loading } = useCurrentUser();
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/chat"} replace />;
  }

  return <>{children}</>;
}
