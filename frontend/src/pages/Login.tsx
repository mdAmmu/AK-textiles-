import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "../services/api";
import { login, register } from "../services/auth";
import "./Login.css";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(!!getToken());

  if (loggedIn) return <Navigate to="/redirect" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(phone.trim(), password);
      } else {
        await register(name.trim(), phone.trim(), password);
      }
      setLoggedIn(true);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <h1 className="login-page__logo">AK Textiles</h1>
      <p className="login-page__subtitle">{mode === "login" ? "Welcome Back" : "Create your account"}</p>

      <form className="login-page__form" onSubmit={handleSubmit}>
        {mode === "register" && (
          <input
            className="login-page__input"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          className="login-page__input"
          placeholder="Phone number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          className="login-page__input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="login-page__error">{error}</p>}

        <button className="login-page__submit" type="submit" disabled={submitting}>
          {submitting ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}
        </button>
      </form>

      <button
        className="login-page__switch"
        onClick={() => {
          setMode((m) => (m === "login" ? "register" : "login"));
          setError(null);
        }}
      >
        {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
      </button>
    </div>
  );
}
