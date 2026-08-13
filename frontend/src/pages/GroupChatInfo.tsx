import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Images,
  Phone,
  Search,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import {
  assignUserGroup,
  fetchGroups,
  fetchGroupUsers,
  fetchUnassignedUsers,
} from "../services/groups";
import type { Group, GroupUser } from "../types/group";
import type { User } from "../types/user";
import GroupIcon from "../components/admin/GroupIcon";
import Avatar from "../components/common/Avatar";
import AddCustomerPanel from "../components/admin/AddCustomerPanel";
import LoadingScreen from "../components/common/LoadingScreen";
import "./GroupChatInfo.css";

export default function GroupChatInfo() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupUser[] | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [candidates, setCandidates] = useState<User[]>([]);

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

  async function handleAddSearch(term: string) {
    const results = await fetchUnassignedUsers(term || undefined);
    setCandidates(results);
  }

  async function handleAdd(userId: string) {
    if (!groupId) return;
    const added = await assignUserGroup(userId, groupId);
    setMembers((prev) => [...(prev ?? []), added]);
    setGroup((prev) => (prev ? { ...prev, customer_count: prev.customer_count + 1 } : prev));
    setShowAddPanel(false);
  }

  if (group === null || members === null) return <LoadingScreen />;

  return (
    <div className="group-chat-info-page">
      <div className="group-chat-info-page__hero">
        <button className="group-chat-info-page__back" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <GroupIcon name={group.name} size={80} variant="hero" />
        <h1>{group.name}</h1>
        <span className="group-chat-info-page__meta">{members.length} members</span>
      </div>

      <div className="group-chat-info-page__actions">
        <button className="group-chat-info-page__action" type="button">
          <Phone size={18} />
          <span>Audio</span>
        </button>
        <button className="group-chat-info-page__action" type="button">
          <Video size={18} />
          <span>Video</span>
        </button>
        <button
          className="group-chat-info-page__action"
          type="button"
          onClick={() => setShowSearch((s) => !s)}
        >
          <Search size={18} />
          <span>Search</span>
        </button>
        <button
          className="group-chat-info-page__action"
          type="button"
          onClick={() => {
            setShowAddPanel(true);
            handleAddSearch("");
          }}
        >
          <UserPlus size={18} />
          <span>Add Member</span>
        </button>
      </div>

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

      <div className="group-chat-info-page__card">
        <button className="group-chat-info-page__row" type="button">
          <Images size={19} className="group-chat-info-page__row-icon" />
          <span className="group-chat-info-page__row-label">Media, Links &amp; Docs</span>
          <ChevronRight size={18} className="group-chat-info-page__row-chevron" />
        </button>

        <button
          className="group-chat-info-page__row"
          type="button"
          onClick={() => setShowMembers((s) => !s)}
        >
          <Users size={19} className="group-chat-info-page__row-icon" />
          <span className="group-chat-info-page__row-label">View Members</span>
          <ChevronDown
            size={18}
            className={`group-chat-info-page__row-chevron${showMembers ? " group-chat-info-page__row-chevron--open" : ""}`}
          />
        </button>

        {showMembers && (
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
        )}
      </div>

      {showAddPanel && (
        <AddCustomerPanel
          candidates={candidates}
          onSearch={handleAddSearch}
          onAdd={handleAdd}
          onClose={() => setShowAddPanel(false)}
        />
      )}
    </div>
  );
}
