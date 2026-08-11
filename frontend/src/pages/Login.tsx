import { Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import ClerkSignIn from "../components/auth/ClerkSignIn";
import LoadingScreen from "../components/common/LoadingScreen";
import "./Login.css";

export default function Login() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <LoadingScreen />;
  if (isSignedIn) return <Navigate to="/redirect" replace />;

  return (
    <div className="login-page">
      <h1 className="login-page__logo">AK Textiles</h1>
      <p className="login-page__subtitle">Welcome Back</p>
      <ClerkSignIn />
    </div>
  );
}
