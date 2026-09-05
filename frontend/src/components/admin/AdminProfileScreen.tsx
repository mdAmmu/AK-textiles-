import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  ChevronRight,
  Clock,
  IdCard,
  Lock,
  LogOut,
  Mail,
  Moon,
  Phone,
  Shield,
  User as UserIcon,
} from "lucide-react";
import type { User } from "../../types/user";
import { useTheme } from "../../contexts/ThemeContext";
import { logout } from "../../services/auth";
import Avatar from "../common/Avatar";
import DetailsCard from "../common/DetailsCard";
import ThemeToggle from "../common/ThemeToggle";
import logo from "../../assets/ak-logo.png";

const ROLE_LABEL: Record<User["role"], string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
  USER: "Customer",
};

interface Props {
  admin: User;
  onClose: () => void;
}

const ROWS = [
  { icon: Lock, label: "Privacy" },
  { icon: Bell, label: "Notifications" },
  { icon: Clock, label: "Storage and Data" },
];

const ROW =
  "flex items-center gap-3.5 py-3.5 px-1.5 border-none border-b border-[#eef1ee] dark:border-[#232d3a] bg-transparent font-[inherit] text-left cursor-pointer text-[#1a1a1a] dark:text-[#e9edef]";
const ROW_ICON = "text-[#6b7069] dark:text-[#8b96a5] shrink-0";
const ROW_LABEL = "flex-1 font-medium";
const ROW_CHEVRON = "text-[#c2c6c3] dark:text-[#6b7480] shrink-0";
const CANCEL_BTN =
  "flex-1 py-3 border border-[#e2e6e3] dark:border-[#2a3341] rounded-lg bg-transparent text-[#1a1a1a] dark:text-[#e9edef] font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

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
    <div className="fixed inset-0 bg-[#eef2f0] dark:bg-[#10161f] flex flex-col z-10 overflow-y-auto">
      <div className="relative shrink-0 mx-3 mt-3 pb-7 bg-[linear-gradient(135deg,#2563eb,#60a5fa)] rounded-t-3xl">
        <div className="flex items-center gap-2.5 py-8 px-[1.125rem] text-white font-bold text-[17px]">
          <button
            className="flex border-none bg-transparent text-white cursor-pointer p-1"
            onClick={onClose}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <span>Profile</span>
        </div>
        <div className="flex justify-center absolute left-0 right-0 bottom-0 translate-y-1/2">
          <Avatar name={admin.name} imageUrl={logo} size={92} className="border-4 border-white" />
        </div>
      </div>

      <div className="flex-1 mx-3 mb-3 bg-white dark:bg-[#1e2530] rounded-b-3xl shadow-[0_4px_20px_rgba(37,99,235,0.08)] dark:shadow-none">
        <div className="flex flex-col items-center text-center pt-16 px-6">
          <h1 className="text-xl font-bold text-[#1a1a1a] dark:text-[#e9edef]">{admin.name}</h1>
          {(admin.phone || admin.email) && (
            <span className="mt-1 text-[#6b7069] dark:text-[#8b96a5] text-[15px]">
              {admin.phone ?? admin.email}
            </span>
          )}
          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-[#e6edff] dark:bg-[#1e2a4a] text-[#2563eb] dark:text-[#60a5fa] text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" /> Active
            </span>
            <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-[#e6edff] dark:bg-[#1e2a4a] text-[#2563eb] dark:text-[#60a5fa] text-xs font-semibold">
              <Shield size={13} /> {ROLE_LABEL[admin.role]}
            </span>
          </div>
        </div>

        <DetailsCard
          icon={IdCard}
          title="User Details"
          subtitle="Basic identity and workspace information"
          items={[
            { icon: UserIcon, label: "Full Name", value: admin.name },
            ...(admin.email ? [{ icon: Mail, label: "Email", value: admin.email }] : []),
            ...(admin.phone ? [{ icon: Phone, label: "Phone", value: admin.phone }] : []),
            { icon: BadgeCheck, label: "Role", value: ROLE_LABEL[admin.role] },
          ]}
        />

        <div className="flex flex-col mt-4 px-[1.125rem] pb-8">
          <div className={`${ROW} cursor-default`}>
            <Moon size={19} className={ROW_ICON} />
            <span className={ROW_LABEL}>
              Theme
              <span className="block mt-0.5 text-xs font-normal text-[#9a9e9b] dark:text-[#6b7480]">
                {theme === "dark" ? "Dark" : "Light"}
              </span>
            </span>
            <ThemeToggle />
          </div>

          <button type="button" className={ROW}>
            <UserIcon size={19} className={ROW_ICON} />
            <span className={ROW_LABEL}>Account</span>
            <ChevronRight size={18} className={ROW_CHEVRON} />
          </button>

          {ROWS.map(({ icon: Icon, label }) => (
            <button key={label} type="button" className={ROW}>
              <Icon size={19} className={ROW_ICON} />
              <span className={ROW_LABEL}>{label}</span>
              <ChevronRight size={18} className={ROW_CHEVRON} />
            </button>
          ))}

          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full mt-5 py-3 border-none rounded-lg bg-[#fdecea] dark:bg-[#3a1c1c] text-[#d92d20] dark:text-[#ff8177] font-semibold text-[15px] cursor-pointer"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-6 z-20">
          <div className="bg-white dark:bg-[#1e2530] rounded-xl p-5 max-w-[320px] w-full">
            <h2 className="mt-0 mb-2 text-[17px] text-[#1a1a1a] dark:text-[#e9edef]">Logout?</h2>
            <p className="m-0 text-[#6b7069] dark:text-[#8b96a5] text-sm leading-[1.4]">
              You'll need to sign in again to access the admin panel.
            </p>
            <div className="flex gap-2.5 mt-5">
              <button className={CANCEL_BTN} onClick={() => setShowLogoutConfirm(false)} disabled={loggingOut}>
                Cancel
              </button>
              <button
                className="flex-1 py-3 border-none rounded-lg bg-[#d92d20] text-white font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
