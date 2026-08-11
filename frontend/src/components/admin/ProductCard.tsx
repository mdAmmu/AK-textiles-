import { Link } from "react-router-dom";
import type { Product } from "../../types/product";
import "./ProductCard.css";

interface Props {
  product: Product;
  onDelete: (id: string) => void;
}

export default function ProductCard({ product, onDelete }: Props) {
  return (
    <div className="product-card">
      {product.image_1 && (
        <img className="product-card__image" src={product.image_1} alt={product.name} />
      )}
      <div className="product-card__name">{product.name}</div>
      <div className="product-card__prices">
        <div>
          <span>India</span> ₹{product.india_price ?? "-"}
        </div>
        <div>
          <span>Dubai</span> ₹{product.dubai_price ?? "-"}
        </div>
        <div>
          <span>South Africa</span> ₹{product.south_africa_price ?? "-"}
        </div>
        <div>
          <span>Local</span> ₹{product.local_price ?? "-"}
        </div>
      </div>
      <div className="product-card__actions">
        <Link to={`/admin/products/${product.id}/edit`}>Edit</Link>
        <Link to={`/admin/products/${product.id}/send`}>Send</Link>
        <button onClick={() => onDelete(product.id)}>Delete</button>
      </div>
    </div>
  );
}
