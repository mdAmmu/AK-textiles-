import { useState } from "react";
import type { FormEvent } from "react";
import "./MessageInput.css";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: Props) {
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
      <input
        className="message-input__field"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
      />
      <button className="message-input__send" type="submit" disabled={disabled || !text.trim()}>
        ➤
      </button>
    </form>
  );
}
