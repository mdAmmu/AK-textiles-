import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeInfo,
  BarChart3,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Radio,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { fetchAudience, fetchAudienceStats, updateAudience } from "../services/broadcastMessages";
import { createUser, fetchUsers } from "../services/users";
import type { BroadcastAudienceDetail, BroadcastAudienceStats } from "../types/broadcastMessage";
import type { User } from "../types/user";
import Avatar from "../components/common/Avatar";
import DetailsCard from "../components/common/DetailsCard";
import StatusPill from "../components/common/StatusPill";
import MultiAddMembersPanel, { type NewMemberDraft } from "../components/admin/MultiAddMembersPanel";
import LoadingScreen from "../components/common/LoadingScreen";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ACTION_BTN =
  "flex-1 max-w-[90px] flex flex-col items-center gap-1 py-3 px-2 border-none rounded-2xl bg-white dark:bg-[#1e2530] text-[#2563eb] dark:text-[#3b82f6] text-xs font-semibold cursor-pointer shadow-[0_4px_14px_rgba(37,99,235,0.14)] dark:shadow-none";
const ROW_BASE =
  "flex items-center gap-3.5 w-full py-[0.9375rem] px-4 border-none bg-transparent font-[inherit] text-left cursor-pointer text-[#1a1a1a] dark:text-[#e9edef]";
const ROW_ICON = "text-[#2563eb] dark:text-[#3b82f6] shrink-0";
const ROW_LABEL = "flex-1 font-medium";
const ROW_CHEVRON = "text-[#c2c6c3] dark:text-[#6b7480] shrink-0 transition-transform duration-150 ease-in-out";
const EMPTY_TEXT = "py-4 text-[#7c827e] dark:text-[#8b96a5]";

export default function BroadcastAudienceInfo() {
  const { audienceId } = useParams<{ audienceId: string }>();
  const navigate = useNavigate();

  const [audience, setAudience] = useState<BroadcastAudienceDetail | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Map<string, User>>(new Map());
  const [newMembers, setNewMembers] = useState<NewMemberDraft[]>([]);
  const [committing, setCommitting] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<BroadcastAudienceStats | null>(null);

  useEffect(() => {
    if (!audienceId) return;
    fetchAudience(audienceId).then(setAudience);
  }, [audienceId]);

  const filtered = useMemo(() => {
    if (!audience) return null;
    const term = search.trim().toLowerCase();
    if (!term) return audience.members;
    return audience.members.filter((m) => m.name.toLowerCase().includes(term));
  }, [audience, search]);

  function handleToggleStats() {
    setShowStats((s) => {
      const next = !s;
      if (next && audienceId) {
        setStats(null);
        fetchAudienceStats(audienceId).then(setStats);
      }
      return next;
    });
  }

  function handleToggleSelectMember(user: User) {
    setSelectedMembers((prev) => {
      const next = new Map(prev);
      if (next.has(user.id)) next.delete(user.id);
      else next.set(user.id, user);
      return next;
    });
  }

  function handleAddNewMember(member: NewMemberDraft) {
    setNewMembers((prev) => [...prev, member]);
  }

  function handleRemoveNewMember(key: string) {
    setNewMembers((prev) => prev.filter((m) => m.key !== key));
  }

  function closeAddPanel() {
    setShowAddPanel(false);
    setSelectedMembers(new Map());
    setNewMembers([]);
  }

  async function handleDoneAddingMembers() {
    if (!audienceId || !audience || committing) {
      closeAddPanel();
      return;
    }
    if (selectedMembers.size === 0 && newMembers.length === 0) {
      closeAddPanel();
      return;
    }
    setCommitting(true);
    try {
      const created = await Promise.all(
        newMembers.map((m) => createUser(m.name, m.phone, m.password, m.role)),
      );
      await updateAudience(audienceId, undefined, [
        ...audience.member_ids,
        ...selectedMembers.keys(),
        ...created.map((u) => u.id),
      ]);
      const refreshed = await fetchAudience(audienceId);
      setAudience(refreshed);
      closeAddPanel();
    } finally {
      setCommitting(false);
    }
  }

  async function handleRemove(userId: string) {
    if (!audienceId || !audience) return;
    await updateAudience(
      audienceId,
      undefined,
      audience.member_ids.filter((id) => id !== userId),
    );
    const refreshed = await fetchAudience(audienceId);
    setAudience(refreshed);
  }

  if (audience === null) return <LoadingScreen />;

  return (
    <div className="flex flex-col min-h-dvh bg-[#eef2f0] dark:bg-[#10161f] pb-8">
      <div className="relative flex flex-col items-center gap-1.5 pt-11 px-4 pb-6 bg-[linear-gradient(135deg,#2563eb,#60a5fa)] rounded-b-3xl">
        <button
          className="absolute top-4 left-4 flex border-none bg-transparent text-white cursor-pointer p-1"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="w-20 h-20 rounded-full bg-white/[0.22] border-[3px] border-white/[0.55] flex items-center justify-center">
          <Radio size={36} color="#fff" />
        </span>
        <h1 className="mt-2 mb-0 text-xl font-bold text-white">{audience.name}</h1>
        <span className="text-white/85 text-sm">{audience.member_count} recipients</span>
        <div className="flex items-center gap-2 mt-2">
          <StatusPill label={audience.member_count > 0 ? "Active" : "Empty"} dot />
          <StatusPill label="Broadcast Audience" icon={Radio} />
        </div>
      </div>

      <DetailsCard
        icon={BadgeInfo}
        title="Audience Details"
        subtitle="Basic audience identity and history"
        items={[
          { icon: Radio, label: "Audience Name", value: audience.name },
          { icon: Users, label: "Recipients", value: audience.member_count },
          { icon: CalendarClock, label: "Created", value: formatDate(audience.created_at) },
          { icon: CalendarClock, label: "Last Updated", value: formatDate(audience.updated_at) },
        ]}
      />

      <div className="flex justify-center gap-2.5 mt-4 mx-4">
        <button className={ACTION_BTN} type="button" onClick={() => setShowSearch((s) => !s)}>
          <Search size={18} />
          <span>Search</span>
        </button>
        <button className={ACTION_BTN} type="button" onClick={() => setShowAddPanel(true)}>
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
            placeholder="Search recipients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <div className="mt-4 mx-4 bg-white dark:bg-[#1e2530] rounded-2xl overflow-hidden shadow-[0_4px_18px_rgba(37,99,235,0.06)] dark:shadow-none">
        <button
          className={`${ROW_BASE} border-b border-[#eef1ee] dark:border-[#232d3a]`}
          type="button"
          onClick={handleToggleStats}
        >
          <BarChart3 size={19} className={ROW_ICON} />
          <span className={ROW_LABEL}>Delivery Stats</span>
          <ChevronRight size={18} className={`${ROW_CHEVRON}${showStats ? " rotate-90" : ""}`} />
        </button>

        {showStats && (
          <div className="px-4 pb-4 pt-3 border-t border-[#eef1ee] dark:border-[#232d3a]">
            {stats === null ? (
              <p className={EMPTY_TEXT}>Loading…</p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Stat label="Broadcasts Sent" value={stats.total_broadcasts} />
                <Stat
                  label="Delivered"
                  value={stats.total_recipients_reached}
                  sub={`${stats.delivery_rate}%`}
                />
                <Stat label="Read" value={stats.total_read} sub={`${stats.read_rate}%`} />
                <Stat label="Failed" value={stats.total_failed} accent={stats.total_failed > 0} />
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
                <button
                  className="flex border-none bg-transparent text-[#d92d20] cursor-pointer p-1.5 shrink-0"
                  onClick={() => handleRemove(m.id)}
                  aria-label={`Remove ${m.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddPanel && (
        <MultiAddMembersPanel
          title="Add Recipients"
          onClose={closeAddPanel}
          doneLabel={committing ? "Adding..." : "Done"}
          fetchCandidates={(term) => fetchUsers(term || undefined, true)}
          excludeIds={audience.member_ids}
          selected={selectedMembers}
          onToggleSelect={handleToggleSelectMember}
          newMemberRoleMode="fixed"
          fixedNewMemberRole="USER"
          newMembers={newMembers}
          onAddNewMember={handleAddNewMember}
          onRemoveNewMember={handleRemoveNewMember}
          onDone={handleDoneAddingMembers}
          candidateSectionLabel="All Customers"
          notFoundLabel="Not in your customers yet"
          hintTitle="Can't find a customer?"
          getExistingLabel={(u) =>
            u.audience_names && u.audience_names.length > 0
              ? `Already in ${u.audience_names.join(", ")}`
              : null
          }
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#f5f8ff] dark:bg-[#10161f] border border-[#eef1ee] dark:border-[#232d3a] rounded-xl p-3">
      <div className="text-[#8b8f8c] dark:text-[#8b96a5] text-[13px]">{label}</div>
      <div
        className={`text-xl font-bold ${accent ? "text-[#e5484d]" : "text-[#1a1a1a] dark:text-[#e9edef]"}`}
      >
        {value}
      </div>
      {sub && <div className="text-[#2563eb] dark:text-[#60a5fa] text-xs font-semibold">{sub}</div>}
    </div>
  );
}
