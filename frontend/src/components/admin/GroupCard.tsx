import { Link } from "react-router-dom";
import { ChevronRight, User } from "lucide-react";
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
          <User size={14} /> {group.customer_count} Customers
        </div>
      </div>
      <ChevronRight size={20} className="group-card__arrow" />
    </Link>
  );
}
