import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchProducts } from "../../services/products";
import type { Product } from "../../types/product";
import "./ProductPicker.css";

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
    <div className="product-picker">
      <div className="product-picker__header">
        <span>Send a Product</span>
        <button onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
      </div>
      <div className="product-picker__list">
        {products?.length === 0 && <p className="product-picker__empty">No products yet.</p>}
        {products?.map((p) => (
          <button key={p.id} className="product-picker__item" onClick={() => onPick(p.id)}>
            {p.image_1 ? (
              <img src={p.image_1} alt={p.name} />
            ) : (
              <div className="product-picker__item-placeholder" />
            )}
            <span>{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
