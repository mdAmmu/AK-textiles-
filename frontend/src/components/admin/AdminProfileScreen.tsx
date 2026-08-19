import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Clock,
  Lock,
  LogOut,
  Moon,
  User as UserIcon,
} from "lucide-react";
import type { User } from "../../types/user";
import { useTheme } from "../../contexts/ThemeContext";
import { logout } from "../../services/auth";
import Avatar from "../common/Avatar";
import ThemeToggle from "../common/ThemeToggle";
import logo from "../../assets/ak-logo.png";
import "./AdminProfileScreen.css";

interface Props {
  admin: User;
  onClose: () => void;
}

const ROWS = [
  { icon: Lock, label: "Privacy" },
  { icon: Bell, label: "Notifications" },
  { icon: Clock, label: "Storage and Data" },
];

export default function AdminProfileScreen({ admin, onClose }: Props) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleConfirmLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="admin-profile-screen">
      <div className="admin-profile-screen__hero">
        <div className="admin-profile-screen__hero-header">
          <button onClick={onClose} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <span>Profile</span>
          {/* <button aria-label="Edit profile">
            <Pencil size={18} />
          </button> */}
        </div>
        <div className="admin-profile-screen__avatar-wrap">
          <Avatar name={admin.name} imageUrl={logo} size={92} />
        </div>
      </div>

      <div className="admin-profile-screen__body">
        <div className="admin-profile-screen__identity">
          <h1>{admin.name}</h1>
          {(admin.phone || admin.email) && <span>{admin.phone ?? admin.email}</span>}
          <p>Hey there! I am using this app.</p>
        </div>

        <div className="admin-profile-screen__list">
          <div className="admin-profile-screen__row admin-profile-screen__row--theme">
            <Moon size={19} className="admin-profile-screen__row-icon" />
            <span className="admin-profile-screen__row-label">
              Theme
              <span className="admin-profile-screen__row-sublabel">
                {theme === "dark" ? "Dark" : "Light"}
              </span>
            </span>
            <ThemeToggle />
          </div>

          <button type="button" className="admin-profile-screen__row">
            <UserIcon size={19} className="admin-profile-screen__row-icon" />
            <span className="admin-profile-screen__row-label">Account</span>
            <ChevronRight size={18} className="admin-profile-screen__row-chevron" />
          </button>

          {ROWS.map(({ icon: Icon, label }) => (
            <button key={label} type="button" className="admin-profile-screen__row">
              <Icon size={19} className="admin-profile-screen__row-icon" />
              <span className="admin-profile-screen__row-label">{label}</span>
              <ChevronRight size={18} className="admin-profile-screen__row-chevron" />
            </button>
          ))}

          <button
            type="button"
            className="admin-profile-screen__logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="admin-profile-screen__confirm-overlay">
          <div className="admin-profile-screen__confirm-dialog">
            <h2>Logout?</h2>
            <p>You'll need to sign in again to access the admin panel.</p>
            <div className="admin-profile-screen__confirm-actions">
              <button
                className="admin-profile-screen__cancel-btn"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
              >
                Cancel
              </button>
              <button
                className="admin-profile-screen__logout-confirm-btn"
                onClick={handleConfirmLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
