import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchProducts } from "../../services/products";
import type { Product } from "../../types/product";

interface Props {
  onPick: (productId: string) => void;
  onClose: () => void;
}

export default function ProductPicker({ onPick, onClose }: Props) {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  return (
    <div className="fixed inset-0 bg-[var(--chat-bubble-other)] flex flex-col z-10">
      <div className="flex justify-between items-center py-4 px-[1.125rem] border-b border-[var(--chat-border)] font-semibold text-[17px] shrink-0">
        <span>Send a Product</span>
        <button
          className="flex border-none bg-transparent text-[var(--chat-accent)] cursor-pointer"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 p-4 content-start">
        {products?.length === 0 && (
          <p className="p-4 text-[var(--chat-text-secondary)]">No products yet.</p>
        )}
        {products?.map((p) => (
          <button
            key={p.id}
            className="flex flex-col items-start gap-0 border border-[var(--chat-border)] rounded-xl bg-[var(--chat-bubble-other)] p-3 min-h-[220px] cursor-pointer text-left"
            onClick={() => onPick(p.id)}
          >
            {p.image_1 ? (
              <img className="w-full aspect-square object-cover rounded-lg" src={p.image_1} alt={p.name} />
            ) : (
              <div className="w-full aspect-square rounded-lg bg-[var(--chat-panel-bg)]" />
            )}
            <span className="mt-2.5 text-[15px] text-[var(--chat-text)]">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
