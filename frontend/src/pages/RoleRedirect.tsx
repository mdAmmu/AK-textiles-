import { Navigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import LoadingScreen from "../components/common/LoadingScreen";

export default function RoleRedirect() {
  const { user, loading, error } = useCurrentUser();

  if (loading) return <LoadingScreen />;
  if (error || !user) return <Navigate to="/login" replace />;

  return <Navigate to={user.role === "ADMIN" ? "/admin" : "/chat"} replace />;
}
