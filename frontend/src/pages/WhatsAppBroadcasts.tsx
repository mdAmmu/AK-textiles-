import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { fetchWhatsAppBroadcasts } from "../services/whatsappBroadcast";
import type { WhatsAppBroadcast } from "../services/whatsappBroadcast";
import { fetchProducts } from "../services/products";
import type { Product } from "../types/product";
import LoadingScreen from "../components/common/LoadingScreen";
import "./WhatsAppBroadcasts.css";

const STATUS_LABEL: Record<WhatsAppBroadcast["status"], string> = {
  DRAFT: "Queued",
  SENDING: "Sending...",
  COMPLETED: "Completed",
  PARTIALLY_COMPLETED: "Partially completed",
  FAILED: "Failed",
};

export default function WhatsAppBroadcasts() {
  const navigate = useNavigate();
  const [broadcasts, setBroadcasts] = useState<WhatsAppBroadcast[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    fetchWhatsAppBroadcasts().then(setBroadcasts);
    fetchProducts().then(setProducts);
  }, []);

  function productName(productId: string): string {
    return products?.find((p) => p.id === productId)?.name ?? "Product";
  }

  return (
    <div className="wa-broadcasts-page">
      <header className="wa-broadcasts-page__header">
        <h1>WhatsApp Campaigns</h1>
        <Link to="/admin/whatsapp/new" className="wa-broadcasts-page__create">
          <Plus size={16} /> New Campaign
        </Link>
      </header>

      <main className="wa-broadcasts-page__content">
        {broadcasts === null ? (
          <LoadingScreen />
        ) : broadcasts.length === 0 ? (
          <p className="wa-broadcasts-page__empty">
            No campaigns sent yet. Create one to message a group's customers on real WhatsApp.
          </p>
        ) : (
          <div className="wa-broadcasts-page__list">
            {broadcasts.map((b) => (
              <div
                key={b.id}
                className="wa-broadcasts-page__row"
                onClick={() => navigate(`/admin/whatsapp/${b.id}`)}
              >
                <div className="wa-broadcasts-page__row-main">
                  <span className="wa-broadcasts-page__row-title">{productName(b.product_id)}</span>
                  <span className={`wa-broadcasts-page__status wa-broadcasts-page__status--${b.status.toLowerCase()}`}>
                    {STATUS_LABEL[b.status]}
                  </span>
                </div>
                <div className="wa-broadcasts-page__row-stats">
                  <span>{b.sent_count}/{b.total_recipients} sent</span>
                  {b.failed_count > 0 && <span className="wa-broadcasts-page__failed">{b.failed_count} failed</span>}
                  <span>{new Date(b.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
