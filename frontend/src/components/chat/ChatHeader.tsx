import Avatar from "../common/Avatar";
import "./ChatHeader.css";

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export default function ChatHeader({ title, subtitle, onBack }: Props) {
  return (
    <header className="chat-header">
      {onBack && (
        <button className="chat-header__icon-btn chat-header__back" onClick={onBack} aria-label="Back">
          ←
        </button>
      )}
      <Avatar name={title} online={subtitle === "Online"} size={36} />
      <div className="chat-header__info">
        <div className="chat-header__title">{title}</div>
        {subtitle && <div className="chat-header__subtitle">{subtitle}</div>}
      </div>
      <div className="chat-header__actions">
        <button className="chat-header__icon-btn" aria-label="Video call">
          🎥
        </button>
        <button className="chat-header__icon-btn" aria-label="Call">
          📞
        </button>
        <button className="chat-header__icon-btn" aria-label="More options">
          ⋮
        </button>
      </div>
    </header>
  );
}
