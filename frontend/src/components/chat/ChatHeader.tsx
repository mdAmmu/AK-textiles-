import { ArrowLeft } from "lucide-react";
import Avatar from "../common/Avatar";

const ICON_BTN = "flex border-none bg-transparent text-[var(--chat-accent)] cursor-pointer p-1 leading-none";

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onTitleClick?: () => void;
}

export default function ChatHeader({ title, subtitle, onBack, onTitleClick }: Props) {
  return (
    <header className="flex items-center gap-3 py-2.5 px-4 bg-[var(--chat-header-bg)] text-[var(--chat-text)] border-b border-[var(--chat-border)] shrink-0">
      {onBack && (
        <button className={ICON_BTN} onClick={onBack} aria-label="Back">
          <ArrowLeft size={22} />
        </button>
      )}
      <button
        type="button"
        className="flex items-center gap-3 flex-1 min-w-0 border-none bg-transparent p-0 text-left cursor-pointer font-[inherit] text-inherit disabled:cursor-default"
        onClick={onTitleClick}
        disabled={!onTitleClick}
      >
        <Avatar name={title} online={subtitle === "Online"} size={36} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[17px] whitespace-nowrap overflow-hidden text-ellipsis">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-[var(--chat-accent)] font-semibold">{subtitle}</div>
          )}
        </div>
      </button>
    </header>
  );
}
