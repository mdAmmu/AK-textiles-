import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../services/products";
import type { Product } from "../types/product";
import ProductCard from "../components/admin/ProductCard";
import AdminNav from "../components/admin/AdminNav";
import LoadingScreen from "../components/common/LoadingScreen";
import "./Products.css";

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
    <div className="products-page">
      <header className="products-page__header">
        <h1>Products</h1>
        <Link to="/admin/products/new" className="products-page__create">
          + Create Product
        </Link>
      </header>
      <div className="products-page__toolbar">
        <div className="products-page__search-box">
          <span>🔍</span>
          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="products-page__filter">
          <span>☰</span> Filter
        </button>
      </div>
      <main className="products-page__content">
        {filtered === null ? (
          <LoadingScreen />
        ) : filtered.length === 0 ? (
          <p className="products-page__empty">No products yet.</p>
        ) : (
          <div className="products-page__grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
      <AdminNav />
    </div>
  );
}
