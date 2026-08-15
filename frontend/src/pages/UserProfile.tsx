import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Moon } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { logout } from "../services/auth";
import { useTheme } from "../contexts/ThemeContext";
import { fetchMyGroupMessages } from "../services/groups";
import type { Message } from "../types/message";
import Avatar from "../components/common/Avatar";
import ThemeToggle from "../components/common/ThemeToggle";
import LoadingScreen from "../components/common/LoadingScreen";
import "./UserProfile.css";

export default function UserProfile() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { theme } = useTheme();

  const [media, setMedia] = useState<Message[] | null>(null);

  useEffect(() => {
    fetchMyGroupMessages().then((messages) =>
      setMedia(messages.filter((m) => m.message_type === "IMAGE" && m.product_image)),
    );
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (!user) return <LoadingScreen />;

  return (
    <div className="user-profile-page">
      <header className="user-profile-page__header">
        <button onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
      </header>

      <div className="user-profile-page__hero">
        <Avatar name={user.name} size={112} />
        <h1>{user.name} (You)</h1>
        {(user.phone || user.email) && (
          <span className="user-profile-page__meta">{user.phone ?? user.email}</span>
        )}
      </div>

      <div className="user-profile-page__section">
        <div className="user-profile-page__row">
          <Moon size={19} className="user-profile-page__row-icon" />
          <span className="user-profile-page__row-label">
            Theme
            <span className="user-profile-page__row-sublabel">
              {theme === "dark" ? "Dark" : "Light"}
            </span>
          </span>
          <ThemeToggle />
        </div>
      </div>

      <div className="user-profile-page__section">
        <div className="user-profile-page__section-header">
          <span>Media</span>
          {media && <span className="user-profile-page__section-count">{media.length}</span>}
        </div>

        {media === null ? (
          <LoadingScreen />
        ) : media.length === 0 ? (
          <p className="user-profile-page__empty">No media shared yet.</p>
        ) : (
          <div className="user-profile-page__media-grid">
            {media.map((m) => (
              <img key={m.id} src={m.product_image!} alt="" />
            ))}
          </div>
        )}
      </div>

      <button className="user-profile-page__logout" onClick={handleLogout}>
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
}
