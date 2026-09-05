export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-[0.9rem] bg-[linear-gradient(160deg,#0b3d33_0%,#2563eb_55%,#3b82f6_100%)] animate-[splash-fade-out_0.5s_ease_1.6s_forwards]">
      <div className="absolute w-[220px] h-[220px] rounded-full border-2 border-white/25 animate-[splash-ring-grow_1.6s_ease-out_forwards]" />
      <div className="w-[88px] h-[88px] rounded-[24px] bg-white flex items-center justify-center shadow-[0_12px_32px_rgba(0,0,0,0.25)] animate-[splash-pop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_both]">
        <span className="text-[2rem] font-extrabold tracking-[0.02em] bg-[linear-gradient(135deg,#2563eb,#1d4ed8)] bg-clip-text text-transparent">
          AK
        </span>
      </div>
      <h1 className="m-0 text-white text-[1.6rem] font-bold tracking-[0.01em] opacity-0 animate-[splash-rise_0.5s_ease_0.35s_forwards]">
        AK Textiles
      </h1>
      <p className="m-0 text-white/85 text-[0.95rem] opacity-0 animate-[splash-rise_0.5s_ease_0.5s_forwards]">
        Fabrics &amp; Fashion, delivered
      </p>
    </div>
  );
}
