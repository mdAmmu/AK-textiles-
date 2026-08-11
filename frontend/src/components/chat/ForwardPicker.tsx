import { useEffect, useState } from "react";
import { X } from "lucide-react";
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

  const options = groups?.filter((g) => g.id !== excludeGroupId) ?? null;

  return (
    <div className="forward-picker">
      <div className="forward-picker__header">
        <span>Forward to</span>
        <button onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
      </div>
      <div className="forward-picker__list">
        {options?.length === 0 && <p className="forward-picker__empty">No other groups.</p>}
        {options?.map((g) => {
          const checked = selected.has(g.id);
          return (
            <label
              key={g.id}
              className={`forward-picker__item${checked ? " forward-picker__item--selected" : ""}`}
            >
              <input type="checkbox" checked={checked} onChange={() => toggle(g.id)} />
              <GroupIcon name={g.name} size={40} />
              <span className="forward-picker__item-name">{g.name}</span>
            </label>
          );
        })}
      </div>
      <button
        className="forward-picker__send"
        disabled={selected.size === 0}
        onClick={() => onForward(Array.from(selected))}
      >
        Forward{selected.size ? ` (${selected.size})` : ""}
      </button>
    </div>
  );
}
