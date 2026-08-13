import { Pencil, X } from "lucide-react";
import "./EditingMessageBar.css";

interface Props {
  onCancel: () => void;
}

export default function EditingMessageBar({ onCancel }: Props) {
  return (
    <div className="editing-message-bar">
      <Pencil size={16} className="editing-message-bar__icon" />
      <span className="editing-message-bar__label">Editing message</span>
      <button
        type="button"
        className="editing-message-bar__cancel"
        onClick={onCancel}
        aria-label="Cancel editing"
      >
        <X size={16} />
      </button>
    </div>
  );
}
