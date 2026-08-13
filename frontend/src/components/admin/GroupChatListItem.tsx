import { Link } from "react-router-dom";
import type { Group } from "../../types/group";
import { formatGroupTimestamp } from "../../utils/formatGroupTimestamp";
import GroupIcon from "./GroupIcon";
import "./GroupChatListItem.css";

interface Props {
  group: Group;
}

export default function GroupChatListItem({ group }: Props) {
  const hasUnread = !!group.unread_count && group.unread_count > 0;
  return (
    <Link to={`/admin/groups/${group.id}/chat`} className="group-chat-list-item">
      <GroupIcon name={group.name} size={48} />
      <div className="group-chat-list-item__body">
        <span className="group-chat-list-item__name">{group.name}</span>
        <span className="group-chat-list-item__preview">{group.customer_count} members</span>
      </div>
      <div className="group-chat-list-item__meta">
        {group.last_message_at && (
          <span className="group-chat-list-item__time">
            {formatGroupTimestamp(group.last_message_at)}
          </span>
        )}
        {hasUnread && <span className="group-chat-list-item__badge">{group.unread_count}</span>}
      </div>
    </Link>
  );
}
