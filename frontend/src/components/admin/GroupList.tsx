import type { Group } from "../../types/group";
import GroupCard from "./GroupCard";

interface Props {
  groups: Group[];
}

export default function GroupList({ groups }: Props) {
  if (groups.length === 0) {
    return <p className="p-4 text-[var(--wa-text-secondary)]">No groups yet.</p>;
  }

  return (
    <div className="p-3.5">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}
