import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Images,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import {
  assignUserGroup,
  createAndAssignCustomer,
  fetchGroupMessages,
  fetchGroups,
  fetchGroupUsers,
  fetchUnassignedUsers,
} from "../services/groups";
import type { Group, GroupUser } from "../types/group";
import type { Message } from "../types/message";
import type { User } from "../types/user";
import GroupIcon from "../components/admin/GroupIcon";
import Avatar from "../components/common/Avatar";
import AddCustomerPanel from "../components/admin/AddCustomerPanel";
import LoadingScreen from "../components/common/LoadingScreen";

const ACTION_BTN =
  "flex-1 max-w-[90px] flex flex-col items-center gap-1 py-3 px-2 border-none rounded-2xl bg-white dark:bg-[#1e2530] text-[#0f9d6e] dark:text-[#17c98d] text-xs font-semibold cursor-pointer shadow-[0_4px_14px_rgba(15,157,110,0.14)] dark:shadow-none";
const ROW_BASE =
  "flex items-center gap-3.5 w-full py-[0.9375rem] px-4 border-none bg-transparent font-[inherit] text-left cursor-pointer text-[#1a1a1a] dark:text-[#e9edef]";
const ROW_ICON = "text-[#0f9d6e] dark:text-[#17c98d] shrink-0";
const ROW_LABEL = "flex-1 font-medium";
const ROW_CHEVRON = "text-[#c2c6c3] dark:text-[#6b7480] shrink-0 transition-transform duration-150 ease-in-out";
const EMPTY_TEXT = "py-4 text-[#7c827e] dark:text-[#8b96a5]";

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
  const [showMedia, setShowMedia] = useState(false);
  const [media, setMedia] = useState<Message[] | null>(null);

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

  async function handleAddNew(phone: string, name: string, password: string) {
    if (!groupId) return;
    const added = await createAndAssignCustomer(groupId, name, phone, password);
    setMembers((prev) => [...(prev ?? []), added]);
    setGroup((prev) => (prev ? { ...prev, customer_count: prev.customer_count + 1 } : prev));
    setShowAddPanel(false);
  }

  function handleToggleMedia() {
    setShowMedia((s) => {
      const next = !s;
      if (next && groupId) {
        setMedia(null);
        fetchGroupMessages(groupId).then((messages) =>
          setMedia(
            messages.filter(
              (m) => m.message_type === "IMAGE" && m.product_image && !m.is_deleted,
            ),
          ),
        );
      }
      return next;
    });
  }

  if (group === null || members === null) return <LoadingScreen />;

  return (
    <div className="flex flex-col min-h-screen bg-[#eef2f0] dark:bg-[#10161f] pb-8">
      <div className="relative flex flex-col items-center gap-1.5 pt-11 px-4 pb-6 bg-[linear-gradient(135deg,#0f9d6e,#4fc98a)] rounded-b-3xl">
        <button
          className="absolute top-4 left-4 flex border-none bg-transparent text-white cursor-pointer p-1"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <GroupIcon name={group.name} size={80} variant="hero" />
        <h1 className="mt-2 mb-0 text-xl font-bold text-white">{group.name}</h1>
        <span className="text-white/85 text-sm">{members.length} members</span>
      </div>

      <div className="flex justify-center gap-2.5 mt-4 mx-4">
        <button className={ACTION_BTN} type="button" onClick={() => setShowSearch((s) => !s)}>
          <Search size={18} />
          <span>Search</span>
        </button>
        <button
          className={ACTION_BTN}
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
        <div className="flex items-center gap-2 mx-4 mt-3.5 py-2.5 px-3.5 bg-white dark:bg-[#1e2530] rounded-[10px] text-[#7c827e] dark:text-[#8b96a5]">
          <Search size={16} />
          <input
            className="flex-1 border-none outline-none bg-transparent font-[inherit] text-[#1a1a1a] dark:text-[#e9edef]"
            autoFocus
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <div className="mt-5 mx-4 bg-white dark:bg-[#1e2530] rounded-2xl overflow-hidden shadow-[0_4px_18px_rgba(15,157,110,0.06)] dark:shadow-none">
        <button
          className={`${ROW_BASE} border-b border-[#eef1ee] dark:border-[#232d3a]`}
          type="button"
          onClick={handleToggleMedia}
        >
          <Images size={19} className={ROW_ICON} />
          <span className={ROW_LABEL}>Media, Links &amp; Docs</span>
          <ChevronRight size={18} className={`${ROW_CHEVRON}${showMedia ? " rotate-90" : ""}`} />
        </button>

        {showMedia && (
          <div className="px-4 pb-2 border-t border-[#eef1ee] dark:border-[#232d3a]">
            {media === null ? (
              <p className={EMPTY_TEXT}>Loading…</p>
            ) : media.length === 0 ? (
              <p className={EMPTY_TEXT}>No media shared yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 py-3">
                {media.map((m) => (
                  <img
                    key={m.id}
                    className="w-full aspect-square object-cover rounded-md"
                    src={m.product_image!}
                    alt=""
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <button
          className={`${ROW_BASE}${showMembers ? " border-b border-[#eef1ee] dark:border-[#232d3a]" : ""}`}
          type="button"
          onClick={() => setShowMembers((s) => !s)}
        >
          <Users size={19} className={ROW_ICON} />
          <span className={ROW_LABEL}>View Members</span>
          <ChevronDown size={18} className={`${ROW_CHEVRON}${showMembers ? " rotate-180" : ""}`} />
        </button>

        {showMembers && (
          <div className="px-4 pb-2 border-t border-[#eef1ee] dark:border-[#232d3a]">
            {filtered && filtered.length === 0 && <p className={EMPTY_TEXT}>No members found.</p>}
            {filtered?.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 py-3 border-b border-[#f3f5f4] dark:border-[#232d3a] last:border-b-0"
              >
                <Avatar name={m.name} size={40} />
                <div className="flex-1">
                  <div className="font-medium">{m.name}</div>
                  {(m.email || m.phone) && (
                    <div className="text-[#7c827e] dark:text-[#8b96a5] text-[13px] mt-0.5">
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
          onAddNew={handleAddNew}
          onClose={() => setShowAddPanel(false)}
        />
      )}
    </div>
  );
}
