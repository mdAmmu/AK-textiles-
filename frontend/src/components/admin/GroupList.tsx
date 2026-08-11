import type { Group } from "../../types/group";
import GroupCard from "./GroupCard";
import "./GroupList.css";

interface Props {
  groups: Group[];
}

export default function GroupList({ groups }: Props) {
  if (groups.length === 0) {
    return <p className="group-list__empty">No groups yet.</p>;
  }

  return (
    <div className="group-list">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}
