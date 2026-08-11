import { useState } from "react";
import type { User } from "../../types/user";
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
        <span>Add Customer</span>
        <button onClick={onClose}>Close</button>
      </div>
      <input
        className="add-customer-panel__search"
        placeholder="Search by name or email..."
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          onSearch(e.target.value);
        }}
      />
      <div className="add-customer-panel__list">
        {candidates.length === 0 && (
          <p className="add-customer-panel__empty">No unassigned customers found.</p>
        )}
        {candidates.map((c) => (
          <button key={c.id} className="add-customer-panel__item" onClick={() => onAdd(c.id)}>
            <span>{c.name}</span>
            <span className="add-customer-panel__contact">{c.phone ?? c.email}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
