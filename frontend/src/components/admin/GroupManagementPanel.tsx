import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type { Group } from "../../types/group";
import type { User } from "../../types/user";
import {
  assignUserGroup,
  createAndAssignCustomer,
  createGroup,
  deleteGroup,
  fetchGroups,
  fetchUnassignedUsers,
} from "../../services/groups";
import GroupIcon from "./GroupIcon";
import MultiAddMembersPanel, { type NewMemberDraft } from "./MultiAddMembersPanel";

const ADD_GROUP_BTN =
  "flex items-center justify-center gap-2 w-full py-3 border-none rounded-lg bg-[var(--wa-accent)] text-white font-semibold text-[15px] cursor-pointer";
const LABEL = "font-semibold text-sm mt-3 text-[var(--wa-text)]";
const INPUT = "py-2.5 px-3 border border-[var(--wa-border)] rounded-lg font-[inherit] bg-[var(--wa-panel-bg)]";
const CANCEL_BTN =
  "flex-1 py-3 border border-[var(--wa-border)] rounded-lg bg-transparent text-[var(--wa-text)] font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";
const SUBMIT_BTN =
  "flex-1 py-3 border-none rounded-lg bg-[var(--wa-accent)] text-white font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

interface Props {
  onClose: () => void;
  onGroupCreated: (group: Group) => void;
  onGroupDeleted: (groupId: string) => void;
}

export default function GroupManagementPanel({ onClose, onGroupCreated, onGroupDeleted }: Props) {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Group | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Map<string, User>>(new Map());
  const [newMembers, setNewMembers] = useState<NewMemberDraft[]>([]);
  const [committing, setCommitting] = useState(false);

  useEffect(() => {
    fetchGroups().then(setGroups);
  }, []);

  async function handleCreateGroup(e: FormEvent) {
    e.preventDefault();
    if (creating) return;
    setError(null);
    setCreating(true);
    try {
      const group = await createGroup(name.trim());
      onGroupCreated(group);
      setCreatedGroup(group);
    } catch {
      setError("Could not create group. Try a different name.");
      setCreating(false);
    }
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

  async function handleDoneAddingMembers() {
    if (!createdGroup || committing) return;
    setCommitting(true);
    try {
      await Promise.all([
        ...Array.from(selectedMembers.keys()).map((userId) =>
          assignUserGroup(userId, createdGroup.id),
        ),
        ...newMembers.map((m) =>
          createAndAssignCustomer(createdGroup.id, m.name, m.phone, m.password, m.role),
        ),
      ]);
    } finally {
      navigate(`/admin/groups/${createdGroup.id}/chat`);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteGroup(pendingDelete.id);
      setGroups((prev) => prev?.filter((g) => g.id !== pendingDelete.id) ?? prev);
      onGroupDeleted(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-[#131a24] flex flex-col z-10">
      <div className="flex items-center gap-3 py-3.5 px-4 shrink-0 border-b border-[var(--wa-border)]">
        <button
          className="flex border-none bg-transparent text-[var(--wa-text)] cursor-pointer p-1"
          onClick={onClose}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-semibold text-[17px]">Manage Groups</span>
      </div>

      <div className="p-4 shrink-0">
        {!showAddGroup ? (
          <button className={ADD_GROUP_BTN} onClick={() => setShowAddGroup(true)}>
            <Plus size={18} /> Add Group
          </button>
        ) : (
          <form className="flex flex-col gap-1" onSubmit={handleCreateGroup}>
            <label className={LABEL}>Group Name</label>
            <input
              className={INPUT}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />

            {error && <p className="mt-2 mb-0 text-[#d92d20] text-[13px]">{error}</p>}

            <div className="flex gap-2.5 mt-6">
              <button
                type="button"
                className={CANCEL_BTN}
                onClick={() => {
                  setShowAddGroup(false);
                  setError(null);
                  setName("");
                }}
                disabled={creating}
              >
                Cancel
              </button>
              <button className={SUBMIT_BTN} type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-0">
        {groups === null ? (
          <p className="text-[var(--wa-text-secondary)] text-sm">Loading...</p>
        ) : groups.length === 0 ? (
          <p className="text-[var(--wa-text-secondary)] text-sm">No groups yet.</p>
        ) : (
          <div className="flex flex-col">
            {groups.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 py-2.5 border-b border-[var(--wa-border)]"
              >
                <GroupIcon name={g.name} size={40} />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium">{g.name}</span>
                  <span className="text-[var(--wa-text-secondary)] text-[13px] mt-0.5">
                    {g.customer_count} members
                  </span>
                </div>
                <button
                  className="flex border-none bg-transparent text-[#d92d20] cursor-pointer p-1.5 shrink-0"
                  onClick={() => setPendingDelete(g)}
                  aria-label={`Delete ${g.name}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-6 z-20">
          <div className="bg-white dark:bg-[#1e2530] rounded-xl p-5 max-w-[320px] w-full">
            <h2 className="mt-0 mb-2 text-[17px]">Delete "{pendingDelete.name}"?</h2>
            <p className="m-0 text-[var(--wa-text-secondary)] text-sm leading-[1.4]">
              This will permanently delete the group and its chat. All members of this group will
              be logged out.
            </p>
            <div className="flex gap-2.5 mt-5">
              <button className={CANCEL_BTN} onClick={() => setPendingDelete(null)} disabled={deleting}>
                Cancel
              </button>
              <button
                className="flex-1 py-3 border-none rounded-lg bg-[#d92d20] text-white font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {createdGroup && (
        <MultiAddMembersPanel
          title="Add Staff Members"
          doneLabel={committing ? "Adding..." : "Done"}
          fetchCandidates={(term) => fetchUnassignedUsers(term || undefined, "STAFF")}
          excludeIds={[]}
          selected={selectedMembers}
          onToggleSelect={handleToggleSelectMember}
          newMemberRoleMode="fixed"
          fixedNewMemberRole="STAFF"
          newMembers={newMembers}
          onAddNewMember={handleAddNewMember}
          onRemoveNewMember={handleRemoveNewMember}
          onDone={handleDoneAddingMembers}
          candidateSectionLabel="All Staff"
          notFoundLabel="Not in your staff yet"
          hintTitle="Can't find a staff member?"
          getExistingLabel={(u) => (u.group_name ? `Already in ${u.group_name}` : null)}
        />
      )}
    </div>
  );
}
