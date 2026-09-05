import { useEffect, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { fetchUsers } from "../../services/users";
import type { Group } from "../../types/group";
import type { User } from "../../types/user";
import Avatar from "../common/Avatar";
import GroupIcon from "./GroupIcon";

export function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 bg-[#e6edff] dark:bg-[#1e2a4a] text-[#2563eb] dark:text-[#60a5fa] rounded-full py-1 pl-3 pr-1.5 text-[13px] font-medium">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex border-none bg-white/60 dark:bg-black/20 rounded-full p-0.5 cursor-pointer text-inherit"
        aria-label={`Remove ${label}`}
      >
        <X size={12} />
      </button>
    </span>
  );
}

interface PickerProps {
  groups: Group[];
  selectedGroupIds: Set<string>;
  selectedUsers: Map<string, User>;
  onToggleGroup: (groupId: string) => void;
  onToggleUser: (user: User) => void;
  onClose: () => void;
  title?: string;
}

export default function BroadcastRecipientPicker({
  groups,
  selectedGroupIds,
  selectedUsers,
  onToggleGroup,
  onToggleUser,
  onClose,
  title = "Select Recipients",
}: PickerProps) {
  const [term, setTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchUsers(term.trim() || undefined).then(setUsers);
    }, 200);
    return () => clearTimeout(handle);
  }, [term]);

  const totalSelected =
    groups.filter((g) => selectedGroupIds.has(g.id)).reduce((sum, g) => sum + g.customer_count, 0) +
    selectedUsers.size;

  return (
    <div className="fixed inset-0 bg-[#f5f8ff] dark:bg-[#10161f] flex flex-col z-20">
      <div className="flex items-center gap-3 py-[1.125rem] px-4 shrink-0 border-b border-[#eef1ee] dark:border-[#232d3a]">
        <button
          className="flex border-none bg-transparent text-[#1a1a1a] dark:text-[#e9edef] cursor-pointer"
          onClick={onClose}
          aria-label="Close"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="flex-1 font-bold text-lg text-[#1a1a1a] dark:text-[#e9edef]">{title}</span>
        <button
          className="border-none bg-[#2563eb] text-white font-semibold cursor-pointer rounded-full py-1.5 px-4"
          onClick={onClose}
        >
          Done
        </button>
      </div>

      <div className="flex items-center gap-2 py-3 px-4 bg-white dark:bg-[#1e2530] border-b border-[#eef1ee] dark:border-[#232d3a] shrink-0">
        <Search size={18} className="text-[#7c827e] dark:text-[#8b96a5]" />
        <input
          className="flex-1 border-none outline-none bg-transparent py-1 font-[inherit] text-[#1a1a1a] dark:text-[#e9edef]"
          placeholder="Search customers by name or phone..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {groups.length > 0 && (
          <>
            <p className="mt-0 mb-2 text-[#7c827e] dark:text-[#8b96a5] text-[13px] font-semibold">
              Groups
            </p>
            <div className="flex flex-col gap-2 mb-4">
              {groups.map((g) => (
                <label
                  key={g.id}
                  className="flex items-center gap-3 bg-white dark:bg-[#1e2530] rounded-xl p-3 cursor-pointer border border-[#eef1ee] dark:border-[#232d3a]"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroupIds.has(g.id)}
                    onChange={() => onToggleGroup(g.id)}
                    className="w-[18px] h-[18px] accent-[#2563eb]"
                  />
                  <GroupIcon name={g.name} size={36} />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="font-semibold text-[#1a1a1a] dark:text-[#e9edef]">{g.name}</span>
                    <span className="text-[#8b8f8c] dark:text-[#8b96a5] text-[13px]">
                      {g.customer_count} members
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        <p className="mt-0 mb-2 text-[#7c827e] dark:text-[#8b96a5] text-[13px] font-semibold">
          Individual customers
        </p>
        {users.length === 0 && (
          <p className="text-[#8b8f8c] dark:text-[#8b96a5] text-sm">No customers found.</p>
        )}
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-3 bg-white dark:bg-[#1e2530] rounded-xl p-3 cursor-pointer border border-[#eef1ee] dark:border-[#232d3a]"
            >
              <input
                type="checkbox"
                checked={selectedUsers.has(u.id)}
                onChange={() => onToggleUser(u)}
                className="w-[18px] h-[18px] accent-[#2563eb]"
              />
              <Avatar name={u.name} size={36} />
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="font-semibold text-[#1a1a1a] dark:text-[#e9edef]">{u.name}</span>
                <span className="text-[#8b8f8c] dark:text-[#8b96a5] text-[13px]">
                  {u.phone ?? u.email}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="shrink-0 p-4 border-t border-[#eef1ee] dark:border-[#232d3a] bg-white dark:bg-[#1e2530] text-center text-[#7c827e] dark:text-[#8b96a5] text-sm">
        {totalSelected} recipient{totalSelected === 1 ? "" : "s"} selected
      </div>
    </div>
  );
}
