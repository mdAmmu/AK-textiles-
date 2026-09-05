import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { createProduct, uploadProductImage } from "../../services/products";
import type { Message } from "../../types/message";

interface Props {
  groupName: string;
  onSent: (messages: Message[]) => void;
  onClose: () => void;
  sendProduct: (productId: string) => Promise<Message[]>;
}

interface StagedImage {
  file: File;
  previewUrl: string;
}

const PRICE_FIELD_BY_GROUP: Record<string, "dubai_price" | "south_africa_price" | "india_price" | "local_price"> = {
  dubai: "dubai_price",
  south_africa: "south_africa_price",
  india: "india_price",
  local: "local_price",
};

function priceFieldForGroup(groupName: string) {
  const key = groupName.toLowerCase().replace(/ /g, "_");
  return PRICE_FIELD_BY_GROUP[key] ?? "local_price";
}

export default function GroupProductComposer({ groupName, onSent, onClose, sendProduct }: Props) {
  const [name] = useState("");
  const [description] = useState("");
  const [rate] = useState("");
  const [images, setImages] = useState<(StagedImage | null)[]>([null, null, null, null]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingSlot = useRef<number | null>(null);

  const filledCount = images.filter(Boolean).length;

  function handlePickSlot(i: number) {
    pendingSlot.current = i;
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const slot = pendingSlot.current;
    if (file && slot !== null) {
      setImages((prev) => {
        const next = [...prev];
        next[slot] = { file, previewUrl: URL.createObjectURL(file) };
        return next;
      });
      setError(null);
    }
    e.target.value = "";
  }

  function handleRemoveImage(i: number) {
    setImages((prev) => {
      const next = [...prev];
      next[i] = null;
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    if (filledCount === 0) {
      setError("Add minimum one image");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const product = await createProduct({
        name,
        description: description || undefined,
        [priceFieldForGroup(groupName)]: rate ? Number(rate) : undefined,
      });

      for (const staged of images) {
        if (staged) await uploadProductImage(product.id, staged.file);
      }

      const messages = await sendProduct(product.id);
      onSent(messages);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[var(--chat-bubble-other)] flex flex-col z-10">
      <div className="flex justify-between items-center py-4 px-[1.125rem] border-b border-[var(--chat-border)] font-semibold text-[17px] shrink-0">
        <span>New Product</span>
        <button
          className="flex border-none bg-transparent text-[var(--chat-accent)] cursor-pointer"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <form
        className="flex-1 overflow-y-auto flex flex-col p-4 gap-1"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-2 gap-2.5 mb-2">
          {images.map((staged, i) =>
            staged ? (
              <div
                key={i}
                className="relative aspect-square rounded-[10px] border border-solid border-[var(--chat-border)] bg-[var(--chat-panel-bg)] overflow-hidden p-0"
              >
                <img
                  className="w-full h-full object-cover"
                  src={staged.previewUrl}
                  alt={`Product ${i + 1}`}
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full border-none bg-black/55 text-white cursor-pointer"
                  onClick={() => handleRemoveImage(i)}
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                key={i}
                type="button"
                className="relative aspect-square rounded-[10px] border border-dashed border-[var(--chat-border)] bg-[var(--chat-panel-bg)] flex flex-col items-center justify-center gap-1 text-[var(--chat-text-secondary)] text-xs cursor-pointer p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={sending || filledCount >= 4}
                onClick={() => handlePickSlot(i)}
              >
                <ImagePlus size={22} />
                <span>Image</span>
              </button>
            ),
          )}
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
        </div>

        {error && <p className="mt-1 mb-0 text-[#d92d20] text-[13px]">{error}</p>}

        <button
          className="mt-6 py-3 bg-[var(--chat-accent)] text-white border-none rounded-lg font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          disabled={sending}
        >
          {sending ? "Sending..." : "OK"}
        </button>
      </form>
    </div>
  );
}
