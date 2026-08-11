import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assignUserGroup, fetchGroupUsers, fetchUnassignedUsers } from "../services/groups";
import type { GroupUser } from "../types/group";
import type { User } from "../types/user";
import CustomerRow from "../components/admin/CustomerRow";
import AddCustomerPanel from "../components/admin/AddCustomerPanel";
import LoadingScreen from "../components/common/LoadingScreen";
import "./GroupDetail.css";

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<GroupUser[] | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [candidates, setCandidates] = useState<User[]>([]);

  useEffect(() => {
    if (groupId) fetchGroupUsers(groupId).then(setCustomers);
  }, [groupId]);

  async function handleRemove(userId: string) {
    await assignUserGroup(userId, null);
    setCustomers((prev) => prev?.filter((c) => c.id !== userId) ?? null);
  }

  async function handleSearch(term: string) {
    const results = await fetchUnassignedUsers(term || undefined);
    setCandidates(results);
  }

  async function handleAdd(userId: string) {
    if (!groupId) return;
    const added = await assignUserGroup(userId, groupId);
    setCustomers((prev) => [...(prev ?? []), added]);
    setShowAddPanel(false);
  }

  if (customers === null) return <LoadingScreen />;

  return (
    <div className="group-detail-page">
      <header className="group-detail-page__header">
        <button onClick={() => navigate("/admin/groups")}>← Groups</button>
      </header>
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
        + Add Customer
      </button>

      {showAddPanel && (
        <AddCustomerPanel
          candidates={candidates}
          onSearch={handleSearch}
          onAdd={handleAdd}
          onClose={() => setShowAddPanel(false)}
        />
      )}
    </div>
  );
}
