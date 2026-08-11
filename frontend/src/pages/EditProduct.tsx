import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProducts, updateProduct, uploadProductImage } from "../services/products";
import type { Product, ProductInput } from "../types/product";
import ProductForm from "../components/admin/ProductForm";
import ImageUploadGrid from "../components/admin/ImageUploadGrid";
import LoadingScreen from "../components/common/LoadingScreen";
import "./CreateProduct.css";

export default function EditProduct() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts().then((all) => {
      setProduct(all.find((p) => p.id === productId) ?? null);
    });
  }, [productId]);

  async function handleSave(input: ProductInput) {
    if (!product) return;
    const updated = await updateProduct(product.id, input);
    setProduct(updated);
    navigate("/admin/products");
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

  if (!product) return <LoadingScreen />;

  return (
    <div className="create-product-page">
      <header className="create-product-page__header">
        <button onClick={() => navigate("/admin/products")}>← Products</button>
        <h1>Edit Product</h1>
      </header>

      <div className="create-product-page__images">
        <p>Images</p>
        <ImageUploadGrid
          images={[product.image_1, product.image_2, product.image_3, product.image_4]}
          onUpload={handleUpload}
          uploading={uploading}
        />
      </div>

      <ProductForm
        submitLabel="Save Changes"
        initial={{
          name: product.name,
          description: product.description ?? undefined,
          dubai_price: product.dubai_price ?? undefined,
          south_africa_price: product.south_africa_price ?? undefined,
          india_price: product.india_price ?? undefined,
          local_price: product.local_price ?? undefined,
        }}
        onSubmit={handleSave}
      />
    </div>
  );
}
