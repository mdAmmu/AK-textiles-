import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { fetchBroadcastPreview, sendBroadcast } from "../services/broadcast";
import type { BroadcastPreview, BroadcastResult } from "../services/broadcast";
import LoadingScreen from "../components/common/LoadingScreen";
import "./BroadcastConfirm.css";

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
      <div className="broadcast-confirm-page">
        <div className="broadcast-confirm-page__success">
          <CheckCircle2 size={48} color="#0f9d58" />
          <p>Product sent successfully</p>
          <p className="broadcast-confirm-page__success-count">
            {result.total_sent} customers received the product.
          </p>
          <button onClick={() => navigate("/admin/products")}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="broadcast-confirm-page">
      <header className="broadcast-confirm-page__header">
        <button onClick={() => navigate("/admin/products")}>
          <ArrowLeft size={20} />
        </button>
        <h1>Send Product</h1>
      </header>

      <div className="broadcast-confirm-page__body">
        <h2>{preview.product_name}</h2>
        <p className="broadcast-confirm-page__hint">Select the groups to send this product to.</p>

        {preview.groups.map((g) => {
          const checked = selected.has(g.group_id);
          return (
            <label
              key={g.group_id}
              className={`broadcast-confirm-page__group${checked ? " broadcast-confirm-page__group--selected" : ""}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleGroup(g.group_id)}
              />
              <span className="broadcast-confirm-page__group-name">{g.group_name}</span>
              <span>{g.customer_count} customers</span>
              <span>{g.price != null ? `₹${g.price}` : "No price set"}</span>
            </label>
          );
        })}

        <div className="broadcast-confirm-page__actions">
          <button
            className="broadcast-confirm-page__send"
            onClick={handleSendSelected}
            disabled={sending || selected.size === 0}
          >
            {sending ? "Sending..." : `Send${selected.size ? ` (${selected.size})` : ""}`}
          </button>
          <button
            className="broadcast-confirm-page__everyone"
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
