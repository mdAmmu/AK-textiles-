import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import type { Product } from "../../types/product";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.08)] flex flex-col cursor-pointer"
      onClick={() => navigate(`/admin/products/${product.id}`)}
    >
      <div className="h-40 bg-[var(--wa-panel-bg)] flex items-center justify-center overflow-hidden">
        {product.image_1 && (
          <img
            className="max-w-full max-h-full object-contain block"
            src={product.image_1}
            alt={product.name}
          />
        )}
      </div>
      <div className="font-bold text-center py-2.5 px-2">{product.name}</div>
      <button
        className="flex items-center justify-center gap-1.5 mx-2.5 mb-2.5 border-none rounded-lg p-2 text-[13px] font-semibold cursor-pointer bg-[#e5edfb] text-[#2563eb]"
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
