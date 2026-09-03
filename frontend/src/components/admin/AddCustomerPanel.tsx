import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Search, UserPlus, Users } from "lucide-react";
import type { User } from "../../types/user";
import Avatar from "../common/Avatar";

const ITEM = "flex items-center gap-3 bg-white rounded-xl p-3 mb-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]";
const ITEM_NAME = "font-bold";
const ITEM_CONTACT = "text-[var(--wa-text-secondary)] text-[13px]";
const ADD_BTN =
  "shrink-0 border border-[var(--wa-accent)] bg-transparent text-[var(--wa-accent)] rounded-lg py-[0.4375rem] px-3.5 font-semibold cursor-pointer";
const MODAL_LABEL = "block text-[13px] font-semibold mt-2.5 mb-1 text-[var(--wa-text-secondary)]";
const MODAL_INPUT =
  "w-full box-border py-2.5 px-3 rounded-lg border border-[var(--wa-border)] font-[inherit]";

interface Props {
  candidates: User[];
  onSearch: (term: string) => void;
  onAdd: (userId: string) => void;
  onAddNew: (phone: string, name: string, password: string) => Promise<void>;
  onClose: () => void;
}

function looksLikePhone(term: string): boolean {
  return term.replace(/\D/g, "").length >= 7;
}

export default function AddCustomerPanel({ candidates, onSearch, onAdd, onAddNew, onClose }: Props) {
  const [term, setTerm] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedTerm = term.trim();
  const showAddNewOption = candidates.length === 0 && looksLikePhone(trimmedTerm);

  function openNewModal() {
    setNewName("");
    setNewPassword("");
    setError(null);
    setShowNewModal(true);
  }

  async function handleCreateNew(e: FormEvent) {
    e.preventDefault();
    if (creating) return;
    setError(null);
    setCreating(true);
    try {
      await onAddNew(trimmedTerm, newName.trim(), newPassword);
      setShowNewModal(false);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "Could not add customer. Try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[var(--wa-panel-bg)] flex flex-col z-10">
      <div className="flex items-center gap-3 py-[1.125rem] px-4 bg-[var(--wa-header)] shrink-0">
        <button
          className="flex border-none bg-transparent text-white cursor-pointer"
          onClick={onClose}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="flex-1 text-white font-bold text-lg">Add Customer</span>
        <button
          className="border-none bg-transparent text-white font-semibold cursor-pointer"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="flex items-center gap-2 py-3.5 px-4 bg-white border-b border-[var(--wa-border)] text-[var(--wa-text-secondary)] shrink-0">
        <Search size={18} />
        <input
          className="flex-1 border-none outline-none bg-[var(--wa-panel-bg)] py-2.5 px-3.5 rounded-lg font-[inherit]"
          placeholder="Search by name or phone number..."
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            onSearch(e.target.value);
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3.5">
        <p className="mt-0 mb-2 text-[var(--wa-text-secondary)] text-[13px] font-semibold">
          All Customers
        </p>
        {candidates.length === 0 && !showAddNewOption && (
          <p className="p-4 text-[var(--wa-text-secondary)]">No unassigned customers found.</p>
        )}
        {candidates.map((c) => (
          <div key={c.id} className={ITEM}>
            <Avatar name={c.name} size={40} />
            <div className="flex-1 min-w-0 flex flex-col">
              <span className={ITEM_NAME}>{c.name}</span>
              <span className={ITEM_CONTACT}>{c.phone ?? c.email}</span>
            </div>
            <button className={ADD_BTN} onClick={() => onAdd(c.id)}>
              Add
            </button>
          </div>
        ))}

        {showAddNewOption && (
          <div className={ITEM}>
            <Avatar name={trimmedTerm} size={40} />
            <div className="flex-1 min-w-0 flex flex-col">
              <span className={ITEM_NAME}>{trimmedTerm}</span>
              <span className={ITEM_CONTACT}>Not in your customers yet</span>
            </div>
            <button className={ADD_BTN} onClick={openNewModal}>
              <UserPlus size={14} /> Add
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 bg-[#e3f7ec] rounded-xl p-3.5 mt-2">
          <span className="w-9 h-9 rounded-full bg-[#c4ecd7] flex items-center justify-center shrink-0">
            <Users size={18} color="#0f9d58" />
          </span>
          <div>
            <div className="font-bold text-[#0f9d58] text-sm">Can't find a customer?</div>
            <div className="text-[#2f6b4f] text-[13px]">
              Search their phone number and add them directly.
            </div>
          </div>
        </div>
      </div>

      {showNewModal && (
        <div
          className="fixed inset-0 bg-black/45 flex items-center justify-center p-6 z-20"
          onClick={() => !creating && setShowNewModal(false)}
        >
          <div
            className="bg-[var(--wa-panel-bg)] rounded-2xl p-5 w-full max-w-[320px] shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mt-0 mb-1 text-lg">New Customer</h2>
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

              {error && <p className="text-[#e53e3e] text-[13px] mt-2 mb-0">{error}</p>}

              <div className="flex justify-end gap-3 mt-5">
                <button
                  type="button"
                  className="border-none bg-transparent text-[var(--wa-text-secondary)] font-semibold cursor-pointer py-2 px-3 disabled:opacity-60 disabled:cursor-default"
                  onClick={() => setShowNewModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  className="border-none bg-[var(--wa-accent)] text-white font-semibold rounded-lg py-2 px-4 cursor-pointer disabled:opacity-60 disabled:cursor-default"
                  type="submit"
                  disabled={creating}
                >
                  {creating ? "Adding..." : "OK"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
