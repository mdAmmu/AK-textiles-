import { useState } from "react";
import { ArrowLeft, Search, Users } from "lucide-react";
import type { User } from "../../types/user";
import Avatar from "../common/Avatar";
import "./AddCustomerPanel.css";

interface Props {
  candidates: User[];
  onSearch: (term: string) => void;
  onAdd: (userId: string) => void;
  onClose: () => void;
}

export default function AddCustomerPanel({ candidates, onSearch, onAdd, onClose }: Props) {
  const [term, setTerm] = useState("");

  return (
    <div className="add-customer-panel">
      <div className="add-customer-panel__header">
        <button className="add-customer-panel__back" onClick={onClose} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <span className="add-customer-panel__title">Add Customer</span>
        <button className="add-customer-panel__close" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="add-customer-panel__search-row">
        <Search size={18} />
        <input
          placeholder="Search by name or email..."
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            onSearch(e.target.value);
          }}
        />
      </div>

      <div className="add-customer-panel__list">
        <p className="add-customer-panel__section-label">All Customers</p>
        {candidates.length === 0 && (
          <p className="add-customer-panel__empty">No unassigned customers found.</p>
        )}
        {candidates.map((c) => (
          <div key={c.id} className="add-customer-panel__item">
            <Avatar name={c.name} size={40} />
            <div className="add-customer-panel__item-info">
              <span className="add-customer-panel__item-name">{c.name}</span>
              <span className="add-customer-panel__item-contact">{c.email ?? c.phone}</span>
            </div>
            <button className="add-customer-panel__add-btn" onClick={() => onAdd(c.id)}>
              Add
            </button>
          </div>
        ))}

        <div className="add-customer-panel__hint">
          <span className="add-customer-panel__hint-icon">
            <Users size={18} color="#0f9d58" />
          </span>
          <div>
            <div className="add-customer-panel__hint-title">Can't find a customer?</div>
            <div className="add-customer-panel__hint-text">
              Ask them to start a chat with you first.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
