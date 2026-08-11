import { Link } from "react-router-dom";
import type { Group } from "../../types/group";
import GroupIcon from "./GroupIcon";
import "./GroupCard.css";

interface Props {
  group: Group;
}

export default function GroupCard({ group }: Props) {
  const active = group.customer_count > 0;

  return (
    <Link to={`/admin/groups/${group.id}`} className="group-card">
      <GroupIcon name={group.name} />
      <div className="group-card__body">
        <div className="group-card__top">
          <span className="group-card__name">{group.name}</span>
          <span className={`group-card__status${active ? " group-card__status--active" : ""}`}>
            {active ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="group-card__count">
          <span>👤</span> {group.customer_count} Customers
        </div>
      </div>
      <span className="group-card__arrow">›</span>
    </Link>
  );
}
