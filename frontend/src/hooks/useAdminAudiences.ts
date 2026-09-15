import { useEffect, useState } from "react";
import { fetchAudiences } from "../services/broadcastMessages";
import type { BroadcastAudience } from "../types/broadcastMessage";

// Kept outside the hook so it survives unmount/remount — switching between
// the Chats/Groups/Broadcast tabs and back shows the last-known list
// immediately instead of a loading flash, while a fresh fetch runs quietly
// underneath.
let cachedAudiences: BroadcastAudience[] | null = null;

/**
 * Shared broadcast-audience list state, used both by the broadcast home
 * screen and — on desktop, where the list stays visible next to an open
 * thread — the broadcast thread screen itself.
 */
export function useAdminAudiences() {
  const [audiences, setAudiencesState] = useState<BroadcastAudience[] | null>(cachedAudiences);

  function setAudiences(
    update: BroadcastAudience[] | null | ((prev: BroadcastAudience[] | null) => BroadcastAudience[] | null),
  ) {
    setAudiencesState((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      cachedAudiences = next;
      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;
    fetchAudiences().then((data) => {
      if (!cancelled) setAudiences(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { audiences, setAudiences };
}
