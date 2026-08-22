import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Phone, Lock, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { getToken } from "../services/api";
import { login, register } from "../services/auth";
import "./Login.css";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [searchParams] = useSearchParams();

  const nextParam = searchParams.get("next");
  // Only ever follow an internal path (never "//host", a protocol-relative
  // open redirect) so this can't be abused to bounce off-site after login.
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;

  if (loggedIn) return <Navigate to={next ?? "/redirect"} replace />;

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
      <div className="login-page__hero">
        <div className="login-page__badge">AK</div>
        <h1 className="login-page__logo">AK Textiles</h1>
        <p className="login-page__subtitle">Quality Fabrics. Trusted by Generations.</p>
      </div>

      <div className="login-page__card">
        <h2 className="login-page__welcome">
          {mode === "login" ? (
            <>
              Welcome back! <span aria-hidden="true">👋</span>
            </>
          ) : (
            "Create your account"
          )}
        </h2>
        <p className="login-page__welcome-sub">
          {mode === "login" ? "Login to continue to your account" : "Sign up to get started"}
        </p>

        <form className="login-page__form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="login-page__field">
              <span className="login-page__field-label">Name</span>
              <div className="login-page__input-row">
                <input
                  className="login-page__input"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </label>
          )}

          <label className="login-page__field">
            <span className="login-page__field-label">Phone number</span>
            <div className="login-page__input-row">
              <Phone size={18} className="login-page__input-icon" />
              <span className="login-page__country-code">+91</span>
              <span className="login-page__divider" />
              <input
                className="login-page__input"
                placeholder="Enter 10-digit phone number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </label>

          <label className="login-page__field">
            <span className="login-page__field-label">Password</span>
            <div className="login-page__input-row">
              <Lock size={18} className="login-page__input-icon" />
              <input
                className="login-page__input"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-page__eye-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {mode === "login" && (
            <div className="login-page__row">
              <label className="login-page__remember">
                <span
                  className={`login-page__checkbox${rememberMe ? " login-page__checkbox--checked" : ""}`}
                  onClick={() => setRememberMe((v) => !v)}
                  role="checkbox"
                  aria-checked={rememberMe}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setRememberMe((v) => !v);
                    }
                  }}
                >
                  {rememberMe && <Check size={13} strokeWidth={3} />}
                </span>
                Remember me
              </label>
              <button type="button" className="login-page__forgot">
                Forgot password?
              </button>
            </div>
          )}

          {error && <p className="login-page__error">{error}</p>}

          <button className="login-page__submit" type="submit" disabled={submitting}>
            <span>{submitting ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}</span>
            {!submitting && <ArrowRight size={18} />}
          </button>
        </form>

        <button
          className="login-page__switch"
          onClick={() => {
            setMode((m) => (m === "login" ? "register" : "login"));
            setError(null);
          }}
        >
          {mode === "login" ? (
            <>
              Don&apos;t have an account? <span className="login-page__switch-accent">Sign up</span>
            </>
          ) : (
            <>
              Already have an account? <span className="login-page__switch-accent">Log in</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
