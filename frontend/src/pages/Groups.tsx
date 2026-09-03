import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { fetchGroups } from "../services/groups";
import type { Group } from "../types/group";
import GroupList from "../components/admin/GroupList";
import LoadingScreen from "../components/common/LoadingScreen";

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
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between py-5 px-4 bg-[var(--wa-header)] shrink-0">
        <h1 className="m-0 text-2xl text-white">Groups</h1>
        <button
          className="inline-flex items-center gap-1.5 bg-white/[0.15] border border-white/30 text-white font-semibold text-sm py-2 px-3.5 rounded-[20px] whitespace-nowrap cursor-not-allowed opacity-75"
          title="Custom groups coming soon"
          disabled
        >
          <Plus size={16} /> Create Group
        </button>
      </header>
      <div className="flex items-center gap-2 mx-4 my-3.5 py-3 px-3.5 bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.06)] text-[var(--wa-text-secondary)] shrink-0">
        <Search size={18} />
        <input
          className="flex-1 border-none outline-none bg-transparent font-[inherit] text-[var(--wa-text)]"
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <main className="flex-1 overflow-y-auto bg-[var(--wa-panel-bg)]">
        {filtered === null ? <LoadingScreen /> : <GroupList groups={filtered} />}
      </main>
    </div>
  );
}
