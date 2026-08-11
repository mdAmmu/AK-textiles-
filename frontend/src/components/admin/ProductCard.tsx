import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import type { Product } from "../../types/product";
import "./ProductCard.css";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const navigate = useNavigate();

  return (
    <div className="product-card" onClick={() => navigate(`/admin/products/${product.id}`)}>
      <div className="product-card__image-wrap">
        {product.image_1 && (
          <img className="product-card__image" src={product.image_1} alt={product.name} />
        )}
      </div>
      <div className="product-card__name">{product.name}</div>
      <button
        className="product-card__send"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/admin/products/${product.id}/send`);
        }}
      >
        <Send size={14} /> Send
      </button>
    </div>
  );
}
