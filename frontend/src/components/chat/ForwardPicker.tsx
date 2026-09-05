import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { fetchGroups } from "../../services/groups";
import type { Group } from "../../types/group";
import GroupIcon from "../admin/GroupIcon";

interface Props {
  excludeGroupId?: string;
  onForward: (groupIds: string[]) => void;
  onClose: () => void;
}

export default function ForwardPicker({ excludeGroupId, onForward, onClose }: Props) {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchGroups().then(setGroups);
  }, []);

  function toggle(groupId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  const options = useMemo(() => {
    const base = groups?.filter((g) => g.id !== excludeGroupId) ?? null;
    if (!base) return base;
    const term = search.trim().toLowerCase();
    if (!term) return base;
    return base.filter((g) => g.name.toLowerCase().includes(term));
  }, [groups, excludeGroupId, search]);

  return (
    <div className="fixed inset-0 bg-white dark:bg-[var(--chat-bg)] flex flex-col z-20">
      <div className="h-[5px] shrink-0 bg-[linear-gradient(90deg,#2563eb,#60a5fa)] rounded-b-md" />
      <div className="flex justify-between items-center pt-[1.125rem] px-[1.125rem] pb-3 font-bold text-[17px] text-[#1a1a1a] dark:text-[var(--chat-text)] shrink-0">
        <span>Forward to</span>
        <button
          className="flex border-none bg-transparent text-[#8b8f8c] dark:text-[var(--chat-text-secondary)] cursor-pointer"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2.5 mx-[1.125rem] mb-3.5 py-3 px-4 bg-[#f3f5f4] dark:bg-[var(--chat-panel-bg)] rounded-xl shrink-0">
        <Search size={17} className="text-[#8b8f8c] shrink-0" />
        <input
          className="flex-1 min-w-0 border-none outline-none bg-transparent font-[inherit] text-[#1a1a1a] dark:text-[var(--chat-text)] placeholder:text-[#9a9e9b]"
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-[1.125rem] flex flex-col gap-2.5">
        {options?.length === 0 && (
          <p className="py-4 px-1 text-[#8b8f8c] dark:text-[var(--chat-text-secondary)]">
            No groups found.
          </p>
        )}
        {options?.map((g) => {
          const checked = selected.has(g.id);
          return (
            <button
              key={g.id}
              type="button"
              className="flex items-center gap-3 py-3 px-3.5 bg-white dark:bg-[var(--chat-bubble-other)] border border-[#eef1ee] dark:border-[var(--chat-border)] rounded-2xl cursor-pointer text-left font-[inherit] text-inherit"
              onClick={() => toggle(g.id)}
            >
              <GroupIcon name={g.name} size={44} />
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="font-semibold text-[#1a1a1a] dark:text-[var(--chat-text)]">
                  {g.name}
                </span>
                <span className="text-[#8b8f8c] dark:text-[var(--chat-text-secondary)] text-[13px] mt-0.5">
                  {g.customer_count} members
                </span>
              </div>
              <span
                className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center text-white ${
                  checked
                    ? "bg-[#2563eb] border-[#2563eb] dark:bg-[var(--chat-accent)] dark:border-[var(--chat-accent)]"
                    : "border-[#dadedb] dark:border-[var(--chat-border)]"
                }`}
              >
                {checked && <Check size={14} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="shrink-0 py-3.5 px-[1.125rem] pb-[1.125rem]">
        <button
          className="w-full py-3.5 bg-[#2563eb] dark:bg-[var(--chat-accent)] text-white border-none rounded-full font-bold text-[15px] cursor-pointer disabled:opacity-50 disabled:cursor-default"
          disabled={selected.size === 0}
          onClick={() => onForward(Array.from(selected))}
        >
          Forward{selected.size ? ` (${selected.size})` : ""}
        </button>
      </div>
    </div>
  );
}
