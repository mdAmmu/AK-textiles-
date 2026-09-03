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

const HEADER_BTN = "flex border-none bg-transparent text-white cursor-pointer p-1";

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

  async function handleAddNew(phone: string, name: string, password: string, role: "USER" | "STAFF") {
    if (!groupId) return;
    const added = await createAndAssignCustomer(groupId, name, phone, password, role);
    setCustomers((prev) => [...(prev ?? []), added]);
    setGroup((prev) => (prev ? { ...prev, customer_count: prev.customer_count + 1 } : prev));
    setShowAddPanel(false);
  }

  if (customers === null || group === null) return <LoadingScreen />;

  const active = group.customer_count > 0;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--wa-panel-bg)]">
      <header className="flex items-center gap-3 py-[1.125rem] px-4 bg-[var(--wa-header)] shrink-0">
        <button className={HEADER_BTN} onClick={() => navigate("/admin/groups")} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 flex flex-col">
          <h1 className="m-0 text-xl text-white">{group.name}</h1>
          <span className="text-xs text-white/85">{group.customer_count} Customers</span>
        </div>
        <button className={HEADER_BTN} aria-label="Edit">
          <Pencil size={18} />
        </button>
        <button className={HEADER_BTN} aria-label="More options">
          <MoreVertical size={20} />
        </button>
      </header>

      <div className="flex items-center gap-3.5 bg-white m-3.5 p-4 rounded-xl">
        <GroupIcon name={group.name} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[17px]">{group.name}</span>
            <span
              className={`text-[11px] font-semibold py-[3px] px-2 rounded-[20px] ${
                active ? "bg-[#e3f7ec] text-[#0f9d58]" : "bg-[#eceff1] text-[var(--wa-text-secondary)]"
              }`}
            >
              {active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--wa-text-secondary)] text-[13px] mt-1">
            <UserIcon size={14} /> {group.customer_count} Customers
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-3.5 mb-1.5">
        <span className="font-bold">Members</span>
        <button
          className="flex items-center gap-1 border-none bg-transparent text-[var(--wa-accent)] font-semibold text-sm cursor-pointer"
          onClick={() => {
            setShowAddPanel(true);
            handleSearch("");
          }}
        >
          <UserPlus size={16} /> Add Customer
        </button>
      </div>

      <div className="flex-1 px-3.5">
        {customers.length === 0 && (
          <p className="p-4 text-[var(--wa-text-secondary)]">No customers yet.</p>
        )}
        {customers.map((c) => (
          <CustomerRow key={c.id} customer={c} onRemove={handleRemove} />
        ))}
      </div>

      <button
        className="flex items-center justify-center gap-2 m-3.5 p-3.5 bg-[var(--wa-header)] text-white border-none rounded-[10px] font-semibold cursor-pointer"
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
