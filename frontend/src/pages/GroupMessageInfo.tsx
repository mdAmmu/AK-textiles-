import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCheck, FileText } from "lucide-react";
import { fetchGroupMessageReads, fetchGroupMessages, type GroupMessageReadInfo } from "../services/groups";
import type { Message } from "../types/message";
import MessageInfoScreen, {
  type MessageNotReaderRow,
  type MessageReaderRow,
} from "../components/chat/MessageInfoScreen";
import LoadingScreen from "../components/common/LoadingScreen";

export default function GroupMessageInfo() {
  const { groupId, messageId } = useParams<{ groupId: string; messageId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [message, setMessage] = useState<Message | null>(
    (location.state as { message?: Message } | null)?.message ?? null,
  );
  const [info, setInfo] = useState<GroupMessageReadInfo | null>(null);

  useEffect(() => {
    if (!groupId || !messageId) return;
    fetchGroupMessageReads(groupId, messageId).then(setInfo);
    if (!message) {
      fetchGroupMessages(groupId).then((all) => setMessage(all.find((m) => m.id === messageId) ?? null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, messageId]);

  if (message === null || info === null) return <LoadingScreen />;

  const readBy: MessageReaderRow[] = info.read_by.map((r) => ({
    id: r.user_id,
    name: r.name,
    readAt: r.read_at,
  }));
  const notReadBy: MessageNotReaderRow[] = info.not_read_by.map((r) => ({
    id: r.user_id,
    name: r.name,
  }));

  const time = new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <MessageInfoScreen
      onBack={() => navigate(-1)}
      readBy={readBy}
      notReadBy={notReadBy}
      bubble={
        <div className="bg-[var(--chat-bubble-own)] rounded-lg py-1.5 px-2 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
          {message.message_type === "IMAGE" && message.product_image ? (
            <img src={message.product_image} alt="" className="rounded-md max-h-[220px] w-full object-cover" />
          ) : message.message_type === "DOCUMENT" ? (
            <div className="flex items-center gap-2.5 py-1 px-1 min-w-[180px]">
              <FileText size={20} className="text-[var(--chat-text)] shrink-0" />
              <span className="text-[var(--chat-text)] text-sm truncate">{message.file_name}</span>
            </div>
          ) : message.message_type === "PRODUCT" ? (
            <p className="m-0 py-0.5 px-1 text-[var(--chat-text)]">{message.product_name}</p>
          ) : (
            <p className="m-0 py-0.5 px-1 whitespace-pre-wrap break-words text-[var(--chat-text)]">
              {message.text}
            </p>
          )}
          <div className="flex items-center justify-end gap-1 text-[11px] text-[var(--chat-text-secondary)] mt-0.5 px-1">
            {time}
            <CheckCheck
              size={14}
              className={readBy.length > 0 ? "text-[var(--chat-tick-read)]" : undefined}
            />
          </div>
        </div>
      }
    />
  );
}
