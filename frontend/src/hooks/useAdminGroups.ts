import { useEffect, useState } from "react";
import { fetchGroups } from "../services/groups";
import type { Group } from "../types/group";

// Kept outside the hook so it survives unmount/remount — switching between
// the Chats/Groups/Broadcast tabs and back shows the last-known list
// immediately instead of a loading flash, while a fresh fetch runs quietly
// underneath.
let cachedGroups: Group[] | null = null;

/**
 * Shared group-list state, used both by the groups home screen and — on
 * desktop, where the list stays visible next to an open group thread — the
 * group chat screen itself.
 */
export function useAdminGroups() {
  const [groups, setGroupsState] = useState<Group[] | null>(cachedGroups);

  function setGroups(update: Group[] | null | ((prev: Group[] | null) => Group[] | null)) {
    setGroupsState((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      cachedGroups = next;
      return next;
    });
  }

  useEffect(() => {
    fetchGroups().then(setGroups);
  }, []);

  return { groups, setGroups };
}
