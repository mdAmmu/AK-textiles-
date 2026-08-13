import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { createProduct, uploadProductImage } from "../../services/products";
import type { Message } from "../../types/message";
import "./GroupProductComposer.css";

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
    <div className="group-product-composer">
      <div className="group-product-composer__header">
        <span>New Product</span>
        <button type="button" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
      </div>

      <form className="group-product-composer__form" onSubmit={handleSubmit}>
        <div className="group-product-composer__images">
          {images.map((staged, i) =>
            staged ? (
              <div key={i} className="group-product-composer__slot group-product-composer__slot--filled">
                <img src={staged.previewUrl} alt={`Product ${i + 1}`} />
                <button
                  type="button"
                  className="group-product-composer__remove"
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
                className="group-product-composer__slot"
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

        {error && <p className="group-product-composer__error">{error}</p>}

        {/* <label className="group-product-composer__label">Product Name</label>
        <input
          className="group-product-composer__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="group-product-composer__label">Description</label>
        <textarea
          className="group-product-composer__input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <label className="group-product-composer__label">Rate</label>
        <input
          className="group-product-composer__input"
          type="number"
          step="0.01"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
        /> */}

        <button className="group-product-composer__submit" type="submit" disabled={sending}>
          {sending ? "Sending..." : "OK"}
        </button>
      </form>
    </div>
  );
}
