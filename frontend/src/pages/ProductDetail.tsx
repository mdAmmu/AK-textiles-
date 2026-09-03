import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Send, Trash2 } from "lucide-react";
import { deleteProduct, fetchProduct } from "../services/products";
import type { Product } from "../types/product";
import LoadingScreen from "../components/common/LoadingScreen";

const ACTION_BTN =
  "flex-1 flex items-center justify-center gap-1.5 border-none rounded-[10px] p-3 font-semibold cursor-pointer";

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
    <div className="min-h-dvh bg-[var(--wa-panel-bg)] pb-4">
      <header className="flex items-center gap-3 py-[1.125rem] px-4 bg-[var(--wa-header)]">
        <button
          className="border-none bg-transparent text-white text-lg cursor-pointer"
          onClick={() => navigate("/admin/products")}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="m-0 text-xl text-white">Product</h1>
      </header>

      <div className="bg-white m-3.5 rounded-xl overflow-hidden">
        <div className="aspect-square bg-[var(--wa-panel-bg)]">
          {images.length > 0 ? (
            <img
              className="w-full h-full object-cover block"
              src={images[activeImage]}
              alt={product.name}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--wa-text-secondary)]">
              No image
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 p-2.5 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img}
                className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 p-0 cursor-pointer ${
                  i === activeImage ? "border-[var(--wa-accent)]" : "border-transparent"
                }`}
                onClick={() => setActiveImage(i)}
              >
                <img
                  className="w-full h-full object-cover block"
                  src={img}
                  alt={`${product.name} ${i + 1}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white m-3.5 p-4 rounded-xl">
        <h2 className="mt-0 mb-1.5 text-lg">{product.name}</h2>
        {product.description && (
          <p className="text-[var(--wa-text-secondary)] text-sm mt-0 mb-3.5">
            {product.description}
          </p>
        )}

        <div className="grid grid-cols-2 border-t border-[var(--wa-border)]">
          <div className="py-2.5 px-2 text-[13px] border-b border-r border-[var(--wa-border)] flex flex-col gap-0.5">
            <span className="text-[var(--wa-text-secondary)] text-xs">India</span> ₹
            {product.india_price ?? "-"}
          </div>
          <div className="py-2.5 px-2 text-[13px] border-b border-[var(--wa-border)] flex flex-col gap-0.5">
            <span className="text-[var(--wa-text-secondary)] text-xs">Dubai</span> ₹
            {product.dubai_price ?? "-"}
          </div>
          <div className="py-2.5 px-2 text-[13px] border-b border-r border-[var(--wa-border)] flex flex-col gap-0.5">
            <span className="text-[var(--wa-text-secondary)] text-xs">South Africa</span> ₹
            {product.south_africa_price ?? "-"}
          </div>
          <div className="py-2.5 px-2 text-[13px] border-b border-[var(--wa-border)] flex flex-col gap-0.5">
            <span className="text-[var(--wa-text-secondary)] text-xs">Local</span> ₹
            {product.local_price ?? "-"}
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 m-3.5">
        <button
          className={`${ACTION_BTN} bg-[#e5edfb] text-[#2563eb]`}
          onClick={() => navigate(`/admin/products/${product.id}/send`)}
        >
          <Send size={16} /> Send
        </button>
        <button
          className={`${ACTION_BTN} bg-[#e3f7ec] text-[#0f9d58]`}
          onClick={() => navigate(`/admin/products/${product.id}/edit`)}
        >
          <Pencil size={16} /> Edit
        </button>
        <button className={`${ACTION_BTN} bg-[#fdeaea] text-[#e53935]`} onClick={handleDelete}>
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </div>
  );
}
