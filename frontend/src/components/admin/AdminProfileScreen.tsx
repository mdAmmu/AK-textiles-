import { ArrowLeft, Bell, ChevronRight, Clock, Lock, Moon, User as UserIcon } from "lucide-react";
import type { User } from "../../types/user";
import { useTheme } from "../../contexts/ThemeContext";
import Avatar from "../common/Avatar";
import ThemeToggle from "../common/ThemeToggle";
import "./AdminProfileScreen.css";

interface Props {
  admin: User;
  imageUrl?: string | null;
  onClose: () => void;
}

const ROWS = [
  { icon: UserIcon, label: "Account" },
  { icon: Lock, label: "Privacy" },
  { icon: Bell, label: "Notifications" },
  { icon: Clock, label: "Storage and Data" },
];

export default function AdminProfileScreen({ admin, imageUrl, onClose }: Props) {
  const { theme } = useTheme();

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
          <Avatar name={admin.name} imageUrl={imageUrl} online size={92} />
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

          {ROWS.map(({ icon: Icon, label }) => (
            <button key={label} type="button" className="admin-profile-screen__row">
              <Icon size={19} className="admin-profile-screen__row-icon" />
              <span className="admin-profile-screen__row-label">{label}</span>
              <ChevronRight size={18} className="admin-profile-screen__row-chevron" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
