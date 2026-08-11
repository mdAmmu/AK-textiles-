import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import "./MessageInput.css";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  extraAction?: ReactNode;
}

export default function MessageInput({ onSend, disabled, extraAction }: Props) {
  const [text, setText] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <div className="message-input__pill">
        <span className="message-input__icon">😊</span>
        <input
          className="message-input__field"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
        />
        {extraAction}
        <span className="message-input__icon">📎</span>
        <span className="message-input__icon">📷</span>
      </div>
      <button className="message-input__send" type="submit" disabled={disabled}>
        {text.trim() ? "➤" : "🎤"}
      </button>
    </form>
  );
}
