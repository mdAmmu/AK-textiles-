import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Search, UserPlus, Users } from "lucide-react";
import type { User } from "../../types/user";
import Avatar from "../common/Avatar";
import "./AddCustomerPanel.css";

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
    <div className="add-customer-panel">
      <div className="add-customer-panel__header">
        <button className="add-customer-panel__back" onClick={onClose} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <span className="add-customer-panel__title">Add Customer</span>
        <button className="add-customer-panel__close" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="add-customer-panel__search-row">
        <Search size={18} />
        <input
          placeholder="Search by name or phone number..."
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            onSearch(e.target.value);
          }}
        />
      </div>

      <div className="add-customer-panel__list">
        <p className="add-customer-panel__section-label">All Customers</p>
        {candidates.length === 0 && !showAddNewOption && (
          <p className="add-customer-panel__empty">No unassigned customers found.</p>
        )}
        {candidates.map((c) => (
          <div key={c.id} className="add-customer-panel__item">
            <Avatar name={c.name} size={40} />
            <div className="add-customer-panel__item-info">
              <span className="add-customer-panel__item-name">{c.name}</span>
              <span className="add-customer-panel__item-contact">{c.phone ?? c.email}</span>
            </div>
            <button className="add-customer-panel__add-btn" onClick={() => onAdd(c.id)}>
              Add
            </button>
          </div>
        ))}

        {showAddNewOption && (
          <div className="add-customer-panel__item">
            <Avatar name={trimmedTerm} size={40} />
            <div className="add-customer-panel__item-info">
              <span className="add-customer-panel__item-name">{trimmedTerm}</span>
              <span className="add-customer-panel__item-contact">Not in your customers yet</span>
            </div>
            <button className="add-customer-panel__add-btn" onClick={openNewModal}>
              <UserPlus size={14} /> Add
            </button>
          </div>
        )}

        <div className="add-customer-panel__hint">
          <span className="add-customer-panel__hint-icon">
            <Users size={18} color="#0f9d58" />
          </span>
          <div>
            <div className="add-customer-panel__hint-title">Can't find a customer?</div>
            <div className="add-customer-panel__hint-text">
              Search their phone number and add them directly.
            </div>
          </div>
        </div>
      </div>

      {showNewModal && (
        <div className="add-customer-panel__modal-overlay" onClick={() => !creating && setShowNewModal(false)}>
          <div className="add-customer-panel__modal" onClick={(e) => e.stopPropagation()}>
            <h2>New Customer</h2>
            <p className="add-customer-panel__modal-phone">{trimmedTerm}</p>

            <form onSubmit={handleCreateNew}>
              <label className="add-customer-panel__modal-label">Name</label>
              <input
                className="add-customer-panel__modal-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                required
              />

              <label className="add-customer-panel__modal-label">Password</label>
              <input
                className="add-customer-panel__modal-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              {error && <p className="add-customer-panel__modal-error">{error}</p>}

              <div className="add-customer-panel__modal-actions">
                <button
                  type="button"
                  className="add-customer-panel__modal-cancel"
                  onClick={() => setShowNewModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button className="add-customer-panel__modal-ok" type="submit" disabled={creating}>
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
