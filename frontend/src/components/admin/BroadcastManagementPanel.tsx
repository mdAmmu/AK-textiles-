import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Radio, Trash2 } from "lucide-react";
import type { BroadcastAudience } from "../../types/broadcastMessage";
import { deleteAudience, fetchAudiences } from "../../services/broadcastMessages";

const ADD_BTN =
  "flex items-center justify-center gap-2 w-full py-3 border-none rounded-lg bg-[var(--wa-accent)] text-white font-semibold text-[15px] cursor-pointer";
const CANCEL_BTN =
  "flex-1 py-3 border border-[var(--wa-border)] rounded-lg bg-transparent text-[var(--wa-text)] font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

interface Props {
  onClose: () => void;
  onAudienceDeleted: (audienceId: string) => void;
}

export default function BroadcastManagementPanel({ onClose, onAudienceDeleted }: Props) {
  const navigate = useNavigate();
  const [audiences, setAudiences] = useState<BroadcastAudience[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BroadcastAudience | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAudiences().then(setAudiences);
  }, []);

  async function handleConfirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteAudience(pendingDelete.id);
      setAudiences((prev) => prev?.filter((a) => a.id !== pendingDelete.id) ?? prev);
      onAudienceDeleted(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-[#131a24] flex flex-col z-10">
      <div className="flex items-center gap-3 py-3.5 px-4 shrink-0 border-b border-[var(--wa-border)]">
        <button
          className="flex border-none bg-transparent text-[var(--wa-text)] cursor-pointer p-1"
          onClick={onClose}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-semibold text-[17px]">Manage Broadcasts</span>
      </div>

      <div className="p-4 shrink-0">
        <button className={ADD_BTN} onClick={() => navigate("/admin/broadcast/new")}>
          <Plus size={18} /> Add Broadcast
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-0">
        {audiences === null ? (
          <p className="text-[var(--wa-text-secondary)] text-sm">Loading...</p>
        ) : audiences.length === 0 ? (
          <p className="text-[var(--wa-text-secondary)] text-sm">No broadcasts yet.</p>
        ) : (
          <div className="flex flex-col">
            {audiences.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 py-2.5 border-b border-[var(--wa-border)]"
              >
                <span className="w-10 h-10 rounded-xl bg-[#e3f7ec] flex items-center justify-center shrink-0">
                  <Radio size={18} color="#0f9d6e" />
                </span>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium truncate">{a.name}</span>
                  <span className="text-[var(--wa-text-secondary)] text-[13px] mt-0.5">
                    {a.member_count} recipient{a.member_count === 1 ? "" : "s"}
                  </span>
                </div>
                <button
                  className="flex border-none bg-transparent text-[#d92d20] cursor-pointer p-1.5 shrink-0"
                  onClick={() => setPendingDelete(a)}
                  aria-label={`Delete ${a.name}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center p-6 z-20">
          <div className="bg-white dark:bg-[#1e2530] rounded-xl p-5 max-w-[320px] w-full">
            <h2 className="mt-0 mb-2 text-[17px]">Delete "{pendingDelete.name}"?</h2>
            <p className="m-0 text-[var(--wa-text-secondary)] text-sm leading-[1.4]">
              This will permanently delete this broadcast and all its messages.
            </p>
            <div className="flex gap-2.5 mt-5">
              <button className={CANCEL_BTN} onClick={() => setPendingDelete(null)} disabled={deleting}>
                Cancel
              </button>
              <button
                className="flex-1 py-3 border-none rounded-lg bg-[#d92d20] text-white font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
