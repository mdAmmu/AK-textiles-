import type { ReactNode } from "react";

export interface AttachmentOption {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface Props {
  options: AttachmentOption[];
  onClose: () => void;
}

export default function AttachmentSheet({ options, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute left-0 right-0 bottom-full bg-[var(--chat-panel-bg)] rounded-t-2xl p-5 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] z-20">
        <div className="grid grid-cols-3 gap-4">
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className="flex flex-col items-center gap-2 border-none bg-transparent cursor-pointer"
              onClick={() => {
                onClose();
                opt.onClick();
              }}
            >
              <span className="w-14 h-14 rounded-full bg-[var(--chat-accent)]/15 flex items-center justify-center text-[var(--chat-accent)]">
                {opt.icon}
              </span>
              <span className="text-xs text-[var(--chat-text-secondary)]">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
