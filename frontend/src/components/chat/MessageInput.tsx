import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Mic, Paperclip, Send, Smile } from "lucide-react";
import AttachmentSheet, { type AttachmentOption } from "./AttachmentSheet";

export const MESSAGE_INPUT_ICON_CLASS =
  "flex items-center shrink-0 text-[var(--chat-text-secondary)] cursor-pointer";

interface Props {
  onSend: (text: string) => void | Promise<void>;
  disabled?: boolean;
  attachmentOptions?: AttachmentOption[];
  value?: string;
  onChange?: (text: string) => void;
  canSubmitEmpty?: boolean;
}

export interface MessageInputHandle {
  focus: () => void;
}

function MessageInput(
  { onSend, disabled, attachmentOptions, value, onChange, canSubmitEmpty }: Props,
  ref: React.Ref<MessageInputHandle>,
) {
  const [internalText, setInternalText] = useState("");
  const [sending, setSending] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
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
    <form
      className="relative flex items-center gap-2 py-2 px-2.5 bg-[var(--chat-panel-bg)] border-t border-[var(--chat-border)] shrink-0"
      onSubmit={handleSubmit}
    >
      <div className="flex-1 flex items-center gap-2.5 bg-[var(--chat-bubble-other)] rounded-[22px] py-[0.5625rem] px-3.5 min-w-0">
        <span className={MESSAGE_INPUT_ICON_CLASS}>
          <Smile size={20} />
        </span>
        <textarea
          ref={textareaRef}
          className="flex-1 min-w-0 border-none outline-none font-[inherit] bg-transparent text-[var(--chat-text)] resize-none max-h-[6.5rem] overflow-y-auto leading-[1.375rem] p-0 self-center"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          rows={1}
        />
        {attachmentOptions && attachmentOptions.length > 0 && (
          <span
            className={MESSAGE_INPUT_ICON_CLASS}
            onClick={() => setShowAttachments((s) => !s)}
            role="button"
            aria-label="Attach"
          >
            <Paperclip size={20} />
          </span>
        )}
      </div>
      <button
        className="flex items-center justify-center border-none bg-[var(--chat-accent)] text-white w-[42px] h-[42px] rounded-full cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-default"
        type="submit"
        disabled={disabled || sending}
      >
        {text.trim() || canSubmitEmpty ? <Send size={18} /> : <Mic size={18} />}
      </button>

      {showAttachments && attachmentOptions && (
        <AttachmentSheet options={attachmentOptions} onClose={() => setShowAttachments(false)} />
      )}
    </form>
  );
}

export default forwardRef(MessageInput);
