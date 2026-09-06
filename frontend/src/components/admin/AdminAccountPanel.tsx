import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Megaphone,
  MessageCircle,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "../../types/user";
import Avatar from "../common/Avatar";

// Send WhatsApp Message is disabled here for now — left in place, not
// deleted, so re-enabling is a one-line flip. Group management moved to
// GroupManagementPanel, reachable from the Manager tab's "..." menu.
const SHOW_SEND_WHATSAPP = false;

const SECTION = "border-t-8 border-[var(--wa-panel-bg)] p-4";
const ADD_GROUP_BTN =
  "flex items-center justify-center gap-2 w-full py-3 border-none rounded-lg bg-[var(--wa-accent)] text-white font-semibold text-[15px] cursor-pointer no-underline";
const ROW_BASE =
  "flex items-center gap-3.5 w-full py-[0.9375rem] px-4 border-none bg-transparent font-[inherit] text-left cursor-pointer text-[#1a1a1a] dark:text-[#e9edef] border-b border-[#eef1ee] dark:border-[#232d3a] last:border-b-0";
const ROW_ICON = "text-[#2563eb] dark:text-[#3b82f6] shrink-0";
const ROW_LABEL = "flex-1 font-medium";
const ROW_CHEVRON = "text-[#c2c6c3] dark:text-[#6b7480] shrink-0";

const MENU_OPTIONS = [
  { key: "campaign", label: "Campaign", icon: Megaphone, path: "/admin/campaign" },
  { key: "templates", label: "Template", icon: FileText, path: "/admin/templates" },
  { key: "balance", label: "Balance", icon: Wallet, path: "/admin/balance" },
  { key: "orders", label: "Order", icon: ShoppingBag, path: "/admin/orders" },
] as const;

interface Props {
  admin: User;
  onClose: () => void;
}

export default function AdminAccountPanel({ admin, onClose }: Props) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-white dark:bg-[#131a24] flex flex-col z-10">
      <div className="flex items-center gap-3 py-3.5 px-4 shrink-0">
        <button
          className="flex border-none bg-transparent text-[var(--wa-text)] cursor-pointer p-1"
          onClick={onClose}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-semibold text-[17px]">Account</span>
      </div>

      <div className="flex flex-col items-center gap-2 pt-2 px-4 pb-5 text-center">
        <Avatar name={admin.name} size={96} imageUrl="/ak-logo.png" />
        <h1 className="mt-1 mb-0 text-[1.375rem]">{admin.name}</h1>
        {(admin.phone || admin.email) && (
          <span className="text-[var(--wa-text-secondary)] text-sm">
            {admin.phone ?? admin.email}
          </span>
        )}
      </div>

      {SHOW_SEND_WHATSAPP && (
        <div className={SECTION}>
          <Link to="/admin/whatsapp-send" className={ADD_GROUP_BTN}>
            <MessageCircle size={18} /> Send WhatsApp Message
          </Link>
        </div>
      )}

      <div className={SECTION}>
        <div className="bg-white dark:bg-[#1e2530] rounded-2xl overflow-hidden shadow-[0_4px_18px_rgba(37,99,235,0.06)] dark:shadow-none border border-[#eef1ee] dark:border-[#232d3a]">
          {MENU_OPTIONS.map(({ key, label, icon: Icon, path }) => (
            <button key={key} type="button" className={ROW_BASE} onClick={() => navigate(path)}>
              <Icon size={19} className={ROW_ICON} />
              <span className={ROW_LABEL}>{label}</span>
              <ChevronRight size={18} className={ROW_CHEVRON} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
