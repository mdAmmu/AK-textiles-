import { useEffect, useMemo, useState } from "react";
import { MoreVertical } from "lucide-react";
import { fetchGroups } from "../services/groups";
import type { Group } from "../types/group";
import { useCurrentUser } from "../hooks/useCurrentUser";
import AdminHomeHeader from "../components/admin/AdminHomeHeader";
import GroupChatListItem from "../components/admin/GroupChatListItem";
import AdminAccountPanel from "../components/admin/AdminAccountPanel";
import AdminProfileScreen from "../components/admin/AdminProfileScreen";
import GroupManagementPanel from "../components/admin/GroupManagementPanel";
import LoadingScreen from "../components/common/LoadingScreen";
import BottomNav from "../components/admin/BottomNav";

export default function AdminDashboard() {
  const { user } = useCurrentUser();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [search, setSearch] = useState("");
  const [showAccount, setShowAccount] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGroupManagement, setShowGroupManagement] = useState(false);

  useEffect(() => {
    fetchGroups().then(setGroups);
  }, []);

  const filtered = useMemo(() => {
    if (!groups) return groups;
    const term = search.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(term));
  }, [groups, search]);

  return (
    <div className="relative flex flex-col h-dvh bg-[linear-gradient(180deg,#eaf7ee_0%,#f6fbf7_40%,#ffffff_75%)] dark:bg-[#10161f]">
      <AdminHomeHeader
        adminName={user?.name}
        onMenuClick={() => setShowAccount(true)}
        onProfileClick={() => setShowProfile(true)}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search groups..."
      />

      <main className="flex-1 overflow-y-auto bg-transparent text-[#7c827e] dark:text-[#8b96a5] pt-2 px-[1.125rem] pb-24">
        {filtered === null ? (
          <LoadingScreen />
        ) : (
          <>
            <div className="flex items-center justify-between py-2 px-1 pb-2.5">
              <span className="text-sm font-bold text-[#1a1a1a] dark:text-[#e9edef]">Your Groups</span>
              <button
                className="flex border-none bg-transparent text-[#1a1a1a] dark:text-[#e9edef] cursor-pointer p-1"
                aria-label="Manage groups"
                onClick={() => setShowGroupManagement(true)}
              >
                <MoreVertical size={18} />
              </button>
            </div>
            {filtered.length === 0 ? (
              <p className="py-4 px-1">No groups yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {filtered.map((g) => (
                  <GroupChatListItem key={g.id} group={g} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />

      {showProfile && user && (
        <AdminProfileScreen
          admin={user}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showAccount && user && (
        <AdminAccountPanel admin={user} onClose={() => setShowAccount(false)} />
      )}

      {showGroupManagement && (
        <GroupManagementPanel
          onClose={() => setShowGroupManagement(false)}
          onGroupCreated={(group) => setGroups((prev) => [group, ...(prev ?? [])])}
          onGroupDeleted={(groupId) =>
            setGroups((prev) => prev?.filter((g) => g.id !== groupId) ?? prev)
          }
        />
      )}
    </div>
  );
}
