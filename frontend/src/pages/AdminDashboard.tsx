import { useEffect, useMemo, useState } from "react";
import { Filter, Menu, Search } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { fetchGroups } from "../services/groups";
import type { Group } from "../types/group";
import { useCurrentUser } from "../hooks/useCurrentUser";
import Avatar from "../components/common/Avatar";
import GroupChatListItem from "../components/admin/GroupChatListItem";
import AdminAccountPanel from "../components/admin/AdminAccountPanel";
import AdminProfileScreen from "../components/admin/AdminProfileScreen";
import LoadingScreen from "../components/common/LoadingScreen";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user } = useCurrentUser();
  const { user: clerkUser } = useUser();
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
    <div className="admin-dashboard-page">
      <header className="admin-dashboard-page__header">
        <button
          className="admin-dashboard-page__icon-btn"
          aria-label="Menu"
          onClick={() => setShowAccount(true)}
        >
          <Menu size={20} />
        </button>
        <div className="admin-dashboard-page__spacer" />
        <button
          className="admin-dashboard-page__avatar-btn"
          aria-label="Profile"
          onClick={() => setShowProfile(true)}
        >
          <Avatar name={user?.name ?? "Admin"} imageUrl={clerkUser?.imageUrl} online size={44} />
        </button>
      </header>

      <div className="admin-dashboard-page__greeting">
        <h1>
          Hello, {firstName} <span className="admin-dashboard-page__wave">👋</span>
        </h1>
        <p>Good to see you again!</p>
      </div>

      <div className="admin-dashboard-page__search-row">
        <span className="admin-dashboard-page__search-icon">
          <Search size={18} />
        </span>
        <input
          className="admin-dashboard-page__search"
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="admin-dashboard-page__filter-icon">
          <Filter size={17} />
        </span>
      </div>

      <main className="admin-dashboard-page__content">
        {filtered === null ? (
          <LoadingScreen />
        ) : (
          <>
            <div className="admin-dashboard-page__section-label">Your Groups</div>
            {filtered.length === 0 ? (
              <p className="admin-dashboard-page__empty">No groups yet.</p>
            ) : (
              <div className="admin-dashboard-page__list">
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
          imageUrl={clerkUser?.imageUrl}
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
