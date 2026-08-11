import { Link } from "react-router-dom";
import type { Group } from "../../types/group";
import "./GroupCard.css";

interface Props {
  group: Group;
}

export default function GroupCard({ group }: Props) {
  return (
    <Link to={`/admin/groups/${group.id}`} className="group-card">
      <div>
        <div className="group-card__name">{group.name}</div>
        <div className="group-card__count">{group.customer_count} Customers</div>
      </div>
      <span className="group-card__arrow">→</span>
    </Link>
  );
}
