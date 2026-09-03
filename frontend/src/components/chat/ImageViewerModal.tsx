import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";

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
      className="fixed inset-0 z-[1000] bg-black flex flex-col"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <header className="flex items-center gap-3 py-3 px-4 bg-[#1f1f1f] text-white shrink-0">
        <button
          className="bg-transparent border-none text-white flex items-center cursor-pointer p-0"
          onClick={onClose}
          aria-label="Close"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex flex-col leading-tight">
          <span className="text-base font-medium">You</span>
          <span className="text-[13px] text-white/65">{images.length} photos</span>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch] [scroll-snap-type:y_proximity]">
        {images.map((src, index) => (
          <div
            className="flex items-center justify-center min-h-full py-2 [scroll-snap-align:start]"
            key={index}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
          >
            <img
              className="max-w-full max-h-[calc(100vh-4rem)] object-contain"
              src={src}
              alt={`Photo ${index + 1}`}
            />
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}
