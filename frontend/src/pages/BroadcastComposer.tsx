import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { fetchGroups } from "../services/groups";
import { createAudience } from "../services/broadcastMessages";
import type { Group } from "../types/group";
import type { User } from "../types/user";
import BroadcastRecipientPicker, { Chip } from "../components/admin/BroadcastRecipientPicker";

export default function BroadcastComposer() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Map<string, User>>(new Map());

  const [name, setName] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups().then(setGroups);
  }, []);

  const selectedGroupCount = useMemo(
    () => groups.filter((g) => selectedGroupIds.has(g.id)).reduce((sum, g) => sum + g.customer_count, 0),
    [groups, selectedGroupIds],
  );

  const estimatedRecipients = selectedGroupCount + selectedUsers.size;
  const hasAudience = selectedGroupIds.size > 0 || selectedUsers.size > 0;

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (submitting) return;
    if (!name.trim()) {
      setError("Give this broadcast a name.");
      return;
    }
    if (!hasAudience) {
      setError("Add at least one recipient.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const audience = await createAudience(
        name.trim(),
        Array.from(selectedUsers.keys()),
        Array.from(selectedGroupIds),
      );
      navigate(`/admin/broadcast/${audience.id}`, { replace: true });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? "We couldn't create this broadcast. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex flex-col h-dvh bg-[linear-gradient(180deg,#eaf0ff_0%,#f5f8ff_40%,#ffffff_75%)] dark:bg-[#10161f]">
      <header className="flex items-center gap-3 pt-[1.125rem] px-4 pb-2 shrink-0">
        <button
          className="flex border-none bg-transparent text-[#1a1a1a] dark:text-[#e9edef] cursor-pointer p-1.5"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-[#1a1a1a] dark:text-[#e9edef] m-0">New Broadcast</h1>
      </header>

      <form onSubmit={submit} className="flex-1 overflow-y-auto px-4 pb-28 flex flex-col gap-4">
        <div>
          <label className="block text-[13px] font-semibold mb-1.5 text-[#7c827e] dark:text-[#8b96a5]">
            Broadcast name
          </label>
          <input
            className="w-full box-border py-2.5 px-3.5 rounded-xl border border-[#eef1ee] dark:border-[#232d3a] bg-white dark:bg-[#1e2530] text-[#1a1a1a] dark:text-[#e9edef] font-[inherit] outline-none"
            placeholder="e.g. VIP Customers"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-[13px] font-semibold mb-1.5 text-[#7c827e] dark:text-[#8b96a5]">
            Recipients
          </label>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="w-full flex items-center justify-between gap-2 py-3 px-3.5 rounded-xl border border-[#eef1ee] dark:border-[#232d3a] bg-white dark:bg-[#1e2530] cursor-pointer text-left"
          >
            <span className="flex items-center gap-2 text-[#1a1a1a] dark:text-[#e9edef] font-medium">
              <Users size={18} />
              {hasAudience ? `${estimatedRecipients} recipients added` : "Add recipients"}
            </span>
            <span className="text-[#2563eb] font-semibold text-sm">Edit</span>
          </button>

          {hasAudience && (
            <div className="flex flex-wrap gap-2 mt-2.5">
              {groups
                .filter((g) => selectedGroupIds.has(g.id))
                .map((g) => (
                  <Chip
                    key={g.id}
                    label={g.name}
                    onRemove={() =>
                      setSelectedGroupIds((prev) => {
                        const next = new Set(prev);
                        next.delete(g.id);
                        return next;
                      })
                    }
                  />
                ))}
              {Array.from(selectedUsers.values()).map((u) => (
                <Chip
                  key={u.id}
                  label={u.name}
                  onRemove={() =>
                    setSelectedUsers((prev) => {
                      const next = new Map(prev);
                      next.delete(u.id);
                      return next;
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-[#8b8f8c] dark:text-[#6b7480] text-xs m-0">
          This creates a private broadcast group. Every message you send to it goes out as a normal
          private message to each recipient individually — they'll never see each other, and their
          replies land only in your regular chat with them.
        </p>

        {error && <p className="text-[#e5484d] text-sm m-0">{error}</p>}
      </form>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#1e2530] border-t border-[#eef1ee] dark:border-[#232d3a]">
        <button
          type="button"
          onClick={() => submit()}
          disabled={submitting}
          className="w-full py-3 rounded-xl border-none bg-[#2563eb] text-white font-semibold cursor-pointer disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create Broadcast"}
        </button>
      </div>

      {showPicker && (
        <BroadcastRecipientPicker
          groups={groups}
          selectedGroupIds={selectedGroupIds}
          selectedUsers={selectedUsers}
          onToggleGroup={(id) =>
            setSelectedGroupIds((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            })
          }
          onToggleUser={(user) =>
            setSelectedUsers((prev) => {
              const next = new Map(prev);
              if (next.has(user.id)) next.delete(user.id);
              else next.set(user.id, user);
              return next;
            })
          }
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
