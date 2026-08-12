import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Plus, Trash2 } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import type { User } from "../../types/user";
import type { Group } from "../../types/group";
import { createGroup, deleteGroup, fetchGroups } from "../../services/groups";
import Avatar from "../common/Avatar";
import GroupIcon from "./GroupIcon";
import "./AdminAccountPanel.css";

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();
  const { signOut } = useClerk();

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

  async function handleConfirmLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="admin-account-panel">
      <div className="admin-account-panel__header">
        <button onClick={onClose} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <span className="admin-account-panel__title">Account</span>
      </div>

      <div className="admin-account-panel__hero">
        <Avatar name={admin.name} size={96} />
        <h1>{admin.name}</h1>
        {(admin.phone || admin.email) && (
          <span className="admin-account-panel__meta">{admin.phone ?? admin.email}</span>
        )}
      </div>

      <div className="admin-account-panel__section">
        {!showAddGroup ? (
          <button className="admin-account-panel__add-group-btn" onClick={() => setShowAddGroup(true)}>
            <Plus size={18} /> Add Group
          </button>
        ) : (
          <form className="admin-account-panel__form" onSubmit={handleCreateGroup}>
            <label className="admin-account-panel__label">Group Name</label>
            <input
              className="admin-account-panel__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />

            <label className="admin-account-panel__label">Description (optional)</label>
            <input
              className="admin-account-panel__input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {error && <p className="admin-account-panel__error">{error}</p>}

            <div className="admin-account-panel__form-actions">
              <button
                type="button"
                className="admin-account-panel__cancel-btn"
                onClick={() => {
                  setShowAddGroup(false);
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button className="admin-account-panel__submit-btn" type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="admin-account-panel__section admin-account-panel__section--groups">
        <div className="admin-account-panel__section-label">Groups</div>
        {groups === null ? (
          <p className="admin-account-panel__empty">Loading...</p>
        ) : groups.length === 0 ? (
          <p className="admin-account-panel__empty">No groups yet.</p>
        ) : (
          <div className="admin-account-panel__group-list">
            {groups.map((g) => (
              <div key={g.id} className="admin-account-panel__group-row">
                <GroupIcon name={g.name} size={40} />
                <div className="admin-account-panel__group-body">
                  <span className="admin-account-panel__group-name">{g.name}</span>
                  <span className="admin-account-panel__group-count">{g.customer_count} members</span>
                </div>
                <button
                  className="admin-account-panel__delete-btn"
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

      <div className="admin-account-panel__section">
        <button
          className="admin-account-panel__logout-btn"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      {pendingDelete && (
        <div className="admin-account-panel__confirm-overlay">
          <div className="admin-account-panel__confirm-dialog">
            <h2>Delete "{pendingDelete.name}"?</h2>
            <p>
              This will permanently delete the group and its chat. All members of this group will
              be logged out.
            </p>
            <div className="admin-account-panel__confirm-actions">
              <button
                className="admin-account-panel__cancel-btn"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="admin-account-panel__delete-confirm-btn"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="admin-account-panel__confirm-overlay">
          <div className="admin-account-panel__confirm-dialog">
            <h2>Logout?</h2>
            <p>You'll need to sign in again to access the admin panel.</p>
            <div className="admin-account-panel__confirm-actions">
              <button
                className="admin-account-panel__cancel-btn"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
              >
                Cancel
              </button>
              <button
                className="admin-account-panel__delete-confirm-btn"
                onClick={handleConfirmLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
