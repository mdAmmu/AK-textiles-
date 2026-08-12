import { useEffect, useMemo, useState } from "react";
import { CircleUserRound, Search } from "lucide-react";
import { fetchGroups } from "../services/groups";
import type { Group } from "../types/group";
import { useCurrentUser } from "../hooks/useCurrentUser";
import Avatar from "../components/common/Avatar";
import GroupChatListItem from "../components/admin/GroupChatListItem";
import AdminAccountPanel from "../components/admin/AdminAccountPanel";
import LoadingScreen from "../components/common/LoadingScreen";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user } = useCurrentUser();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [search, setSearch] = useState("");
  const [showAccount, setShowAccount] = useState(false);

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
    <div className="admin-dashboard-page">
      <header className="admin-dashboard-page__header">
        <Avatar name={user?.name ?? "Admin"} online size={40} />
        <div className="admin-dashboard-page__title">
          <h1>Admin</h1>
          <span>Online</span>
        </div>
        <button
          className="admin-dashboard-page__icon-btn"
          aria-label="Account"
          onClick={() => setShowAccount(true)}
        >
          <CircleUserRound size={22} />
        </button>
      </header>
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
      </div>
      <main className="admin-dashboard-page__content">
        {filtered === null ? (
          <LoadingScreen />
        ) : (
          <>
            <div className="admin-dashboard-page__section-label">Groups you're in</div>
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
