import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteProduct, fetchProducts } from "../services/products";
import type { Product } from "../types/product";
import ProductCard from "../components/admin/ProductCard";
import AdminNav from "../components/admin/AdminNav";
import LoadingScreen from "../components/common/LoadingScreen";
import "./Products.css";

export default function Products() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  async function handleDelete(id: string) {
    await deleteProduct(id);
    setProducts((prev) => prev?.filter((p) => p.id !== id) ?? null);
  }

  return (
    <div className="products-page">
      <header className="products-page__header">
        <h1>Products</h1>
        <Link to="/admin/products/new" className="products-page__create">
          + Create Product
        </Link>
      </header>
      <main className="products-page__content">
        {products === null ? (
          <LoadingScreen />
        ) : products.length === 0 ? (
          <p className="products-page__empty">No products yet.</p>
        ) : (
          products.map((p) => <ProductCard key={p.id} product={p} onDelete={handleDelete} />)
        )}
      </main>
      <AdminNav />
    </div>
  );
}
