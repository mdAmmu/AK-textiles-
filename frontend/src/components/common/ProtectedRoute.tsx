import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import LoadingScreen from "./LoadingScreen";

interface Props {
  role: "ADMIN" | "USER";
  children: ReactNode;
}

export default function ProtectedRoute({ role, children }: Props) {
  const { user, loading } = useCurrentUser();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/chat"} replace />;
  }

  return <>{children}</>;
}
