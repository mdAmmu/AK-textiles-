import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { fetchBroadcastPreview, sendBroadcast } from "../services/broadcast";
import type { BroadcastPreview, BroadcastResult } from "../services/broadcast";
import LoadingScreen from "../components/common/LoadingScreen";

export default function BroadcastConfirm() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const [preview, setPreview] = useState<BroadcastPreview | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);

  useEffect(() => {
    if (productId) fetchBroadcastPreview(productId).then(setPreview);
  }, [productId]);

  function toggleGroup(groupId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  async function handleSendSelected() {
    if (!productId || selected.size === 0) return;
    setSending(true);
    try {
      const res = await sendBroadcast(productId, Array.from(selected));
      setResult(res);
    } finally {
      setSending(false);
    }
  }

  async function handleSendEveryone() {
    if (!productId) return;
    setSending(true);
    try {
      const res = await sendBroadcast(productId);
      setResult(res);
    } finally {
      setSending(false);
    }
  }

  if (!preview) return <LoadingScreen />;

  if (result) {
    return (
      <div className="min-h-dvh bg-[var(--wa-panel-bg)]">
        <div className="flex flex-col items-center justify-center h-dvh text-center gap-2">
          <CheckCircle2 size={48} color="#2563eb" />
          <p>Product sent successfully</p>
          <p className="text-[#667781]">{result.total_sent} customers received the product.</p>
          <button
            className="mt-4 py-2.5 px-8 bg-[var(--wa-accent)] text-white border-none rounded-lg font-semibold cursor-pointer"
            onClick={() => navigate("/admin/products")}
          >
            Done
          </button>
        </div>
      </div>
    );
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
        <h1 className="m-0 text-xl text-white">Send Product</h1>
      </header>

      <div className="p-4">
        <h2 className="mt-0">{preview.product_name}</h2>
        <p className="text-[var(--wa-text-secondary)] text-sm -mt-2 mb-3">
          Select the groups to send this product to.
        </p>

        {preview.groups.map((g) => {
          const checked = selected.has(g.group_id);
          return (
            <label
              key={g.group_id}
              className={`flex items-center gap-2.5 justify-start p-3 border rounded-md mb-2 cursor-pointer ${
                checked
                  ? "border-[var(--wa-accent)] bg-[#e9f7f0]"
                  : "border-transparent bg-white"
              }`}
            >
              <input
                className="w-[18px] h-[18px] accent-[var(--wa-accent)] shrink-0"
                type="checkbox"
                checked={checked}
                onChange={() => toggleGroup(g.group_id)}
              />
              <span className="font-semibold flex-1">{g.group_name}</span>
              <span>{g.customer_count} customers</span>
              <span>{g.price != null ? `₹${g.price}` : "No price set"}</span>
            </label>
          );
        })}

        <div className="flex flex-col gap-3 mt-6">
          <button
            className="py-3 border-none rounded-lg font-semibold cursor-pointer bg-[var(--wa-accent)] text-white disabled:opacity-50 disabled:cursor-default"
            onClick={handleSendSelected}
            disabled={sending || selected.size === 0}
          >
            {sending ? "Sending..." : `Send${selected.size ? ` (${selected.size})` : ""}`}
          </button>
          <button
            className="py-3 border rounded-lg font-semibold cursor-pointer bg-white border-[var(--wa-accent)] text-[var(--wa-accent)] disabled:opacity-50 disabled:cursor-default"
            onClick={handleSendEveryone}
            disabled={sending || preview.total_customers === 0}
          >
            {sending ? "Sending..." : "Send to Everyone"}
          </button>
        </div>
      </div>
    </div>
  );
}
