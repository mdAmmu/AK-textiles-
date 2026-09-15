import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, Radio } from "lucide-react";
import AdminHomeHeader from "./AdminHomeHeader";
import AdminNav from "./AdminNav";
import LoadingScreen from "../common/LoadingScreen";
import type { BroadcastAudience } from "../../types/broadcastMessage";
import { formatGroupTimestamp } from "../../utils/formatGroupTimestamp";

interface Props {
  adminName?: string;
  audiences: BroadcastAudience[] | null;
  activeAudienceId?: string;
  onMenuClick: () => void;
  onProfileClick: () => void;
  onManageClick: () => void;
}

export default function AdminAudienceListPane({
  adminName,
  audiences,
  activeAudienceId,
  onMenuClick,
  onProfileClick,
  onManageClick,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!audiences) return audiences;
    const term = search.trim().toLowerCase();
    if (!term) return audiences;
    return audiences.filter((a) => a.name.toLowerCase().includes(term));
  }, [audiences, search]);

  return (
    <div className="relative flex flex-col h-full min-h-0">
      <AdminHomeHeader
        adminName={adminName}
        subtitle="Broadcast audiences"
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search broadcasts"
      />

      <AdminNav />

      <div className="flex items-center justify-between mx-[1.125rem] mb-2">
        <span className="text-sm font-bold text-[#1a1a1a] dark:text-[#e9edef]">Broadcast</span>
        <button
          className="flex border-none bg-transparent text-[#1a1a1a] dark:text-[#e9edef] cursor-pointer p-1"
          aria-label="Manage broadcasts"
          onClick={onManageClick}
        >
          <MoreVertical size={18} />
        </button>
      </div>

      <main className="flex-1 overflow-y-auto pb-6">
        {filtered === null ? (
          <LoadingScreen />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center text-[#7c827e] dark:text-[#8b96a5] mt-16 px-6">
            <Radio size={40} />
            <p className="max-w-[240px]">
              {audiences && audiences.length > 0
                ? "No broadcasts match your search."
                : "No broadcasts yet. Create one, add recipients, and message all of them privately at once — from one place."}
            </p>
            <button
              className="mt-1 border-none bg-[#2563eb] text-white font-semibold text-sm rounded-full py-2.5 px-5 cursor-pointer"
              onClick={onManageClick}
            >
              Create Broadcast
            </button>
          </div>
        ) : (
          filtered.map((a) => {
            const active = a.id === activeAudienceId;
            return (
              <Link
                key={a.id}
                to={`/admin/broadcast/${a.id}`}
                className={`flex items-center gap-3.5 py-3 px-3.5 no-underline text-inherit border-b border-[#f1f2ef] dark:border-[#20293380] ${
                  active ? "bg-[#eaf0ff] dark:bg-[#1c2a45]" : "bg-transparent"
                }`}
              >
                <span className="w-12 h-12 rounded-xl bg-[#e6edff] dark:bg-[#1c2a45] flex items-center justify-center shrink-0">
                  <Radio size={22} color="#2563eb" />
                </span>
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="font-semibold text-[#1a1a1a] dark:text-[#e9edef] truncate">
                    {a.name}
                  </span>
                  <span className="text-[#8b8f8c] text-sm mt-0.5 dark:text-[#8b96a5]">
                    {a.member_count} recipient{a.member_count === 1 ? "" : "s"}
                  </span>
                </div>
                <span className="text-[#9a9e9b] text-xs dark:text-[#6b7480] shrink-0">
                  {formatGroupTimestamp(a.updated_at)}
                </span>
              </Link>
            );
          })
        )}
      </main>
    </div>
  );
}
