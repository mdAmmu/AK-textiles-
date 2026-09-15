import { useMemo, useState } from "react";
import { MoreVertical, Users } from "lucide-react";
import AdminHomeHeader from "./AdminHomeHeader";
import AdminNav from "./AdminNav";
import GroupChatListItem from "./GroupChatListItem";
import LoadingScreen from "../common/LoadingScreen";
import type { Group } from "../../types/group";

interface Props {
  adminName?: string;
  groups: Group[] | null;
  activeGroupId?: string;
  onMenuClick: () => void;
  onProfileClick: () => void;
  onManageClick: () => void;
}

export default function AdminGroupListPane({
  adminName,
  groups,
  activeGroupId,
  onMenuClick,
  onProfileClick,
  onManageClick,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!groups) return groups;
    const term = search.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(term));
  }, [groups, search]);

  return (
    <div className="relative flex flex-col h-full min-h-0">
      <AdminHomeHeader
        adminName={adminName}
        subtitle="Group manager"
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search groups"
      />

      <AdminNav />

      <div className="flex items-center justify-between mx-[1.125rem] mb-2">
        <span className="text-sm font-bold text-[#1a1a1a] dark:text-[#e9edef]">Your Groups</span>
        <button
          className="flex border-none bg-transparent text-[#1a1a1a] dark:text-[#e9edef] cursor-pointer p-1"
          aria-label="Manage groups"
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
            <Users size={40} />
            <p className="max-w-[240px]">
              {groups && groups.length > 0
                ? "No groups match your search."
                : "No groups yet. Create one, add staff, and manage them together — from one place."}
            </p>
            <button
              className="mt-1 border-none bg-[#2563eb] text-white font-semibold text-sm rounded-full py-2.5 px-5 cursor-pointer"
              onClick={onManageClick}
            >
              Create Group
            </button>
          </div>
        ) : (
          filtered.map((g) => (
            <GroupChatListItem key={g.id} group={g} active={g.id === activeGroupId} />
          ))
        )}
      </main>
    </div>
  );
}
