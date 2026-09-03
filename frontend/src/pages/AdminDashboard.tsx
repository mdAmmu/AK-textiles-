import { useEffect, useMemo, useState } from "react";
import { Menu, Search } from "lucide-react";
import { fetchGroups } from "../services/groups";
import type { Group } from "../types/group";
import { useCurrentUser } from "../hooks/useCurrentUser";
import Avatar from "../components/common/Avatar";
import GroupChatListItem from "../components/admin/GroupChatListItem";
import AdminAccountPanel from "../components/admin/AdminAccountPanel";
import AdminProfileScreen from "../components/admin/AdminProfileScreen";
import LoadingScreen from "../components/common/LoadingScreen";
import logo from "../assets/ak-logo.png";

export default function AdminDashboard() {
  const { user } = useCurrentUser();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [search, setSearch] = useState("");
  const [showAccount, setShowAccount] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    fetchGroups().then(setGroups);
  }, []);

  const filtered = useMemo(() => {
    if (!groups) return groups;
    const term = search.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(term));
  }, [groups, search]);

  const firstName = user?.name?.split(" ")[0] ?? "Admin";

  return (
    <div className="relative flex flex-col h-screen bg-[linear-gradient(180deg,#eaf7ee_0%,#f6fbf7_40%,#ffffff_75%)] dark:bg-[#10161f]">
      <header className="flex items-center pt-[1.125rem] px-[1.125rem] shrink-0">
        <button
          className="flex border-none bg-transparent text-[#1a1a1a] dark:text-[#e9edef] cursor-pointer p-1.5"
          aria-label="Menu"
          onClick={() => setShowAccount(true)}
        >
          <Menu size={20} />
        </button>
        <div className="flex-1" />
        <button
          className="flex border-none bg-transparent p-0 cursor-pointer rounded-full"
          aria-label="Profile"
          onClick={() => setShowProfile(true)}
        >
          <Avatar name={user?.name ?? "Admin"} imageUrl={logo} size={44} />
        </button>
      </header>

      <div className="pt-3 px-5 shrink-0">
        <h1 className="text-2xl font-bold text-[#1a1a1a] dark:text-[#e9edef] flex items-center gap-1.5">
          Hello, {firstName} <span className="inline-block">👋</span>
        </h1>
        <p className="mt-1 text-[#7c827e] dark:text-[#8b96a5] text-[15px]">
          Good to see you again!
        </p>
      </div>

      <div className="flex items-center gap-2.5 mx-[1.125rem] mt-[1.125rem] mb-2 py-[0.8125rem] px-[1.125rem] bg-white dark:bg-[#1e2530] rounded-2xl shadow-[0_4px_18px_rgba(15,157,110,0.08)] dark:shadow-none dark:border dark:border-[#232d3a] shrink-0">
        <span className="flex text-[#7c827e] dark:text-[#8b96a5]">
          <Search size={18} />
        </span>
        <input
          className="flex-1 border-none outline-none bg-transparent p-0 font-[inherit] text-[#1a1a1a] dark:text-[#e9edef] placeholder:text-[#b7bcb9]"
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <main className="flex-1 overflow-y-auto bg-transparent text-[#7c827e] dark:text-[#8b96a5] pt-2 px-[1.125rem] pb-24">
        {filtered === null ? (
          <LoadingScreen />
        ) : (
          <>
            <div className="py-2 px-1 pb-2.5 text-sm font-bold text-[#1a1a1a] dark:text-[#e9edef]">
              Your Groups
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

      {showProfile && user && (
        <AdminProfileScreen
          admin={user}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showAccount && user && (
        <AdminAccountPanel
          admin={user}
          onClose={() => setShowAccount(false)}
          onGroupCreated={(group) => setGroups((prev) => [group, ...(prev ?? [])])}
          onGroupDeleted={(groupId) =>
            setGroups((prev) => prev?.filter((g) => g.id !== groupId) ?? prev)
          }
        />
      )}
    </div>
  );
}
