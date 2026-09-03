import { Link } from "react-router-dom";
import { ChevronRight, User } from "lucide-react";
import type { Group } from "../../types/group";
import GroupIcon from "./GroupIcon";

interface Props {
  group: Group;
}

export default function GroupCard({ group }: Props) {
  const active = group.customer_count > 0;

  return (
    <Link
      to={`/admin/groups/${group.id}`}
      className="flex items-center gap-3.5 py-3.5 px-4 bg-white rounded-xl no-underline text-inherit mb-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
    >
      <GroupIcon name={group.name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold">{group.name}</span>
          <span
            className={`text-[11px] font-semibold py-[3px] px-2 rounded-[20px] ${
              active ? "bg-[#e3f7ec] text-[#0f9d58]" : "bg-[#eceff1] text-[var(--wa-text-secondary)]"
            }`}
          >
            {active ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--wa-text-secondary)] text-[13px] mt-1">
          <User size={14} /> {group.customer_count} Customers
        </div>
      </div>
      <ChevronRight size={20} className="text-[var(--wa-text-secondary)] shrink-0" />
    </Link>
  );
}
