import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProduct, uploadProductImage } from "../services/products";
import type { Product, ProductInput } from "../types/product";
import ProductForm from "../components/admin/ProductForm";
import ImageUploadGrid from "../components/admin/ImageUploadGrid";
import "./CreateProduct.css";

export default function CreateProduct() {
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleCreate(input: ProductInput) {
    const created = await createProduct(input);
    setProduct(created);
  }

  async function handleUpload(file: File) {
    if (!product) return;
    setUploading(true);
    try {
      const updated = await uploadProductImage(product.id, file);
      setProduct(updated);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="create-product-page">
      <header className="create-product-page__header">
        <button onClick={() => navigate("/admin/products")}>← Products</button>
        <h1>Create Product</h1>
      </header>

      {!product ? (
        <ProductForm submitLabel="Create Product" onSubmit={handleCreate} />
      ) : (
        <div className="create-product-page__images">
          <p>Now add up to 4 images</p>
          <ImageUploadGrid
            images={[product.image_1, product.image_2, product.image_3, product.image_4]}
            onUpload={handleUpload}
            uploading={uploading}
          />
          <button
            className="create-product-page__done"
            onClick={() => navigate("/admin/products")}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
