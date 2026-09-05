import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createProduct, uploadProductImage } from "../services/products";
import type { Product, ProductInput } from "../types/product";
import ProductForm from "../components/admin/ProductForm";
import ImageUploadGrid from "../components/admin/ImageUploadGrid";

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
    <div className="min-h-dvh bg-[var(--wa-panel-bg)]">
      <header className="flex items-center gap-3 py-[1.125rem] px-4 bg-[var(--wa-header)]">
        <button
          className="flex border-none bg-transparent text-white cursor-pointer"
          onClick={() => navigate("/admin/products")}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="m-0 text-xl text-white">Create Product</h1>
      </header>

      {!product ? (
        <ProductForm submitLabel="Create Product" onSubmit={handleCreate} />
      ) : (
        <div className="bg-white m-3.5 rounded-xl overflow-hidden">
          <p className="pt-3.5 px-4 text-[var(--wa-text-secondary)] font-semibold text-sm">
            Now add up to 4 images
          </p>
          <ImageUploadGrid
            images={[product.image_1, product.image_2, product.image_3, product.image_4]}
            onUpload={handleUpload}
            uploading={uploading}
          />
          <button
            className="block mx-3.5 mt-2 mb-4 p-3 w-[calc(100%-1.75rem)] bg-[var(--wa-accent)] text-white border-none rounded-lg font-semibold cursor-pointer"
            onClick={() => navigate("/admin/products")}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
