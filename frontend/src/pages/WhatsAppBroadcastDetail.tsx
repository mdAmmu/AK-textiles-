import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { fetchWhatsAppBroadcast } from "../services/whatsappBroadcast";
import type { WhatsAppBroadcastDetail as Detail } from "../services/whatsappBroadcast";
import LoadingScreen from "../components/common/LoadingScreen";
import "./WhatsAppBroadcasts.css";

export default function WhatsAppBroadcastDetail() {
  const { broadcastId } = useParams<{ broadcastId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    if (broadcastId) fetchWhatsAppBroadcast(broadcastId).then(setDetail);
  }, [broadcastId]);

  if (!detail) return <LoadingScreen />;

  return (
    <div className="wa-broadcasts-page">
      <header className="broadcast-confirm-page__header">
        <button onClick={() => navigate("/admin/whatsapp")}>
          <ArrowLeft size={20} />
        </button>
        <h1>Campaign Details</h1>
      </header>

      <main className="wa-broadcasts-page__content">
        <div className="wa-broadcast-detail__summary">
          <span>Status: <strong>{detail.status}</strong></span>
          <span>Template: <strong>{detail.template_name}</strong></span>
          <span>
            {detail.sent_count}/{detail.total_recipients} sent
            {detail.failed_count > 0 ? ` · ${detail.failed_count} failed` : ""}
          </span>
        </div>

        <div className="wa-broadcasts-page__list">
          {detail.recipients.map((r) => (
            <div key={r.id} className="wa-broadcast-detail__recipient">
              <span>{r.phone_number}</span>
              <span className={`wa-broadcasts-page__status wa-broadcasts-page__status--${r.status.toLowerCase()}`}>
                {r.status}
              </span>
              {r.error_message && (
                <span className="wa-broadcasts-page__failed">{r.error_message}</span>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
