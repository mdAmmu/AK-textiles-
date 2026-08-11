import type { GroupUser } from "../../types/group";
import Avatar from "../common/Avatar";
import "./CustomerRow.css";

interface Props {
  customer: GroupUser;
  onRemove: (userId: string) => void;
}

export default function CustomerRow({ customer, onRemove }: Props) {
  return (
    <div className="customer-row">
      <Avatar name={customer.name} size={40} />
      <div className="customer-row__body">
        <div className="customer-row__name">{customer.name}</div>
        <div className="customer-row__contact">{customer.email ?? customer.phone}</div>
      </div>
      <button className="customer-row__remove" onClick={() => onRemove(customer.id)}>
        🗑 Remove
      </button>
    </div>
  );
}
