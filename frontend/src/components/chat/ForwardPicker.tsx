import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { fetchGroups } from "../../services/groups";
import type { Group } from "../../types/group";
import GroupIcon from "../admin/GroupIcon";
import "./ForwardPicker.css";

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
    <div className="forward-picker">
      <div className="forward-picker__accent" />
      <div className="forward-picker__header">
        <span>Forward to</span>
        <button onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
      </div>

      <div className="forward-picker__search-row">
        <Search size={17} className="forward-picker__search-icon" />
        <input
          className="forward-picker__search"
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="forward-picker__list">
        {options?.length === 0 && <p className="forward-picker__empty">No groups found.</p>}
        {options?.map((g) => {
          const checked = selected.has(g.id);
          return (
            <button
              key={g.id}
              type="button"
              className="forward-picker__item"
              onClick={() => toggle(g.id)}
            >
              <GroupIcon name={g.name} size={44} />
              <div className="forward-picker__item-body">
                <span className="forward-picker__item-name">{g.name}</span>
                <span className="forward-picker__item-count">{g.customer_count} members</span>
              </div>
              <span
                className={`forward-picker__checkbox${checked ? " forward-picker__checkbox--checked" : ""}`}
              >
                {checked && <Check size={14} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="forward-picker__footer">
        <button
          className="forward-picker__send"
          disabled={selected.size === 0}
          onClick={() => onForward(Array.from(selected))}
        >
          Forward{selected.size ? ` (${selected.size})` : ""}
        </button>
      </div>
    </div>
  );
}
