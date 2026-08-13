import { X } from "lucide-react";
import "./ForwardPreviewBar.css";

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
    <div className="forward-preview-bar">
      <div className="forward-preview-bar__list">
        {images.map((img) => (
          <div className="forward-preview-bar__item" key={img.key}>
            <img className="forward-preview-bar__img" src={img.url} alt="" />
            <button
              type="button"
              className="forward-preview-bar__remove"
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
