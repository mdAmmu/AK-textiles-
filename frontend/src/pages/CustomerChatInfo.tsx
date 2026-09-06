import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BadgeInfo, Calendar, ChevronRight, Images, Phone, User as UserIcon } from "lucide-react";
import DetailsCard from "../components/common/DetailsCard";
import StatusPill from "../components/common/StatusPill";
import Avatar from "../components/common/Avatar";
import { fetchConversationMessages, type ConversationDetail } from "../services/chat";
import type { Message } from "../types/message";
import LoadingScreen from "../components/common/LoadingScreen";

const ROW_BASE =
  "flex items-center gap-3.5 w-full py-[0.9375rem] px-4 border-none bg-transparent font-[inherit] text-left cursor-pointer text-[#1a1a1a] dark:text-[#e9edef]";
const ROW_ICON = "text-[#2563eb] dark:text-[#3b82f6] shrink-0";
const ROW_LABEL = "flex-1 font-medium";
const ROW_CHEVRON = "text-[#c2c6c3] dark:text-[#6b7480] shrink-0 transition-transform duration-150 ease-in-out";
const EMPTY_TEXT = "py-4 text-[#7c827e] dark:text-[#8b96a5]";

function formatJoinedDate(iso?: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function CustomerChatInfo() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [showMedia, setShowMedia] = useState(false);
  const [media, setMedia] = useState<Message[] | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    fetchConversationMessages(conversationId).then(setConversation);
  }, [conversationId]);

  function handleToggleMedia() {
    setShowMedia((s) => {
      const next = !s;
      if (next && conversation) {
        setMedia(
          conversation.messages.filter(
            (m) => m.message_type === "IMAGE" && m.product_image && !m.is_deleted,
          ),
        );
      }
      return next;
    });
  }

  if (conversation === null) return <LoadingScreen />;

  const joined = formatJoinedDate(conversation.user_created_at);

  return (
    <div className="flex flex-col min-h-dvh bg-[#eef2f0] dark:bg-[#10161f] pb-8">
      <div className="relative flex flex-col items-center gap-1.5 pt-11 px-4 pb-6 bg-[linear-gradient(135deg,#2563eb,#60a5fa)] rounded-b-3xl">
        <button
          className="absolute top-4 left-4 flex border-none bg-transparent text-white cursor-pointer p-1"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <Avatar name={conversation.user_name} size={80} className="ring-4 ring-white/25" />
        <h1 className="mt-2 mb-0 text-xl font-bold text-white">{conversation.user_name}</h1>
        {conversation.user_phone && <span className="text-white/85 text-sm">{conversation.user_phone}</span>}
        <div className="flex items-center gap-2 mt-2">
          <StatusPill label="Customer" icon={UserIcon} />
        </div>
      </div>

      <DetailsCard
        icon={BadgeInfo}
        title="Customer Details"
        subtitle="Basic profile and contact information"
        items={[
          { icon: UserIcon, label: "Name", value: conversation.user_name },
          ...(conversation.user_phone
            ? [{ icon: Phone, label: "Phone", value: conversation.user_phone }]
            : []),
          ...(joined ? [{ icon: Calendar, label: "Customer Since", value: joined }] : []),
        ]}
      />

      <div className="mt-4 mx-4 bg-white dark:bg-[#1e2530] rounded-2xl overflow-hidden shadow-[0_4px_18px_rgba(37,99,235,0.06)] dark:shadow-none">
        <button className={ROW_BASE} type="button" onClick={handleToggleMedia}>
          <Images size={19} className={ROW_ICON} />
          <span className={ROW_LABEL}>Media, Links &amp; Docs</span>
          <ChevronRight size={18} className={`${ROW_CHEVRON}${showMedia ? " rotate-90" : ""}`} />
        </button>

        {showMedia && (
          <div className="px-4 pb-2 border-t border-[#eef1ee] dark:border-[#232d3a]">
            {media === null ? (
              <p className={EMPTY_TEXT}>Loading…</p>
            ) : media.length === 0 ? (
              <p className={EMPTY_TEXT}>No media shared yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 py-3">
                {media.map((m) => (
                  <img
                    key={m.id}
                    className="w-full aspect-square object-cover rounded-md"
                    src={m.product_image!}
                    alt=""
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
