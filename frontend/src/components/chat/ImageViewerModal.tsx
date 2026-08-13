import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";
import "./ImageViewerModal.css";

interface Props {
  images: string[];
  startIndex: number;
  onClose: () => void;
}

export default function ImageViewerModal({ images, startIndex, onClose }: Props) {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    itemRefs.current[startIndex]?.scrollIntoView({ block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      className="image-viewer"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <header className="image-viewer__header">
        <button className="image-viewer__back" onClick={onClose} aria-label="Close">
          <ArrowLeft size={22} />
        </button>
        <div className="image-viewer__title">
          <span className="image-viewer__title-main">You</span>
          <span className="image-viewer__title-sub">{images.length} photos</span>
        </div>
      </header>
      <div className="image-viewer__scroll">
        {images.map((src, index) => (
          <div
            className="image-viewer__item"
            key={index}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
          >
            <img className="image-viewer__img" src={src} alt={`Photo ${index + 1}`} />
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}
