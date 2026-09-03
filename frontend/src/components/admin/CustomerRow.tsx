import { Trash2 } from "lucide-react";
import type { GroupUser } from "../../types/group";
import Avatar from "../common/Avatar";

interface Props {
  customer: GroupUser;
  onRemove: (userId: string) => void;
}

export default function CustomerRow({ customer, onRemove }: Props) {
  return (
    <div className="flex items-center gap-3 py-3.5 px-4 bg-white rounded-xl mb-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <Avatar name={customer.name} size={40} />
      <div className="flex-1 min-w-0">
        <div className="font-bold">{customer.name}</div>
        <div className="text-[var(--wa-text-secondary)] text-[13px]">
          {customer.email ?? customer.phone}
        </div>
      </div>
      <button
        className="shrink-0 flex items-center gap-1 border-none bg-[#fdeaea] text-[#e53935] rounded-lg py-2 px-3 text-[13px] font-semibold cursor-pointer"
        onClick={() => onRemove(customer.id)}
      >
        <Trash2 size={14} /> Remove
      </button>
    </div>
  );
}
