// Shared Tailwind class strings for the chat page shell (header + page
// container), used by UserChat, AdminChat, and GroupChat — these three
// pages render the same WhatsApp-style chat layout.

export const CHAT_PAGE = "flex flex-col h-screen bg-[var(--chat-bg)]";

export const CHAT_HEADER_BASE =
  "fixed top-0 left-0 right-0 flex items-center gap-2 py-4 px-4 bg-[var(--chat-header-bg)] text-[var(--chat-text)] border-b border-[var(--chat-border)] shrink-0 z-10";

export const CHAT_HEADER_ICON_BTN =
  "flex border-none bg-transparent text-[var(--chat-accent)] cursor-pointer p-1 leading-none last:ml-3";

export const CHAT_HEADER_IDENTITY =
  "flex-1 min-w-0 flex items-center gap-2.5 border-none bg-transparent text-[var(--chat-text)] cursor-pointer py-1 text-left";

export const CHAT_HEADER_INFO = "flex-1 min-w-0";

export const CHAT_HEADER_TITLE =
  "font-semibold text-[17px] whitespace-nowrap overflow-hidden text-ellipsis pl-2.5";

export const CHAT_HEADER_SUBTITLE = "text-xs text-[var(--chat-accent)] font-semibold pl-2.5";

export const CHAT_HEADER_SELECTION_COUNT = "text-[17px] font-semibold text-[var(--chat-text)]";

export const CHAT_HEADER_SELECTION_SPACER = "flex-1";

export const CHAT_BODY = "flex-1 min-h-0 flex flex-col pt-[3.75rem]";

export const CHAT_ENCRYPTION_NOTE =
  "max-w-[90%] mx-auto my-2 py-2.5 px-3.5 bg-[var(--chat-bubble-other)] text-[var(--chat-text-secondary)] text-[13px] text-center rounded-lg";
