import { useRef } from "react";
import { ImagePlus } from "lucide-react";

const SLOT_BASE =
  "aspect-square rounded-lg bg-[var(--wa-panel-bg)] flex flex-col items-center justify-center text-[var(--wa-text-secondary)] text-2xl overflow-hidden p-0";

interface Props {
  images: (string | null | undefined)[];
  onUpload: (file: File) => void;
  uploading: boolean;
}

export default function ImageUploadGrid({ images, onUpload, uploading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const slots = [images[0], images[1], images[2], images[3]];
  const filledCount = slots.filter(Boolean).length;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = "";
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {slots.map((src, i) =>
        src ? (
          <div key={i} className={`${SLOT_BASE} border-none cursor-default`}>
            <img src={src} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
          </div>
        ) : (
          <button
            key={i}
            type="button"
            className={`${SLOT_BASE} border-2 border-dashed border-[var(--wa-border)] cursor-pointer`}
            disabled={uploading || filledCount >= 4}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus size={22} />
            <span className="text-xs mt-1">Image</span>
          </button>
        ),
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />
    </div>
  );
}
