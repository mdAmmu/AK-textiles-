import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import AdminChatListPane from "../components/admin/AdminChatListPane";
import AdminAccountPanel from "../components/admin/AdminAccountPanel";
import AdminProfileScreen from "../components/admin/AdminProfileScreen";
import StartChatPanel from "../components/admin/StartChatPanel";
import { useAdminConversations } from "../hooks/useAdminConversations";
import type { User } from "../types/user";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function AdminChatsHome() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const { conversations, startChat } = useAdminConversations();
  const [showAccount, setShowAccount] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showStartChat, setShowStartChat] = useState(false);

  async function handleStartChat(customer: User) {
    const conversation = await startChat(customer);
    setShowStartChat(false);
    navigate(`/admin/chats/${conversation.id}`);
  }

  return (
    <div className="relative flex h-dvh bg-[linear-gradient(180deg,#eaf0ff_0%,#f5f8ff_40%,#ffffff_75%)] dark:bg-[#10161f] md:pl-[76px]">
      <div className="flex flex-col w-full md:w-[400px] md:shrink-0 md:border-r md:border-[#eef1ee] md:dark:border-[#232d3a] min-h-0">
        <AdminChatListPane
          adminName={user?.name}
          conversations={conversations}
          onMenuClick={() => setShowAccount(true)}
          onProfileClick={() => setShowProfile(true)}
          onStartChat={() => setShowStartChat(true)}
        />
      </div>

      <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-3 text-[#9a9e9b] dark:text-[#6b7480] bg-white dark:bg-[#151b25]">
        <MessageCircle size={48} strokeWidth={1.5} />
        <p className="text-sm">Select a chat to start messaging</p>
      </div>

      {showProfile && user && <AdminProfileScreen admin={user} onClose={() => setShowProfile(false)} />}

      {showAccount && user && (
        <AdminAccountPanel admin={user} onClose={() => setShowAccount(false)} />
      )}

      {showStartChat && (
        <StartChatPanel
          excludeIds={conversations?.map((c) => c.user_id) ?? []}
          onChat={handleStartChat}
          onClose={() => setShowStartChat(false)}
        />
      )}
    </div>
  );
}
