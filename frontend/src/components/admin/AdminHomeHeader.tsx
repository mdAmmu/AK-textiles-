import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import Avatar from "../common/Avatar";
import logo from "../../assets/ak-logo.png";

interface Props {
  adminName?: string;
  subtitle?: string;
  onMenuClick: () => void;
  onProfileClick: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
}

export default function AdminHomeHeader({
  adminName,
  subtitle = "Info account",
  onMenuClick,
  onProfileClick,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false);

  function closeSearch() {
    setSearchOpen(false);
    onSearchChange("");
  }

  return (
    <>
      <header className="flex items-center gap-3 pt-[1.125rem] px-[1.125rem] shrink-0">
        <button
          className="flex items-center gap-3 border-none bg-transparent p-0 cursor-pointer text-left min-w-0"
          aria-label="Profile"
          onClick={onProfileClick}
        >
          <Avatar name={adminName ?? "Admin"} imageUrl={logo} size={44} />
          <span className="min-w-0 md:hidden">
            <span className="block font-semibold text-[#1a1a1a] dark:text-[#e9edef] truncate">
              {adminName ?? "Admin"}
            </span>
            <span className="block text-xs text-[#9a9e9b] dark:text-[#8b96a5] truncate">
              {subtitle}
            </span>
          </span>
        </button>
        <div className="flex-1" />
        <button
          className={`flex border-none bg-transparent cursor-pointer p-1.5 ${searchOpen ? "text-[#2563eb] dark:text-[#60a5fa]" : "text-[#7c827e] dark:text-[#8b96a5]"}`}
          aria-label={searchOpen ? "Close search" : "Search"}
          aria-pressed={searchOpen}
          onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
        >
          <Search size={20} />
        </button>
        <button
          className="flex border-none bg-transparent text-[#7c827e] dark:text-[#8b96a5] cursor-pointer p-1.5"
          aria-label="More options"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>
      </header>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out shrink-0 ${searchOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="flex items-center gap-2.5 mx-[1.125rem] mt-[1.125rem] mb-2 min-w-0">
            <div className="flex-1 min-w-0 flex items-center gap-2.5 py-[0.8125rem] px-[1.125rem] bg-white dark:bg-[#1e2530] rounded-2xl shadow-[0_4px_18px_rgba(37,99,235,0.08)] dark:shadow-none dark:border dark:border-[#232d3a]">
              <span className="flex text-[#7c827e] dark:text-[#8b96a5]">
                <Search size={18} />
              </span>
              <input
                className="flex-1 min-w-0 border-none outline-none bg-transparent p-0 font-[inherit] text-[#1a1a1a] dark:text-[#e9edef] placeholder:text-[#b7bcb9]"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus={searchOpen}
              />
              {searchValue && (
                <button
                  className="flex border-none bg-transparent p-0.5 cursor-pointer text-[#7c827e] dark:text-[#8b96a5]"
                  aria-label="Clear search"
                  onClick={() => onSearchChange("")}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              className="flex border-none bg-transparent p-1.5 cursor-pointer text-[#7c827e] dark:text-[#8b96a5]"
              aria-label="Close search"
              onClick={closeSearch}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
