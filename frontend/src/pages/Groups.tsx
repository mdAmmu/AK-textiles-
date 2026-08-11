import { useEffect, useMemo, useState } from "react";
import { fetchGroups } from "../services/groups";
import type { Group } from "../types/group";
import GroupList from "../components/admin/GroupList";
import LoadingScreen from "../components/common/LoadingScreen";
import AdminNav from "../components/admin/AdminNav";
import "./Groups.css";

export default function Groups() {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [search, setSearch] = useState("");

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
    <div className="groups-page">
      <header className="groups-page__header">
        <h1>Groups</h1>
        <button className="groups-page__create" title="Custom groups coming soon" disabled>
          + Create Group
        </button>
      </header>
      <div className="groups-page__search-row">
        <span>🔍</span>
        <input
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <main className="groups-page__content">
        {filtered === null ? <LoadingScreen /> : <GroupList groups={filtered} />}
      </main>
      <AdminNav />
    </div>
  );
}
