import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getToken } from "../../services/api";

const LOADING_MS = 2000;
const SPOKE_COUNT = 12;

function SpokeSpinner() {
  return (
    <div className="relative w-9 h-9 shrink-0">
      {Array.from({ length: SPOKE_COUNT }).map((_, i) => (
        <span
          key={i}
          className="absolute top-0 left-1/2 w-[3px] h-[10px] rounded-full bg-[#ec1966] animate-[spoke-fade_1.1s_linear_infinite]"
          style={{
            transformOrigin: "50% 18px",
            transform: `translateX(-50%) rotate(${(360 / SPOKE_COUNT) * i}deg)`,
            animationDelay: `${(i * 1.1) / SPOKE_COUNT - 1.1}s`,
          }}
        />
      ))}
    </div>
  );
}

interface Props {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: Props) {
  // Already signed in (returning to the app, not the first install) skips
  // the "Get Started" intro screen entirely — that's only for someone who
  // hasn't logged in yet.
  const [stage, setStage] = useState<"intro" | "loading">(getToken() ? "loading" : "intro");

  useEffect(() => {
    if (stage !== "loading") return;
    const timer = setTimeout(onDone, LOADING_MS);
    return () => clearTimeout(timer);
  }, [stage, onDone]);

  return (
    <div className="fixed inset-0 z-[999] bg-white">
      <img
        src="/splash-1.png"
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          stage === "intro" ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <img
        src="/splash-2.png"
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          stage === "loading" ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {stage === "intro" && (
        <button
          type="button"
          onClick={() => setStage("loading")}
          className="absolute left-1/2 bottom-[9%] -translate-x-1/2 flex items-center gap-2 py-3 px-7 rounded-full border-none bg-[linear-gradient(135deg,#ec1966,#9d174d)] text-white font-bold text-base shadow-[0_10px_28px_rgba(157,23,77,0.4)] cursor-pointer active:scale-[0.97] transition-transform duration-100 opacity-0 animate-[splash-fade-in_0.5s_ease_0.3s_forwards]"
        >
          Get Started
          <ArrowRight size={18} />
        </button>
      )}

      {stage === "loading" && (
        <div className="absolute left-1/2 bottom-[13%] -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-0 animate-[splash-fade-in_0.4s_ease_forwards]">
          <SpokeSpinner />
          <span className="text-[#1f2937] font-medium text-[0.95rem]">Loading…</span>
        </div>
      )}
    </div>
  );
}
