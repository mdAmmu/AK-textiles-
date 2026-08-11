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
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);

  useEffect(() => {
    if (productId) fetchBroadcastPreview(productId).then(setPreview);
  }, [productId]);

  async function handleSend() {
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

        {preview.groups.map((g) => (
          <div key={g.group_id} className="broadcast-confirm-page__group">
            <span className="broadcast-confirm-page__group-name">{g.group_name}</span>
            <span>{g.customer_count} customers</span>
            <span>{g.price != null ? `₹${g.price}` : "No price set"}</span>
          </div>
        ))}

        <div className="broadcast-confirm-page__actions">
          <button
            className="broadcast-confirm-page__cancel"
            onClick={() => navigate("/admin/products")}
          >
            Cancel
          </button>
          <button
            className="broadcast-confirm-page__send"
            onClick={handleSend}
            disabled={sending || preview.total_customers === 0}
          >
            {sending ? "Sending..." : "Send to Everyone"}
          </button>
        </div>
      </div>
    </div>
  );
}
