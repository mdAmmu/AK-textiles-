import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MoreVertical, Pencil, User as UserIcon, UserPlus } from "lucide-react";
import {
  assignUserGroup,
  createAndAssignCustomer,
  fetchGroups,
  fetchGroupUsers,
  fetchUnassignedUsers,
} from "../services/groups";
import type { Group, GroupUser } from "../types/group";
import type { User } from "../types/user";
import GroupIcon from "../components/admin/GroupIcon";
import CustomerRow from "../components/admin/CustomerRow";
import AddCustomerPanel from "../components/admin/AddCustomerPanel";
import LoadingScreen from "../components/common/LoadingScreen";
import "./GroupDetail.css";

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [customers, setCustomers] = useState<GroupUser[] | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [candidates, setCandidates] = useState<User[]>([]);

  useEffect(() => {
    if (!groupId) return;
    fetchGroups().then((all) => setGroup(all.find((g) => g.id === groupId) ?? null));
    fetchGroupUsers(groupId).then(setCustomers);
  }, [groupId]);

  async function handleRemove(userId: string) {
    await assignUserGroup(userId, null);
    setCustomers((prev) => prev?.filter((c) => c.id !== userId) ?? null);
    setGroup((prev) => (prev ? { ...prev, customer_count: prev.customer_count - 1 } : prev));
  }

  async function handleSearch(term: string) {
    const results = await fetchUnassignedUsers(term || undefined);
    setCandidates(results);
  }

  async function handleAdd(userId: string) {
    if (!groupId) return;
    const added = await assignUserGroup(userId, groupId);
    setCustomers((prev) => [...(prev ?? []), added]);
    setGroup((prev) => (prev ? { ...prev, customer_count: prev.customer_count + 1 } : prev));
    setShowAddPanel(false);
  }

  async function handleAddNew(phone: string, name: string, password: string) {
    if (!groupId) return;
    const added = await createAndAssignCustomer(groupId, name, phone, password);
    setCustomers((prev) => [...(prev ?? []), added]);
    setGroup((prev) => (prev ? { ...prev, customer_count: prev.customer_count + 1 } : prev));
    setShowAddPanel(false);
  }

  if (customers === null || group === null) return <LoadingScreen />;

  const active = group.customer_count > 0;

  return (
    <div className="group-detail-page">
      <header className="group-detail-page__header">
        <button onClick={() => navigate("/admin/groups")} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="group-detail-page__header-info">
          <h1>{group.name}</h1>
          <span>{group.customer_count} Customers</span>
        </div>
        <button aria-label="Edit">
          <Pencil size={18} />
        </button>
        <button aria-label="More options">
          <MoreVertical size={20} />
        </button>
      </header>

      <div className="group-detail-page__hero">
        <GroupIcon name={group.name} />
        <div className="group-detail-page__hero-info">
          <div className="group-detail-page__hero-top">
            <span className="group-detail-page__hero-name">{group.name}</span>
            <span
              className={`group-detail-page__hero-status${active ? " group-detail-page__hero-status--active" : ""}`}
            >
              {active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="group-detail-page__hero-count">
            <UserIcon size={14} /> {group.customer_count} Customers
          </div>
        </div>
      </div>

      <div className="group-detail-page__members-header">
        <span>Members</span>
        <button
          className="group-detail-page__add-link"
          onClick={() => {
            setShowAddPanel(true);
            handleSearch("");
          }}
        >
          <UserPlus size={16} /> Add Customer
        </button>
      </div>

      <div className="group-detail-page__list">
        {customers.length === 0 && <p className="group-detail-page__empty">No customers yet.</p>}
        {customers.map((c) => (
          <CustomerRow key={c.id} customer={c} onRemove={handleRemove} />
        ))}
      </div>

      <button
        className="group-detail-page__add"
        onClick={() => {
          setShowAddPanel(true);
          handleSearch("");
        }}
      >
        <UserPlus size={18} /> Add Customer
      </button>

      {showAddPanel && (
        <AddCustomerPanel
          candidates={candidates}
          onSearch={handleSearch}
          onAdd={handleAdd}
          onAddNew={handleAddNew}
          onClose={() => setShowAddPanel(false)}
        />
      )}
    </div>
  );
}
