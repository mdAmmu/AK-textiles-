import { useRef } from "react";
import "./ImageUploadGrid.css";

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
    <div className="image-upload-grid">
      {slots.map((src, i) =>
        src ? (
          <div key={i} className="image-upload-grid__slot image-upload-grid__slot--filled">
            <img src={src} alt={`Product ${i + 1}`} />
          </div>
        ) : (
          <button
            key={i}
            type="button"
            className="image-upload-grid__slot"
            disabled={uploading || filledCount >= 4}
            onClick={() => inputRef.current?.click()}
          >
            +<span>Image</span>
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
