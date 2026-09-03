import { Reply, X } from "lucide-react";
import type { ReplyPreview } from "../../types/message";

function labelFor(preview: ReplyPreview): string {
  if (preview.is_deleted) return "This message was deleted";
  switch (preview.message_type) {
    case "IMAGE":
      return "📷 Photo";
    case "DOCUMENT":
      return preview.file_name ?? "📄 Document";
    case "PRODUCT":
      return "📦 Product";
    default:
      return preview.text ?? "";
  }
}

interface Props {
  preview: ReplyPreview;
  isOwn: boolean;
  onCancel: () => void;
}

export default function ReplyPreviewBar({ preview, isOwn, onCancel }: Props) {
  return (
    <div className="flex items-center gap-2 py-2 px-3.5 bg-[var(--chat-panel-bg)] border-l-[3px] border-[var(--chat-accent)]">
      <Reply size={16} className="text-[var(--chat-accent)] shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[var(--chat-accent)] text-[13px] font-semibold">
          {isOwn ? "You" : "Replying to"}
        </div>
        <div className="text-[var(--chat-text-secondary)] text-[13px] truncate">{labelFor(preview)}</div>
      </div>
      <button
        type="button"
        className="flex border-none bg-transparent text-[var(--chat-text-secondary)] cursor-pointer p-0.5"
        onClick={onCancel}
        aria-label="Cancel reply"
      >
        <X size={16} />
      </button>
    </div>
  );
}
