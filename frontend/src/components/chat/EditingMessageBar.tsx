import { Pencil, X } from "lucide-react";

interface Props {
  onCancel: () => void;
}

export default function EditingMessageBar({ onCancel }: Props) {
  return (
    <div className="flex items-center gap-2 py-2 px-3.5 bg-[var(--chat-panel-bg)] text-[var(--chat-accent)] text-[13px] font-medium">
      <Pencil size={16} className="shrink-0" />
      <span className="flex-1">Editing message</span>
      <button
        type="button"
        className="flex border-none bg-transparent text-[var(--chat-text-secondary)] cursor-pointer p-0.5"
        onClick={onCancel}
        aria-label="Cancel editing"
      >
        <X size={16} />
      </button>
    </div>
  );
}
