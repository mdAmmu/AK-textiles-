import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchMessageTemplates, sendGroupTemplate } from "../../services/messageTemplates";
import type { GroupTemplateSendResult, MessageTemplate } from "../../services/messageTemplates";
import "./GroupProductComposer.css";

interface Props {
  groupId: string;
  onSent: (result: GroupTemplateSendResult) => void;
  onClose: () => void;
}

export default function GroupTemplateSelector({ groupId, onSent, onClose }: Props) {
  const [templates, setTemplates] = useState<MessageTemplate[] | null>(null);
  const [selected, setSelected] = useState<MessageTemplate | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessageTemplates().then(setTemplates);
  }, []);

  async function handleSend() {
    if (!selected || sending) return;
    setSending(true);
    setError(null);
    try {
      const result = await sendGroupTemplate(groupId, selected.id);
      onSent(result);
    } catch {
      setError("Could not send the template. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="group-product-composer">
      <div className="group-product-composer__header">
        <span>{selected ? selected.name : "Select Template"}</span>
        <button
          type="button"
          onClick={() => (selected ? setSelected(null) : onClose())}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="group-product-composer__form">
        {selected ? (
          <>
            <p style={{ whiteSpace: "pre-wrap" }}>{selected.message}</p>
            {error && <p className="group-product-composer__error">{error}</p>}
            <button
              className="group-product-composer__submit"
              type="button"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </>
        ) : templates === null ? (
          <p>Loading templates...</p>
        ) : templates.length === 0 ? (
          <p>No templates yet. Create one from Message Templates first.</p>
        ) : (
          templates.map((t) => (
            <button
              key={t.id}
              type="button"
              className="group-product-composer__input"
              style={{ textAlign: "left", cursor: "pointer", marginBottom: "0.5rem" }}
              onClick={() => setSelected(t)}
            >
              <strong>{t.name}</strong>
              <div style={{ fontSize: "0.8125rem", opacity: 0.8 }}>{t.message}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
