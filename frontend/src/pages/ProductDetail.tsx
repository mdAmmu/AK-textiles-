import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Send, Trash2 } from "lucide-react";
import { deleteProduct, fetchProduct } from "../services/products";
import type { Product } from "../types/product";
import LoadingScreen from "../components/common/LoadingScreen";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (productId) fetchProduct(productId).then(setProduct);
  }, [productId]);

  async function handleDelete() {
    if (!product) return;
    await deleteProduct(product.id);
    navigate("/admin/products");
  }

  if (!product) return <LoadingScreen />;

  const images = [product.image_1, product.image_2, product.image_3, product.image_4].filter(
    (img): img is string => Boolean(img),
  );

  return (
    <div className="product-detail-page">
      <header className="product-detail-page__header">
        <button onClick={() => navigate("/admin/products")} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1>Product</h1>
      </header>

      <div className="product-detail-page__gallery">
        <div className="product-detail-page__main-image">
          {images.length > 0 ? (
            <img src={images[activeImage]} alt={product.name} />
          ) : (
            <div className="product-detail-page__no-image">No image</div>
          )}
        </div>
        {images.length > 1 && (
          <div className="product-detail-page__thumbs">
            {images.map((img, i) => (
              <button
                key={img}
                className={`product-detail-page__thumb${i === activeImage ? " product-detail-page__thumb--active" : ""}`}
                onClick={() => setActiveImage(i)}
              >
                <img src={img} alt={`${product.name} ${i + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="product-detail-page__card">
        <h2>{product.name}</h2>
        {product.description && <p className="product-detail-page__description">{product.description}</p>}

        <div className="product-detail-page__prices">
          <div className="product-detail-page__price-cell">
            <span>India</span> ₹{product.india_price ?? "-"}
          </div>
          <div className="product-detail-page__price-cell">
            <span>Dubai</span> ₹{product.dubai_price ?? "-"}
          </div>
          <div className="product-detail-page__price-cell">
            <span>South Africa</span> ₹{product.south_africa_price ?? "-"}
          </div>
          <div className="product-detail-page__price-cell">
            <span>Local</span> ₹{product.local_price ?? "-"}
          </div>
        </div>
      </div>

      <div className="product-detail-page__actions">
        <button
          className="product-detail-page__action product-detail-page__action--send"
          onClick={() => navigate(`/admin/products/${product.id}/send`)}
        >
          <Send size={16} /> Send
        </button>
        <button
          className="product-detail-page__action product-detail-page__action--edit"
          onClick={() => navigate(`/admin/products/${product.id}/edit`)}
        >
          <Pencil size={16} /> Edit
        </button>
        <button
          className="product-detail-page__action product-detail-page__action--delete"
          onClick={handleDelete}
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </div>
  );
}
