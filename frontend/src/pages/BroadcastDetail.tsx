import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RotateCw, X } from "lucide-react";
import { cancelBroadcast, fetchBroadcast, retryFailedRecipients } from "../services/broadcastMessages";
import type { BroadcastMessageDetail, BroadcastRecipientStatus } from "../types/broadcastMessage";
import Avatar from "../components/common/Avatar";
import LoadingScreen from "../components/common/LoadingScreen";

const RECIPIENT_STATUS_LABEL: Record<BroadcastRecipientStatus, string> = {
  pending: "Pending",
  sent: "Sent",
  failed: "Failed",
  cancelled: "Cancelled",
};

const RECIPIENT_STATUS_COLOR: Record<BroadcastRecipientStatus, string> = {
  pending: "text-[#8b8f8c] dark:text-[#8b96a5]",
  sent: "text-[#2563eb] dark:text-[#60a5fa]",
  failed: "text-[#e5484d]",
  cancelled: "text-[#8b8f8c] dark:text-[#8b96a5]",
};

const IN_FLIGHT = new Set(["queued", "processing"]);

export default function BroadcastDetail() {
  const { audienceId, broadcastId } = useParams<{ audienceId: string; broadcastId: string }>();
  const navigate = useNavigate();
  const [broadcast, setBroadcast] = useState<BroadcastMessageDetail | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!broadcastId) return;
    fetchBroadcast(broadcastId).then(setBroadcast);
  }, [broadcastId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!broadcast || !IN_FLIGHT.has(broadcast.status)) return;
    const interval = setInterval(load, 2500);
    return () => clearInterval(interval);
  }, [broadcast, load]);

  if (!broadcast) return <LoadingScreen />;

  const deliveryRate =
    broadcast.total_recipients > 0
      ? Math.round((broadcast.sent_count / broadcast.total_recipients) * 100)
      : 0;
  const readRate =
    broadcast.sent_count > 0 ? Math.round((broadcast.read_count / broadcast.sent_count) * 100) : 0;

  async function handleRetry() {
    if (!broadcastId || busy) return;
    setBusy(true);
    await retryFailedRecipients(broadcastId);
    setTimeout(load, 500);
    setBusy(false);
  }

  async function handleCancel() {
    if (!broadcastId || busy) return;
    setBusy(true);
    await cancelBroadcast(broadcastId);
    load();
    setBusy(false);
  }

  return (
    <div className="relative flex flex-col h-dvh bg-[linear-gradient(180deg,#eaf0ff_0%,#f5f8ff_40%,#ffffff_75%)] dark:bg-[#10161f]">
      <header className="flex items-center gap-3 pt-[1.125rem] px-4 pb-2 shrink-0">
        <button
          className="flex border-none bg-transparent text-[#1a1a1a] dark:text-[#e9edef] cursor-pointer p-1.5"
          onClick={() => navigate(audienceId ? `/admin/broadcast/${audienceId}` : "/admin/broadcast")}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-[#1a1a1a] dark:text-[#e9edef] m-0 flex-1 truncate">
          Broadcast message
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="bg-[#dbeafe] dark:bg-[#0b3d24] rounded-xl rounded-tl-sm py-2.5 px-3.5 whitespace-pre-wrap text-[#1a1a1a] dark:text-[#e9edef] text-[15px] mb-4">
          {broadcast.text}
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <Stat label="Recipients" value={broadcast.total_recipients} />
          <Stat
            label="Delivery"
            value={`${broadcast.sent_count} / ${broadcast.total_recipients}`}
            sub={`${deliveryRate}%`}
          />
          <Stat label="Read" value={`${broadcast.read_count} / ${broadcast.sent_count}`} sub={`${readRate}%`} />
          <Stat label="Failed" value={broadcast.failed_count} accent={broadcast.failed_count > 0} />
        </div>

        {broadcast.status === "processing" && (
          <p className="text-[#c9820f] text-sm mb-4">
            Sending… you can leave this page, the broadcast continues in the background.
          </p>
        )}

        {(broadcast.status === "queued" || broadcast.status === "processing") && (
          <button
            onClick={handleCancel}
            disabled={busy}
            className="flex items-center gap-1.5 border border-[#e5484d] text-[#e5484d] bg-transparent rounded-full py-1.5 px-3.5 text-sm font-semibold cursor-pointer mb-4 disabled:opacity-50"
          >
            <X size={14} /> Cancel broadcast
          </button>
        )}

        {broadcast.failed_count > 0 && (
          <button
            onClick={handleRetry}
            disabled={busy}
            className="flex items-center gap-1.5 border border-[#2563eb] text-[#2563eb] bg-transparent rounded-full py-1.5 px-3.5 text-sm font-semibold cursor-pointer mb-4 disabled:opacity-50"
          >
            <RotateCw size={14} /> Retry failed
          </button>
        )}

        <p className="text-[#7c827e] dark:text-[#8b96a5] text-sm font-semibold mb-2">Recipients</p>
        <div className="flex flex-col gap-2">
          {broadcast.recipients.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 bg-white dark:bg-[#1e2530] border border-[#eef1ee] dark:border-[#232d3a] rounded-xl p-3"
            >
              <Avatar name={r.recipient_name} size={36} />
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="font-semibold text-[#1a1a1a] dark:text-[#e9edef] truncate">
                  {r.recipient_name}
                </span>
                {r.status === "failed" && r.failure_reason && (
                  <span className="text-[#e5484d] text-xs truncate">{r.failure_reason}</span>
                )}
              </div>
              <span className={`text-[13px] font-semibold shrink-0 ${RECIPIENT_STATUS_COLOR[r.status]}`}>
                {RECIPIENT_STATUS_LABEL[r.status]}
                {r.status === "sent" && r.read_at ? " · Read" : ""}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-[#1e2530] border border-[#eef1ee] dark:border-[#232d3a] rounded-xl p-3">
      <div className="text-[#8b8f8c] dark:text-[#8b96a5] text-[13px]">{label}</div>
      <div
        className={`text-xl font-bold ${accent ? "text-[#e5484d]" : "text-[#1a1a1a] dark:text-[#e9edef]"}`}
      >
        {value}
      </div>
      {sub && <div className="text-[#2563eb] dark:text-[#60a5fa] text-xs font-semibold">{sub}</div>}
    </div>
  );
}
