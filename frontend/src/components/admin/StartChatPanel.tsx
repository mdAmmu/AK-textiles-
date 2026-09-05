import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, Search } from "lucide-react";
import { fetchUsers } from "../../services/users";
import type { User } from "../../types/user";
import Avatar from "../common/Avatar";

interface Props {
  excludeIds: string[];
  onChat: (user: User) => void;
  onClose: () => void;
}

export default function StartChatPanel({ excludeIds, onChat, onClose }: Props) {
  const [term, setTerm] = useState("");
  const [candidates, setCandidates] = useState<User[]>([]);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchUsers(term.trim() || undefined).then((users) =>
        setCandidates(users.filter((u) => !excludeIds.includes(u.id))),
      );
    }, 200);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  async function handleChat(user: User) {
    if (starting) return;
    setStarting(user.id);
    try {
      await onChat(user);
    } finally {
      setStarting(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-[var(--wa-panel-bg)] flex flex-col z-10">
      <div className="flex items-center gap-3 py-[1.125rem] px-4 bg-[var(--wa-header)] shrink-0">
        <button
          className="flex border-none bg-transparent text-white cursor-pointer"
          onClick={onClose}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="flex-1 text-white font-bold text-lg">New Chat</span>
      </div>

      <div className="flex items-center gap-2 py-3.5 px-4 bg-white border-b border-[var(--wa-border)] text-[var(--wa-text-secondary)] shrink-0">
        <Search size={18} />
        <input
          className="flex-1 min-w-0 border-none outline-none bg-[var(--wa-panel-bg)] py-2.5 px-3.5 rounded-lg font-[inherit]"
          placeholder="Search customers by name or phone..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3.5">
        <p className="mt-0 mb-2 text-[var(--wa-text-secondary)] text-[13px] font-semibold">
          Customers you haven't chatted with
        </p>
        {candidates.length === 0 && (
          <p className="p-4 text-[var(--wa-text-secondary)]">No customers found.</p>
        )}
        {candidates.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 bg-white rounded-xl p-3 mb-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
          >
            <Avatar name={c.name} size={40} />
            <div className="flex-1 min-w-0 flex flex-col">
              <span className="font-bold truncate">{c.name}</span>
              <span className="text-[var(--wa-text-secondary)] text-[13px] truncate">
                {c.phone ?? c.email}
              </span>
            </div>
            <button
              className="shrink-0 flex items-center gap-1.5 border border-[var(--wa-accent)] bg-transparent text-[var(--wa-accent)] rounded-lg py-[0.4375rem] px-3.5 font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => handleChat(c)}
              disabled={starting === c.id}
            >
              <MessageCircle size={14} /> {starting === c.id ? "Opening..." : "Chat"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
