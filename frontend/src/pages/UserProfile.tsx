import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Moon } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { logout } from "../services/auth";
import { useTheme } from "../contexts/ThemeContext";
import { fetchMyGroupMessages } from "../services/groups";
import { fetchMyConversation } from "../services/chat";
import type { Message } from "../types/message";
import Avatar from "../components/common/Avatar";
import ThemeToggle from "../components/common/ThemeToggle";
import LoadingScreen from "../components/common/LoadingScreen";

export default function UserProfile() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { theme } = useTheme();

  const [media, setMedia] = useState<Message[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadMessages =
      user.role === "STAFF"
        ? fetchMyGroupMessages()
        : fetchMyConversation().then((c) => c.messages);
    loadMessages.then((messages) =>
      setMedia(
        messages.filter((m) => m.message_type === "IMAGE" && m.product_image && !m.is_deleted),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (!user) return <LoadingScreen />;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--wa-bubble-other)]">
      <header className="flex items-center py-3.5 px-4 shrink-0">
        <button
          className="flex border-none bg-transparent text-[var(--wa-text)] cursor-pointer p-1"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
      </header>

      <div className="flex flex-col items-center gap-2 pt-2 px-4 pb-5 text-center">
        <Avatar name={user.name} size={112} />
        <h1 className="mt-1 mb-0 text-[1.375rem]">{user.name} (You)</h1>
        {(user.phone || user.email) && (
          <span className="text-[var(--wa-text-secondary)] text-sm">
            {user.phone ?? user.email}
          </span>
        )}
      </div>

      <div className="border-t-8 border-[var(--wa-panel-bg)] py-3.5 px-4 pb-5">
        <div className="flex items-center gap-3.5">
          <Moon size={19} className="text-[var(--wa-text-secondary)] shrink-0" />
          <span className="flex-1 font-medium text-[var(--wa-text)]">
            Theme
            <span className="block mt-0.5 text-xs font-normal text-[var(--wa-text-secondary)]">
              {theme === "dark" ? "Dark" : "Light"}
            </span>
          </span>
          <ThemeToggle />
        </div>
      </div>

      <div className="border-t-8 border-[var(--wa-panel-bg)] py-3.5 px-4 pb-5">
        <div className="flex items-center justify-between text-[var(--wa-text-secondary)] font-semibold text-[15px] mb-3">
          <span>Media</span>
          {media && <span>{media.length}</span>}
        </div>

        {media === null ? (
          <LoadingScreen />
        ) : media.length === 0 ? (
          <p className="text-[var(--wa-text-secondary)] text-sm">No media shared yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
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

      <button
        className="flex items-center justify-center gap-2 m-4 py-3 border-none rounded-lg bg-[#fdecea] text-[#d92d20] font-semibold text-[15px] cursor-pointer"
        onClick={handleLogout}
      >
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
}
