import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { fetchProducts } from "../services/products";
import { fetchGroups } from "../services/groups";
import { createWhatsAppBroadcast } from "../services/whatsappBroadcast";
import type { WhatsAppBroadcast } from "../services/whatsappBroadcast";
import { fetchTemplates } from "../services/whatsappTemplates";
import type { WhatsAppTemplate } from "../services/whatsappTemplates";
import type { Product } from "../types/product";
import type { Group } from "../types/group";
import LoadingScreen from "../components/common/LoadingScreen";
import "./BroadcastConfirm.css";
import "./WhatsAppBroadcasts.css";

export default function WhatsAppCreateBroadcast() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [templates, setTemplates] = useState<WhatsAppTemplate[] | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WhatsAppBroadcast | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchProducts().then(setProducts);
    fetchGroups().then(setGroups);
    fetchTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  const approvedTemplates = useMemo(
    () => templates?.filter((t) => t.status === "APPROVED" && t.is_ours) ?? [],
    [templates],
  );

  const selectedProduct = useMemo(
    () => products?.find((p) => p.id === productId) ?? null,
    [products, productId],
  );

  const recipientCount = useMemo(() => {
    if (!groups) return 0;
    return groups
      .filter((g) => selectedGroups.has(g.id))
      .reduce((sum, g) => sum + g.customer_count, 0);
  }, [groups, selectedGroups]);

  function toggleGroup(groupId: string) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  async function handleConfirmSend() {
    if (!productId || !templateName || selectedGroups.size === 0 || sending) return;
    setSending(true);
    setError(null);
    try {
      const broadcast = await createWhatsAppBroadcast(
        productId,
        Array.from(selectedGroups),
        templateName,
      );
      setResult(broadcast);
    } catch {
      setError("Could not send the campaign. Please try again.");
    } finally {
      setSending(false);
      setConfirming(false);
    }
  }

  if (products === null || groups === null || templates === null) return <LoadingScreen />;

  if (result) {
    return (
      <div className="broadcast-confirm-page">
        <div className="broadcast-confirm-page__success">
          <CheckCircle2 size={48} color="#0f9d58" />
          <p>Campaign sent</p>
          <p className="broadcast-confirm-page__success-count">
            {result.sent_count} of {result.total_recipients} messages sent
            {result.failed_count > 0 ? ` · ${result.failed_count} failed` : ""}
          </p>
          <button onClick={() => navigate("/admin/whatsapp")}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="broadcast-confirm-page">
      <header className="broadcast-confirm-page__header">
        <button onClick={() => navigate("/admin/whatsapp")}>
          <ArrowLeft size={20} />
        </button>
        <h1>New WhatsApp Campaign</h1>
      </header>

      <div className="broadcast-confirm-page__body">
        <p className="broadcast-confirm-page__hint">
          1. Choose a template — <Link to="/admin/whatsapp/templates">manage templates</Link>
        </p>
        {approvedTemplates.length === 0 ? (
          <p className="wa-broadcasts-page__failed">
            No approved campaign templates yet.{" "}
            {templates.some((t) => t.is_ours)
              ? "You have one pending Meta's review — check back once approved."
              : "Create one first — it must be approved by Meta before it can be used."}{" "}
            Other templates on your WhatsApp account (samples, test templates) aren't shown here
            — they don't match the image + name + quantity + rate layout this app sends.
          </p>
        ) : (
          <div className="wa-broadcast-create__product-grid">
            {approvedTemplates.map((t) => (
              <button
                key={t.name}
                className={`wa-broadcast-create__product${templateName === t.name ? " wa-broadcast-create__product--selected" : ""}`}
                onClick={() => setTemplateName(t.name)}
                type="button"
              >
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        )}

        <p className="broadcast-confirm-page__hint" style={{ marginTop: "1.5rem" }}>
          2. Choose a product
        </p>
        <div className="wa-broadcast-create__product-grid">
          {products.length === 0 && <p className="broadcast-confirm-page__hint">No products yet.</p>}
          {products.map((p) => (
            <button
              key={p.id}
              className={`wa-broadcast-create__product${productId === p.id ? " wa-broadcast-create__product--selected" : ""}`}
              onClick={() => setProductId(p.id)}
              type="button"
            >
              {p.image_1 && <img src={p.image_1} alt={p.name} />}
              <span>{p.name}</span>
            </button>
          ))}
        </div>

        <p className="broadcast-confirm-page__hint" style={{ marginTop: "1.5rem" }}>
          3. Choose the groups to send to
        </p>
        {groups.map((g) => {
          const checked = selectedGroups.has(g.id);
          return (
            <label
              key={g.id}
              className={`broadcast-confirm-page__group${checked ? " broadcast-confirm-page__group--selected" : ""}`}
            >
              <input type="checkbox" checked={checked} onChange={() => toggleGroup(g.id)} />
              <span className="broadcast-confirm-page__group-name">{g.name}</span>
              <span>{g.customer_count} customers</span>
            </label>
          );
        })}

        {error && <p className="broadcast-confirm-page__hint" style={{ color: "#d32f2f" }}>{error}</p>}

        <div className="broadcast-confirm-page__actions">
          <button
            className="broadcast-confirm-page__send"
            onClick={() => setConfirming(true)}
            disabled={!productId || !templateName || selectedGroups.size === 0 || sending}
          >
            {sending
              ? "Sending..."
              : `Preview & Send${recipientCount ? ` (${recipientCount})` : ""}`}
          </button>
        </div>
      </div>

      {confirming && selectedProduct && (
        <div className="wa-broadcast-create__confirm-overlay">
          <div className="wa-broadcast-create__confirm-dialog">
            <h2>Send this campaign?</h2>
            {selectedProduct.image_1 && (
              <img
                className="wa-broadcast-create__confirm-image"
                src={selectedProduct.image_1}
                alt={selectedProduct.name}
              />
            )}
            <p>
              <strong>{selectedProduct.name}</strong> will be sent via the{" "}
              <strong>{templateName}</strong> template to <strong>{recipientCount}</strong>{" "}
              customer{recipientCount === 1 ? "" : "s"} across {selectedGroups.size} group
              {selectedGroups.size === 1 ? "" : "s"}.
            </p>
            <div className="broadcast-confirm-page__actions">
              <button
                className="broadcast-confirm-page__everyone"
                onClick={() => setConfirming(false)}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                className="broadcast-confirm-page__send"
                onClick={handleConfirmSend}
                disabled={sending}
              >
                {sending ? "Sending..." : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
