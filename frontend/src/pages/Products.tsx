import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { fetchProducts } from "../services/products";
import type { Product } from "../types/product";
import ProductCard from "../components/admin/ProductCard";
import LoadingScreen from "../components/common/LoadingScreen";

export default function Products() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  const filtered = useMemo(() => {
    if (!products) return products;
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => p.name.toLowerCase().includes(term));
  }, [products, search]);

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between py-5 px-4 bg-[var(--wa-header)] shrink-0">
        <h1 className="m-0 text-2xl text-white">Products</h1>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-1.5 bg-white/[0.15] border border-white/30 text-white font-semibold no-underline text-sm py-2 px-3.5 rounded-[20px] whitespace-nowrap"
        >
          <Plus size={16} /> Create Product
        </Link>
      </header>
      <div className="flex gap-2.5 py-3.5 px-4 bg-white border-b border-[var(--wa-border)] shrink-0">
        <div className="flex-1 flex items-center gap-2 bg-[var(--wa-panel-bg)] rounded-lg py-2.5 px-3.5 text-[var(--wa-text-secondary)]">
          <Search size={18} />
          <input
            className="flex-1 border-none outline-none bg-transparent font-[inherit] text-[var(--wa-text)]"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-1.5 border border-[var(--wa-border)] bg-white rounded-lg px-3.5 font-[inherit] font-semibold text-[var(--wa-text)] cursor-pointer">
          <SlidersHorizontal size={16} /> Filter
        </button>
      </div>
      <main className="flex-1 overflow-y-auto bg-[var(--wa-panel-bg)] p-3.5">
        {filtered === null ? (
          <LoadingScreen />
        ) : filtered.length === 0 ? (
          <p className="p-4 text-[var(--wa-text-secondary)] text-center">No products yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
