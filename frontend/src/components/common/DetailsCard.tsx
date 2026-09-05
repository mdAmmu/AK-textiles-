import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface DetailItem {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  items: DetailItem[];
}

export default function DetailsCard({ icon: HeaderIcon, title, subtitle, items }: Props) {
  return (
    <div className="mx-4 mt-4 bg-white dark:bg-[#1e2530] rounded-2xl shadow-[0_4px_18px_rgba(37,99,235,0.06)] dark:shadow-none overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-[#eef1ee] dark:border-[#232d3a]">
        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#e6edff] dark:bg-[#1e2a4a] text-[#2563eb] dark:text-[#60a5fa] shrink-0">
          <HeaderIcon size={19} />
        </span>
        <div className="min-w-0">
          <div className="font-bold text-[15px] text-[#1a1a1a] dark:text-[#e9edef]">{title}</div>
          <div className="text-xs text-[#8b8f8c] dark:text-[#8b96a5] truncate">{subtitle}</div>
        </div>
      </div>
      <div className="flex flex-col">
        {items.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-3 py-3 px-4 border-b border-[#f3f5f4] dark:border-[#232d3a] last:border-b-0"
          >
            <Icon size={16} className="text-[#8b8f8c] dark:text-[#8b96a5] shrink-0" />
            <span className="flex-1 text-sm text-[#6b7069] dark:text-[#8b96a5]">{label}</span>
            <span className="text-sm font-semibold text-[#1a1a1a] dark:text-[#e9edef] text-right max-w-[60%] break-words">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
