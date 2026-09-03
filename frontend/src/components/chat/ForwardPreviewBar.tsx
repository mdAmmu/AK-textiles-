import { X } from "lucide-react";

export interface StagedImage {
  key: string;
  url: string;
  file?: File;
  sourceMessageId?: string;
}

interface Props {
  images: StagedImage[];
  onRemove: (key: string) => void;
}

export default function ForwardPreviewBar({ images, onRemove }: Props) {
  if (images.length === 0) return null;
  return (
    <div className="pt-2 px-3 bg-[var(--chat-panel-bg)]">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((img) => (
          <div
            className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
            key={img.key}
          >
            <img className="w-full h-full object-cover block" src={img.url} alt="" />
            <button
              type="button"
              className="absolute top-0.5 right-0.5 w-[18px] h-[18px] rounded-full border-none bg-black/60 text-white flex items-center justify-center cursor-pointer p-0"
              onClick={() => onRemove(img.key)}
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
