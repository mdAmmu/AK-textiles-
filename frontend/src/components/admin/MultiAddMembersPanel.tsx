import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Check, Search, UserPlus, Users } from "lucide-react";
import type { User } from "../../types/user";
import Avatar from "../common/Avatar";
import { Chip } from "./BroadcastRecipientPicker";

const ITEM = "flex items-center gap-3 bg-white rounded-xl p-3 mb-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]";
const ITEM_NAME = "font-bold truncate";
const ITEM_CONTACT = "text-[var(--wa-text-secondary)] text-[13px] truncate";
const ADD_BTN =
  "shrink-0 border border-[var(--wa-accent)] bg-transparent text-[var(--wa-accent)] rounded-lg py-[0.4375rem] px-3.5 font-semibold cursor-pointer";
const MODAL_LABEL = "block text-[13px] font-semibold mt-2.5 mb-1 text-[var(--wa-text-secondary)]";
const MODAL_INPUT =
  "w-full box-border py-2.5 px-3 rounded-lg border border-[var(--wa-border)] font-[inherit]";

export interface NewMemberDraft {
  key: string;
  phone: string;
  name: string;
  password: string;
  role: "USER" | "STAFF";
}

interface Props {
  title: string;
  doneLabel: string;
  onClose?: () => void;
  fetchCandidates: (term: string) => Promise<User[]>;
  excludeIds: string[];
  selected: Map<string, User>;
  onToggleSelect: (user: User) => void;
  allowCreateNew?: boolean;
  newMemberRoleMode?: "fixed" | "toggle";
  fixedNewMemberRole?: "USER" | "STAFF";
  newMembers: NewMemberDraft[];
  onAddNewMember: (member: NewMemberDraft) => void;
  onRemoveNewMember: (key: string) => void;
  onDone: () => void;
  candidateSectionLabel?: string;
  notFoundLabel?: string;
  hintTitle?: string;
  hintText?: string;
  /** Returns a label like "Already in Dubai" if this contact can't be added
   * here (already placed elsewhere) — shown instead of the Add button. */
  getExistingLabel?: (user: User) => string | null;
}

function looksLikePhone(term: string): boolean {
  return term.replace(/\D/g, "").length >= 7;
}

export default function MultiAddMembersPanel({
  title,
  doneLabel,
  onClose,
  fetchCandidates,
  excludeIds,
  selected,
  onToggleSelect,
  allowCreateNew = true,
  newMemberRoleMode = "toggle",
  fixedNewMemberRole = "USER",
  newMembers,
  onAddNewMember,
  onRemoveNewMember,
  onDone,
  candidateSectionLabel = "All Contacts",
  notFoundLabel = "Not in your contacts yet",
  hintTitle = "Can't find someone?",
  hintText = "Search their phone number and add them directly.",
  getExistingLabel,
}: Props) {
  const [term, setTerm] = useState("");
  const [candidates, setCandidates] = useState<User[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newIsStaff, setNewIsStaff] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchCandidates(term.trim()).then((users) =>
        setCandidates(users.filter((u) => !excludeIds.includes(u.id) && !selected.has(u.id))),
      );
    }, 200);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, selected, excludeIds]);

  const trimmedTerm = term.trim();
  const showAddNewOption =
    allowCreateNew &&
    candidates.length === 0 &&
    looksLikePhone(trimmedTerm) &&
    !newMembers.some((m) => m.phone === trimmedTerm);

  function openNewModal() {
    setNewName("");
    setNewPassword("");
    setNewIsStaff(false);
    setShowNewModal(true);
  }

  function handleCreateNew(e: FormEvent) {
    e.preventDefault();
    onAddNewMember({
      key: `new-${trimmedTerm}`,
      phone: trimmedTerm,
      name: newName.trim(),
      password: newPassword,
      role: newMemberRoleMode === "fixed" ? fixedNewMemberRole : newIsStaff ? "STAFF" : "USER",
    });
    setShowNewModal(false);
    setTerm("");
  }

  const totalSelected = selected.size + newMembers.length;

  return (
    <div className="fixed inset-0 bg-[var(--wa-panel-bg)] flex flex-col z-10">
      <div className="flex items-center gap-3 py-[1.125rem] px-4 bg-[var(--wa-header)] shrink-0">
        {onClose && (
          <button
            className="flex border-none bg-transparent text-white cursor-pointer"
            onClick={onClose}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <span className="flex-1 text-white font-bold text-lg">{title}</span>
        <button
          className="flex items-center gap-1.5 border-none bg-white/[0.15] text-white font-semibold cursor-pointer rounded-full py-1.5 px-4"
          onClick={onDone}
        >
          <Check size={16} /> {doneLabel}
        </button>
      </div>

      <div className="flex items-center gap-2 py-3.5 px-4 bg-white border-b border-[var(--wa-border)] text-[var(--wa-text-secondary)] shrink-0">
        <Search size={18} />
        <input
          className="flex-1 min-w-0 border-none outline-none bg-[var(--wa-panel-bg)] py-2.5 px-3.5 rounded-lg font-[inherit]"
          placeholder="Search by name or phone number..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>

      {totalSelected > 0 && (
        <div className="flex gap-2 overflow-x-auto py-3 px-4 bg-white border-b border-[var(--wa-border)] shrink-0">
          {Array.from(selected.values()).map((u) => (
            <Chip key={u.id} label={u.name} onRemove={() => onToggleSelect(u)} />
          ))}
          {newMembers.map((m) => (
            <Chip key={m.key} label={m.name} onRemove={() => onRemoveNewMember(m.key)} />
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3.5">
        <p className="mt-0 mb-2 text-[var(--wa-text-secondary)] text-[13px] font-semibold">
          {candidateSectionLabel}
        </p>
        {candidates.length === 0 && !showAddNewOption && (
          <p className="p-4 text-[var(--wa-text-secondary)]">No matching contacts found.</p>
        )}
        {candidates.map((c) => {
          const existingLabel = getExistingLabel?.(c) ?? null;
          return (
            <div key={c.id} className={ITEM}>
              <Avatar name={c.name} size={40} />
              <div className="flex-1 min-w-0 flex flex-col">
                <span className={ITEM_NAME}>{c.name}</span>
                <span className={ITEM_CONTACT}>{c.phone ?? c.email}</span>
              </div>
              {existingLabel ? (
                <span className="shrink-0 text-[#c9820f] text-[13px] font-semibold text-right whitespace-nowrap">
                  {existingLabel}
                </span>
              ) : (
                <button className={ADD_BTN} onClick={() => onToggleSelect(c)}>
                  Add
                </button>
              )}
            </div>
          );
        })}

        {showAddNewOption && (
          <div className={ITEM}>
            <Avatar name={trimmedTerm} size={40} />
            <div className="flex-1 min-w-0 flex flex-col">
              <span className={ITEM_NAME}>{trimmedTerm}</span>
              <span className={ITEM_CONTACT}>{notFoundLabel}</span>
            </div>
            <button className={ADD_BTN} onClick={openNewModal}>
              <UserPlus size={14} /> Add
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 bg-[#e6edff] rounded-xl p-3.5 mt-2">
          <span className="w-9 h-9 rounded-full bg-[#dbe6ff] flex items-center justify-center shrink-0">
            <Users size={18} color="#2563eb" />
          </span>
          <div>
            <div className="font-bold text-[#2563eb] text-sm">{hintTitle}</div>
            <div className="text-[#1e40af] text-[13px]">{hintText}</div>
          </div>
        </div>
      </div>

      {showNewModal && (
        <div
          className="fixed inset-0 bg-black/45 flex items-center justify-center p-6 z-20"
          onClick={() => setShowNewModal(false)}
        >
          <div
            className="bg-[var(--wa-panel-bg)] rounded-2xl p-5 w-full max-w-[320px] shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mt-0 mb-1 text-lg">New Contact</h2>
            <p className="mt-0 mb-4 text-[var(--wa-text-secondary)] text-sm">{trimmedTerm}</p>

            <form onSubmit={handleCreateNew}>
              <label className={MODAL_LABEL}>Name</label>
              <input
                className={MODAL_INPUT}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                required
              />

              <label className={MODAL_LABEL}>Password</label>
              <input
                className={MODAL_INPUT}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              {newMemberRoleMode === "toggle" && (
                <label className="flex items-center gap-2 mt-3 text-sm text-[var(--wa-text)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsStaff}
                    onChange={(e) => setNewIsStaff(e.target.checked)}
                    className="w-4 h-4 accent-[var(--wa-accent)]"
                  />
                  Add as manager/staff (sees the group chat, not a private broadcast chat)
                </label>
              )}

              <div className="flex justify-end gap-3 mt-5">
                <button
                  type="button"
                  className="border-none bg-transparent text-[var(--wa-text-secondary)] font-semibold cursor-pointer py-2 px-3"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="border-none bg-[var(--wa-accent)] text-white font-semibold rounded-lg py-2 px-4 cursor-pointer"
                  type="submit"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
