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
        <button className="chat-header__back" onClick={onBack}>
          ←
        </button>
      )}
      <div>
        <div className="chat-header__title">{title}</div>
        {subtitle && <div className="chat-header__subtitle">{subtitle}</div>}
      </div>
    </header>
  );
}
