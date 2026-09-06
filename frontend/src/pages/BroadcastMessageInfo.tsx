import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCheck, FileText } from "lucide-react";
import { fetchBroadcast, fetchBroadcastRecipients } from "../services/broadcastMessages";
import type { BroadcastMessageDetail, BroadcastRecipientRow } from "../types/broadcastMessage";
import MessageInfoScreen, {
  type MessageNotReaderRow,
  type MessageReaderRow,
} from "../components/chat/MessageInfoScreen";
import LoadingScreen from "../components/common/LoadingScreen";

export default function BroadcastMessageInfo() {
  const { audienceId, broadcastId } = useParams<{ audienceId: string; broadcastId: string }>();
  const navigate = useNavigate();

  const [broadcast, setBroadcast] = useState<BroadcastMessageDetail | null>(null);
  const [recipients, setRecipients] = useState<BroadcastRecipientRow[] | null>(null);

  useEffect(() => {
    if (!broadcastId) return;
    fetchBroadcast(broadcastId).then(setBroadcast);
    fetchBroadcastRecipients(broadcastId).then(setRecipients);
  }, [broadcastId]);

  if (broadcast === null || recipients === null) return <LoadingScreen />;

  const readBy: MessageReaderRow[] = recipients
    .filter((r) => r.read_at)
    .sort((a, b) => (b.read_at ?? "").localeCompare(a.read_at ?? ""))
    .map((r) => ({ id: r.recipient_id, name: r.recipient_name, readAt: r.read_at as string }));
  const notReadBy: MessageNotReaderRow[] = recipients
    .filter((r) => !r.read_at)
    .map((r) => ({ id: r.recipient_id, name: r.recipient_name }));

  const time = new Date(broadcast.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <MessageInfoScreen
      onBack={() => navigate(-1)}
      readBy={readBy}
      notReadBy={notReadBy}
      bubble={
        <div className="bg-[#dbeafe] dark:bg-[#0b3d24] rounded-xl rounded-tr-sm py-2 px-2.5">
          {broadcast.message_type === "image" && broadcast.media_url ? (
            <img
              src={broadcast.media_url}
              alt=""
              className="rounded-lg max-h-[220px] w-full object-cover -mx-0.5"
            />
          ) : broadcast.message_type === "document" ? (
            <div className="flex items-center gap-2.5 py-1.5 px-1 min-w-[180px]">
              <FileText size={18} className="text-[#1a1a1a] dark:text-[#e9edef] shrink-0" />
              <span className="text-[#1a1a1a] dark:text-[#e9edef] text-sm truncate">
                {broadcast.file_name ?? "Document"}
              </span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-[#1a1a1a] dark:text-[#e9edef] text-[15px] m-0 px-1">
              {broadcast.text}
            </p>
          )}
          <div className="flex items-center justify-end gap-1 text-[11px] text-[#3b5bdb] dark:text-[#93b4f5] mt-1 px-1">
            {time}
            <CheckCheck size={14} className={readBy.length > 0 ? "text-[var(--chat-tick-read)]" : undefined} />
          </div>
        </div>
      }
    />
  );
}
