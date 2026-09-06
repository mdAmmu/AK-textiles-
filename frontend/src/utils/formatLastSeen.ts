import { formatRelativeTime } from "./formatRelativeTime";

export function formatLastSeen(iso: string | null | undefined): string {
  if (!iso) return "Offline";
  return `Last seen ${formatRelativeTime(iso).replace(/^Just now$/, "just now")}`;
}
