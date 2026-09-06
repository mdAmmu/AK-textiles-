import { useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Navigate } from "react-router-dom";
import { Eye, EyeOff, MessageCircle } from "lucide-react";
import { getToken } from "../services/api";
import { login } from "../services/auth";

const PHONE_LENGTH = 10;

export default function Login() {
  const [digits, setDigits] = useState<string[]>(Array(PHONE_LENGTH).fill(""));
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const boxRefs = useRef<Array<HTMLInputElement | null>>([]);

  if (loggedIn) return <Navigate to="/redirect" replace />;

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    if (clean && index < PHONE_LENGTH - 1) {
      boxRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      boxRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PHONE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(PHONE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    boxRefs.current[Math.min(pasted.length, PHONE_LENGTH - 1)]?.focus();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const phone = digits.join("");
    if (phone.length < PHONE_LENGTH) {
      setError("Please enter your full 10-digit mobile number.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(phone, password);
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
    <div className="relative min-h-[100svh] bg-white overflow-hidden flex flex-col items-center px-6 pt-12 pb-16">
      <svg
        className="pointer-events-none absolute -top-16 -right-20 w-72 h-72 text-[#ede9fe]"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="98" stroke="currentColor" strokeWidth="1" />
        <circle cx="100" cy="100" r="76" stroke="currentColor" strokeWidth="1" />
        <circle cx="100" cy="100" r="54" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg
        className="pointer-events-none absolute -bottom-24 -left-20 w-80 h-80 text-[#ede9fe]"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="98" stroke="currentColor" strokeWidth="1" />
        <circle cx="100" cy="100" r="76" stroke="currentColor" strokeWidth="1" />
      </svg>

      <div className="relative z-[1] flex flex-col items-center gap-1 mb-2">
        <img src="/ak-logo.png" alt="A.K Textiles" className="w-16 h-16 object-contain mb-1" />
        <h1 className="m-0 text-[1.7rem] font-bold text-[#1f1147] tracking-tight">A.K Textiles</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-8 h-px bg-[#c4b5fd]" />
          <span className="w-1.5 h-1.5 rotate-45 bg-[#7c3aed]" />
          <span className="w-8 h-px bg-[#c4b5fd]" />
        </div>
      </div>

      <h2 className="relative z-[1] m-0 mt-5 text-xl font-bold text-[#111827]">Welcome back</h2>
      <p className="relative z-[1] m-0 mt-1 text-[0.92rem] text-[#6b7280]">
        Sign in to your distribution account
      </p>

      <form
        className="relative z-[1] w-full max-w-[380px] mt-7 bg-white rounded-2xl border border-[#eef0f3] shadow-[0_18px_40px_rgba(31,17,71,0.08)] p-6 flex flex-col gap-5"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-1">
          <span className="text-[0.92rem] font-semibold text-[#111827]">Enter your mobile number</span>
          <span className="text-[0.8rem] text-[#9ca3af]">We&apos;ll send you a one time password</span>
          <div className="flex flex-nowrap gap-1 mt-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  boxRefs.current[i] = el;
                }}
                className="w-full min-w-0 h-10 text-center rounded-lg border border-[#e5e7eb] text-[0.95rem] font-semibold text-[#111827] focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#ddd6fe] transition-colors"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
              />
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.92rem] font-semibold text-[#111827]">Enter your password</span>
          <div className="flex items-center gap-2 border border-[#e5e7eb] rounded-xl py-[0.7rem] px-3.5 bg-[#f9fafb] focus-within:border-[#7c3aed] focus-within:bg-white transition-colors">
            <input
              className="flex-1 min-w-0 border-none outline-none bg-transparent text-base text-[#111827] placeholder:text-[#9ca3af]"
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="border-none bg-transparent p-0 text-[#9ca3af] cursor-pointer flex items-center shrink-0"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <div className="flex items-center justify-between -mt-1">
          <label className="flex items-center gap-2 text-[0.86rem] text-[#374151] cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-[#7c3aed] cursor-pointer"
              checked={rememberMe}
              onChange={() => setRememberMe((v) => !v)}
            />
            Remember me
          </label>
          <button
            type="button"
            className="border-none bg-transparent p-0 text-[#7c3aed] text-[0.86rem] font-semibold cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        {error && <p className="text-[#e53e3e] m-0 text-[0.85rem]">{error}</p>}

        <button
          className="py-[0.85rem] px-4 rounded-xl border-none bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-white font-bold text-base cursor-pointer transition-[transform,opacity] duration-100 ease-in-out active:scale-[0.98] disabled:opacity-70 disabled:cursor-default"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Please wait..." : "Sign in securely"}
        </button>

        <p className="m-0 text-center text-[0.85rem] text-[#9ca3af]">
          Don&apos;t have access yet?{" "}
          <span className="text-[#7c3aed] font-semibold">Contact your distributor administrator.</span>
        </p>
      </form>

      <div className="fixed bottom-5 left-5 w-11 h-11 rounded-full bg-[#1f1147] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(31,17,71,0.35)]">
        <MessageCircle size={20} />
      </div>
    </div>
  );
}
