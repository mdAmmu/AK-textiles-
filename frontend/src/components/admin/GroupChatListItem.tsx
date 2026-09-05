import { Link } from "react-router-dom";
import type { Group } from "../../types/group";
import { formatGroupTimestamp } from "../../utils/formatGroupTimestamp";
import GroupIcon from "./GroupIcon";

interface Props {
  group: Group;
}

export default function GroupChatListItem({ group }: Props) {
  const hasUnread = !!group.unread_count && group.unread_count > 0;
  return (
    <Link
      to={`/admin/groups/${group.id}/chat`}
      className="flex items-center gap-3.5 py-3 px-3.5 bg-white border border-[#eef1ee] rounded-2xl no-underline text-inherit dark:bg-[#1e2530] dark:border-[#232d3a]"
    >
      <GroupIcon name={group.name} size={48} />
      <div className="flex-1 min-w-0 flex flex-col">
        <span className="font-semibold text-[#1a1a1a] dark:text-[#e9edef]">{group.name}</span>
        <span className="text-[#8b8f8c] text-sm mt-0.5 dark:text-[#8b96a5]">
          {group.customer_count} members
        </span>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {group.last_message_at && (
          <span className="text-[#9a9e9b] text-xs dark:text-[#6b7480]">
            {formatGroupTimestamp(group.last_message_at)}
          </span>
        )}
        {hasUnread && (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#2563eb] text-white text-[11px] font-bold flex items-center justify-center">
            {group.unread_count}
          </span>
        )}
      </div>
    </Link>
  );
}
