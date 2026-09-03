import { useNavigate } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";

interface Props {
  title: string;
}

export default function ComingSoon({ title }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-dvh bg-[var(--wa-panel-bg)]">
      <header className="flex items-center gap-3 py-[1.125rem] px-4 bg-[var(--wa-header)] shrink-0">
        <button
          className="flex border-none bg-transparent text-white cursor-pointer"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="m-0 text-xl text-white">{title}</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
        <span className="w-16 h-16 rounded-full bg-[var(--wa-accent)]/10 flex items-center justify-center">
          <Construction size={32} className="text-[var(--wa-accent)]" />
        </span>
        <h2 className="m-0 text-lg font-bold text-[var(--wa-text)]">Coming Soon</h2>
        <p className="m-0 text-[var(--wa-text-secondary)] text-sm max-w-[260px]">
          {title} is under development and will be available in a future update.
        </p>
      </main>
    </div>
  );
}
