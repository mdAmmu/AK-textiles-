import type { GroupUser } from "../../types/group";
import "./CustomerRow.css";

interface Props {
  customer: GroupUser;
  onRemove: (userId: string) => void;
}

export default function CustomerRow({ customer, onRemove }: Props) {
  return (
    <div className="customer-row">
      <div>
        <div className="customer-row__name">{customer.name}</div>
        <div className="customer-row__contact">{customer.phone ?? customer.email}</div>
      </div>
      <button className="customer-row__remove" onClick={() => onRemove(customer.id)}>
        Remove
      </button>
    </div>
  );
}
