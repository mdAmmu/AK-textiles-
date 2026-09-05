import type { ReactNode } from "react";
import { Menu, Search } from "lucide-react";
import Avatar from "../common/Avatar";
import logo from "../../assets/ak-logo.png";

interface Props {
  adminName?: string;
  onMenuClick: () => void;
  onProfileClick: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  trailing?: ReactNode;
}

export default function AdminHomeHeader({
  adminName,
  onMenuClick,
  onProfileClick,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  trailing,
}: Props) {
  return (
    <>
      <header className="flex items-center pt-[1.125rem] px-[1.125rem] shrink-0">
        <button
          className="flex border-none bg-transparent text-[#1a1a1a] dark:text-[#e9edef] cursor-pointer p-1.5"
          aria-label="Menu"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>
        <div className="flex-1" />
        <button
          className="flex border-none bg-transparent p-0 cursor-pointer rounded-full"
          aria-label="Profile"
          onClick={onProfileClick}
        >
          <Avatar name={adminName ?? "Admin"} imageUrl={logo} size={44} />
        </button>
      </header>

      <div className="flex items-center gap-2.5 mx-[1.125rem] mt-[1.125rem] mb-2 shrink-0 min-w-0">
        <div className="flex-1 min-w-0 flex items-center gap-2.5 py-[0.8125rem] px-[1.125rem] bg-white dark:bg-[#1e2530] rounded-2xl shadow-[0_4px_18px_rgba(37,99,235,0.08)] dark:shadow-none dark:border dark:border-[#232d3a]">
          <span className="flex text-[#7c827e] dark:text-[#8b96a5]">
            <Search size={18} />
          </span>
          <input
            className="flex-1 min-w-0 border-none outline-none bg-transparent p-0 font-[inherit] text-[#1a1a1a] dark:text-[#e9edef] placeholder:text-[#b7bcb9]"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {trailing}
      </div>
    </>
  );
}
