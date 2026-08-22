import { useState } from "react";
import type { FormEvent } from "react";
import type { ProductInput } from "../../types/product";
import "./ProductForm.css";

interface Props {
  initial?: ProductInput;
  submitLabel: string;
  onSubmit: (input: ProductInput) => void;
}

export default function ProductForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [quantityInBundle, setQuantityInBundle] = useState(initial?.quantity_in_bundle ?? "");
  const [dubaiPrice, setDubaiPrice] = useState(initial?.dubai_price?.toString() ?? "");
  const [southAfricaPrice, setSouthAfricaPrice] = useState(
    initial?.south_africa_price?.toString() ?? "",
  );
  const [indiaPrice, setIndiaPrice] = useState(initial?.india_price?.toString() ?? "");
  const [localPrice, setLocalPrice] = useState(initial?.local_price?.toString() ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      description: description || undefined,
      quantity_in_bundle: quantityInBundle || undefined,
      dubai_price: dubaiPrice ? Number(dubaiPrice) : undefined,
      south_africa_price: southAfricaPrice ? Number(southAfricaPrice) : undefined,
      india_price: indiaPrice ? Number(indiaPrice) : undefined,
      local_price: localPrice ? Number(localPrice) : undefined,
    });
  }

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <label className="product-form__label">Product Name</label>
      <input
        className="product-form__input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <label className="product-form__label">Description</label>
      <textarea
        className="product-form__input"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <label className="product-form__label">Quantity in Bundle</label>
      <input
        className="product-form__input"
        value={quantityInBundle}
        onChange={(e) => setQuantityInBundle(e.target.value)}
        placeholder="e.g. 12 pcs / box"
      />

      <label className="product-form__label">Prices</label>
      <div className="product-form__prices">
        <div className="product-form__price-row">
          <span>Dubai</span>
          <input
            type="number"
            step="0.01"
            value={dubaiPrice}
            onChange={(e) => setDubaiPrice(e.target.value)}
          />
        </div>
        <div className="product-form__price-row">
          <span>South Africa</span>
          <input
            type="number"
            step="0.01"
            value={southAfricaPrice}
            onChange={(e) => setSouthAfricaPrice(e.target.value)}
          />
        </div>
        <div className="product-form__price-row">
          <span>India</span>
          <input
            type="number"
            step="0.01"
            value={indiaPrice}
            onChange={(e) => setIndiaPrice(e.target.value)}
          />
        </div>
        <div className="product-form__price-row">
          <span>Local</span>
          <input
            type="number"
            step="0.01"
            value={localPrice}
            onChange={(e) => setLocalPrice(e.target.value)}
          />
        </div>
      </div>

      <button className="product-form__submit" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
