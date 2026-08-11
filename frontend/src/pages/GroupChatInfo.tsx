import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { fetchGroups, fetchGroupUsers } from "../services/groups";
import type { Group, GroupUser } from "../types/group";
import GroupIcon from "../components/admin/GroupIcon";
import Avatar from "../components/common/Avatar";
import LoadingScreen from "../components/common/LoadingScreen";
import "./GroupChatInfo.css";

export default function GroupChatInfo() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupUser[] | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!groupId) return;
    fetchGroups().then((all) => setGroup(all.find((g) => g.id === groupId) ?? null));
    fetchGroupUsers(groupId).then(setMembers);
  }, [groupId]);

  const filtered = useMemo(() => {
    if (!members) return members;
    const term = search.trim().toLowerCase();
    if (!term) return members;
    return members.filter((m) => m.name.toLowerCase().includes(term));
  }, [members, search]);

  if (group === null || members === null) return <LoadingScreen />;

  return (
    <div className="group-chat-info-page">
      <header className="group-chat-info-page__header">
        <button onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
      </header>

      <div className="group-chat-info-page__hero">
        <GroupIcon name={group.name} size={112} />
        <h1>{group.name}</h1>
        <span className="group-chat-info-page__meta">Group · {members.length} members</span>
      </div>

      <button
        className="group-chat-info-page__search-btn"
        onClick={() => setShowSearch((s) => !s)}
      >
        <Search size={18} /> Search
      </button>

      {showSearch && (
        <div className="group-chat-info-page__search-row">
          <Search size={16} />
          <input
            autoFocus
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <div className="group-chat-info-page__members-header">
        <span>{members.length} members</span>
      </div>

      <div className="group-chat-info-page__list">
        {filtered && filtered.length === 0 && (
          <p className="group-chat-info-page__empty">No members found.</p>
        )}
        {filtered?.map((m) => (
          <div key={m.id} className="group-chat-info-page__member">
            <Avatar name={m.name} size={40} />
            <div className="group-chat-info-page__member-body">
              <div className="group-chat-info-page__member-name">{m.name}</div>
              {(m.email || m.phone) && (
                <div className="group-chat-info-page__member-contact">
                  {m.email ?? m.phone}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
