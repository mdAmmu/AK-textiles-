import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Mic, Send, Smile } from "lucide-react";
import "./MessageInput.css";

interface Props {
  onSend: (text: string) => void | Promise<void>;
  disabled?: boolean;
  extraAction?: ReactNode;
  value?: string;
  onChange?: (text: string) => void;
  canSubmitEmpty?: boolean;
}

export interface MessageInputHandle {
  focus: () => void;
}

function MessageInput(
  { onSend, disabled, extraAction, value, onChange, canSubmitEmpty }: Props,
  ref: React.Ref<MessageInputHandle>,
) {
  const [internalText, setInternalText] = useState("");
  const [sending, setSending] = useState(false);
  const isControlled = value !== undefined;
  const text = isControlled ? value : internalText;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  function setText(next: string) {
    if (isControlled) onChange?.(next);
    else setInternalText(next);
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  async function submit() {
    if (sending) return;
    const trimmed = text.trim();
    if (!trimmed && !canSubmitEmpty) return;
    setText("");
    setSending(true);
    try {
      await onSend(trimmed);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit();
  }

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <div className="message-input__pill">
        <span className="message-input__icon">
          <Smile size={20} />
        </span>
        <textarea
          ref={textareaRef}
          className="message-input__field"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          rows={1}
        />
        {extraAction}
        {/* <span className="message-input__icon">
          <Paperclip size={20} />
        </span>
        <span className="message-input__icon">
          <Camera size={20} />
        </span> */}
      </div>
      <button className="message-input__send" type="submit" disabled={disabled || sending}>
        {text.trim() || canSubmitEmpty ? <Send size={18} /> : <Mic size={18} />}
      </button>
    </form>
  );
}

export default forwardRef(MessageInput);
