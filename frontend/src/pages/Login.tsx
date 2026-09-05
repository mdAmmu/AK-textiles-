import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Phone, Lock, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { getToken } from "../services/api";
import { login, register } from "../services/auth";

const FIELD = "flex flex-col gap-1.5";
const FIELD_LABEL = "text-[0.82rem] font-bold text-[#2563eb]";
const INPUT_ROW =
  "flex items-center gap-2.5 border-[1.5px] border-[var(--wa-border,#dbe6ff)] rounded-xl py-[0.7rem] px-3.5 bg-[var(--wa-panel-bg,#f7f8fa)] transition-[border-color,background] duration-150 ease-in-out focus-within:border-[#2563eb] focus-within:bg-[var(--wa-bubble-other,#ffffff)]";
const INPUT_ICON = "text-[#2563eb] shrink-0";
const INPUT = "flex-1 min-w-0 border-none outline-none bg-transparent text-base text-[var(--wa-text)] placeholder:text-[var(--wa-text-secondary)]";

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
    <div className="min-h-[100svh] flex flex-col items-stretch bg-[var(--wa-panel-bg)]">
      <div className="relative flex flex-col items-center gap-[0.4rem] pt-12 px-6 pb-[4.5rem] bg-[radial-gradient(120%_100%_at_20%_0%,#3b82f6_0%,#2563eb_45%,#1d4ed8_100%)] overflow-hidden">
        <div className="w-[76px] h-[76px] rounded-[20px] bg-white text-[#2563eb] flex items-center justify-center font-extrabold text-[1.7rem] tracking-[0.02em] shadow-[0_10px_24px_rgba(29,78,216,0.35)] mb-2 animate-[login-pop_0.55s_cubic-bezier(0.34,1.56,0.64,1)_both]">
          AK
        </div>
        <h1 className="m-0 text-white text-[1.9rem] font-extrabold animate-[login-rise_0.5s_ease_0.1s_both]">
          AK Textiles
        </h1>
        <p className="m-0 text-white/92 text-[0.95rem] animate-[login-rise_0.5s_ease_0.2s_both]">
          Quality Fabrics. Trusted by Generations.
        </p>
      </div>

      <div className="relative z-[1] flex-1 -mt-10 bg-[var(--wa-bubble-other,#ffffff)] rounded-t-[28px] pt-8 px-6 pb-10 animate-[login-rise_0.5s_ease_0.15s_both]">
        <h2 className="m-0 mb-1 text-2xl font-extrabold text-[var(--wa-text)] flex items-center gap-1.5">
          {mode === "login" ? (
            <>
              Welcome back! <span aria-hidden="true">👋</span>
            </>
          ) : (
            "Create your account"
          )}
        </h2>
        <p className="m-0 mb-6 text-[var(--wa-text-secondary)] text-[0.92rem]">
          {mode === "login" ? "Login to continue to your account" : "Sign up to get started"}
        </p>

        <form className="flex flex-col gap-[1.1rem] max-w-[400px]" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className={FIELD}>
              <span className={FIELD_LABEL}>Name</span>
              <div className={INPUT_ROW}>
                <input
                  className={INPUT}
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </label>
          )}

          <label className={FIELD}>
            <span className={FIELD_LABEL}>Phone number</span>
            <div className={INPUT_ROW}>
              <Phone size={18} className={INPUT_ICON} />
              <span className="text-base text-[var(--wa-text)] font-semibold shrink-0">+91</span>
              <span className="w-px self-stretch bg-[var(--wa-border,#dbe6ff)] shrink-0" />
              <input
                className={INPUT}
                placeholder="Enter 10-digit phone number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </label>

          <label className={FIELD}>
            <span className={FIELD_LABEL}>Password</span>
            <div className={INPUT_ROW}>
              <Lock size={18} className={INPUT_ICON} />
              <input
                className={INPUT}
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="border-none bg-transparent p-0 text-[var(--wa-text-secondary)] cursor-pointer flex items-center shrink-0"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {mode === "login" && (
            <div className="flex items-center justify-between -mt-1">
              <label className="flex items-center gap-2 text-[0.88rem] text-[var(--wa-text)] cursor-pointer select-none">
                <span
                  className={`w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center text-white cursor-pointer transition-[background,border-color] duration-150 ease-in-out ${
                    rememberMe
                      ? "bg-[#2563eb] border-[#2563eb]"
                      : "border-[var(--wa-border,#c9d4cf)]"
                  }`}
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
              <button
                type="button"
                className="border-none bg-transparent p-0 text-[#2563eb] text-[0.88rem] font-semibold cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && <p className="text-[#e53e3e] m-0 text-[0.85rem]">{error}</p>}

          <button
            className="flex items-center justify-center gap-2 py-[0.9rem] px-4 rounded-2xl border-none bg-[linear-gradient(135deg,#3b82f6,#2563eb)] text-white font-bold text-base cursor-pointer mt-1 transition-[transform,opacity] duration-100 ease-in-out active:scale-[0.98] disabled:opacity-70 disabled:cursor-default"
            type="submit"
            disabled={submitting}
          >
            <span>{submitting ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}</span>
            {!submitting && <ArrowRight size={18} />}
          </button>
        </form>

        <button
          className="block mt-[1.4rem] mx-auto bg-transparent border-none text-[var(--wa-text)] text-[0.9rem] cursor-pointer text-center"
          onClick={() => {
            setMode((m) => (m === "login" ? "register" : "login"));
            setError(null);
          }}
        >
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <span className="text-[#2563eb] font-bold">Sign up</span>
            </>
          ) : (
            <>
              Already have an account? <span className="text-[#2563eb] font-bold">Log in</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
