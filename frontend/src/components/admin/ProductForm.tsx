import { useState } from "react";
import type { FormEvent } from "react";
import type { ProductInput } from "../../types/product";

const INPUT_CLASS =
  "py-2.5 px-3 border border-[var(--wa-border)] rounded-lg font-[inherit] bg-[var(--wa-panel-bg)]";
const PRICE_INPUT_CLASS =
  "w-[120px] py-2 px-2.5 border border-[var(--wa-border)] rounded-lg bg-[var(--wa-panel-bg)] font-[inherit]";

interface Props {
  initial?: ProductInput;
  submitLabel: string;
  onSubmit: (input: ProductInput) => void;
}

export default function ProductForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
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
      dubai_price: dubaiPrice ? Number(dubaiPrice) : undefined,
      south_africa_price: southAfricaPrice ? Number(southAfricaPrice) : undefined,
      india_price: indiaPrice ? Number(indiaPrice) : undefined,
      local_price: localPrice ? Number(localPrice) : undefined,
    });
  }

  return (
    <form
      className="flex flex-col p-4 gap-1 bg-white m-3.5 rounded-xl"
      onSubmit={handleSubmit}
    >
      <label className="font-semibold text-sm mt-3 text-[var(--wa-text)]">Product Name</label>
      <input
        className={INPUT_CLASS}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <label className="font-semibold text-sm mt-3 text-[var(--wa-text)]">Description</label>
      <textarea
        className={INPUT_CLASS}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <label className="font-semibold text-sm mt-3 text-[var(--wa-text)]">Prices</label>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">Dubai</span>
          <input
            className={PRICE_INPUT_CLASS}
            type="number"
            step="0.01"
            value={dubaiPrice}
            onChange={(e) => setDubaiPrice(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">South Africa</span>
          <input
            className={PRICE_INPUT_CLASS}
            type="number"
            step="0.01"
            value={southAfricaPrice}
            onChange={(e) => setSouthAfricaPrice(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">India</span>
          <input
            className={PRICE_INPUT_CLASS}
            type="number"
            step="0.01"
            value={indiaPrice}
            onChange={(e) => setIndiaPrice(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">Local</span>
          <input
            className={PRICE_INPUT_CLASS}
            type="number"
            step="0.01"
            value={localPrice}
            onChange={(e) => setLocalPrice(e.target.value)}
          />
        </div>
      </div>

      <button
        className="mt-6 p-3 bg-[var(--wa-accent)] text-white border-none rounded-lg font-semibold cursor-pointer"
        type="submit"
      >
        {submitLabel}
      </button>
    </form>
  );
}
