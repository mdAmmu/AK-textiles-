import { Link } from "react-router-dom";
import type { Group } from "../../types/group";
import GroupIcon from "./GroupIcon";
import "./GroupChatListItem.css";

interface Props {
  group: Group;
}

export default function GroupChatListItem({ group }: Props) {
  return (
    <Link to={`/admin/groups/${group.id}/chat`} className="group-chat-list-item">
      <GroupIcon name={group.name} size={48} />
      <div className="group-chat-list-item__body">
        <span className="group-chat-list-item__name">{group.name}</span>
        <span className="group-chat-list-item__preview">{group.customer_count} members</span>
      </div>
    </Link>
  );
}
