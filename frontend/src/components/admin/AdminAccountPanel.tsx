import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, MessageCircle, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { User } from "../../types/user";
import type { Group } from "../../types/group";
import { createGroup, deleteGroup, fetchGroups } from "../../services/groups";
import Avatar from "../common/Avatar";
import GroupIcon from "./GroupIcon";

const SECTION = "border-t-8 border-[var(--wa-panel-bg)] p-4";
const ADD_GROUP_BTN =
  "flex items-center justify-center gap-2 w-full py-3 border-none rounded-lg bg-[var(--wa-accent)] text-white font-semibold text-[15px] cursor-pointer no-underline";
const LABEL = "font-semibold text-sm mt-3 text-[var(--wa-text)]";
const INPUT = "py-2.5 px-3 border border-[var(--wa-border)] rounded-lg font-[inherit] bg-[var(--wa-panel-bg)]";
const CANCEL_BTN =
  "flex-1 py-3 border border-[var(--wa-border)] rounded-lg bg-transparent text-[var(--wa-text)] font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";
const SUBMIT_BTN =
  "flex-1 py-3 border-none rounded-lg bg-[var(--wa-accent)] text-white font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

interface Props {
  admin: User;
  onClose: () => void;
  onGroupCreated: (group: Group) => void;
  onGroupDeleted: (groupId: string) => void;
}

export default function AdminAccountPanel({
  admin,
  onClose,
  onGroupCreated,
  onGroupDeleted,
}: Props) {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Group | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchGroups().then(setGroups);
  }, []);

  async function handleCreateGroup(e: FormEvent) {
    e.preventDefault();
    if (creating) return;
    setError(null);
    setCreating(true);
    try {
      const group = await createGroup(name.trim(), description.trim() || undefined);
      setGroups((prev) => [group, ...(prev ?? [])]);
      onGroupCreated(group);
      setName("");
      setDescription("");
      setShowAddGroup(false);
    } catch {
      setError("Could not create group. Try a different name.");
    } finally {
      setCreating(false);
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
      <div className="flex items-center gap-3 py-3.5 px-4 shrink-0">
        <button
          className="flex border-none bg-transparent text-[var(--wa-text)] cursor-pointer p-1"
          onClick={onClose}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-semibold text-[17px]">Account</span>
      </div>

      <div className="flex flex-col items-center gap-2 pt-2 px-4 pb-5 text-center">
        <Avatar name={admin.name} size={96} />
        <h1 className="mt-1 mb-0 text-[1.375rem]">{admin.name}</h1>
        {(admin.phone || admin.email) && (
          <span className="text-[var(--wa-text-secondary)] text-sm">
            {admin.phone ?? admin.email}
          </span>
        )}
      </div>

      <div className={SECTION}>
        <Link to="/admin/whatsapp-send" className={ADD_GROUP_BTN}>
          <MessageCircle size={18} /> Send WhatsApp Message
        </Link>
      </div>

      <div className={SECTION}>
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

            <label className={LABEL}>Description (optional)</label>
            <input className={INPUT} value={description} onChange={(e) => setDescription(e.target.value)} />

            {error && <p className="mt-2 mb-0 text-[#d92d20] text-[13px]">{error}</p>}

            <div className="flex gap-2.5 mt-6">
              <button
                type="button"
                className={CANCEL_BTN}
                onClick={() => {
                  setShowAddGroup(false);
                  setError(null);
                }}
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

      <div className={`${SECTION} flex-1 overflow-y-auto`}>
        <div className="text-[var(--wa-text-secondary)] font-semibold text-[15px] mb-3">Groups</div>
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
    </div>
  );
}
