import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  icon?: LucideIcon;
  dot?: boolean;
}

export default function StatusPill({ label, icon: Icon, dot }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white/[0.18] border border-white/[0.35] text-white text-xs font-semibold backdrop-blur-sm">
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />}
      {Icon && <Icon size={13} />}
      {label}
    </span>
  );
}
