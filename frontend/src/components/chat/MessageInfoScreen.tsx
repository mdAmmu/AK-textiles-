import type { ReactNode } from "react";
import { ArrowLeft, Check, CheckCheck } from "lucide-react";
import Avatar from "../common/Avatar";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

export interface MessageReaderRow {
  id: string;
  name: string;
  readAt: string;
}

export interface MessageNotReaderRow {
  id: string;
  name: string;
}

interface Props {
  onBack: () => void;
  bubble: ReactNode;
  readBy: MessageReaderRow[];
  notReadBy: MessageNotReaderRow[];
}

export default function MessageInfoScreen({ onBack, bubble, readBy, notReadBy }: Props) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-[#eef2f0] dark:bg-[#10161f]">
      <header className="flex items-center gap-3 py-3.5 px-4 bg-white dark:bg-[#1e2530] border-b border-[#eef1ee] dark:border-[#232d3a] shrink-0">
        <button
          className="flex border-none bg-transparent text-[#1a1a1a] dark:text-[#e9edef] cursor-pointer p-1"
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-semibold text-[17px] text-[#1a1a1a] dark:text-[#e9edef]">Message info</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="flex justify-end py-4 px-4 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px)]">
          <div className="max-w-[85%]">{bubble}</div>
        </div>

        <div className="mt-2">
          <div className="flex items-center gap-2 py-2.5 px-4">
            <span className="text-[#22c55e] font-semibold text-sm flex-1">Read by</span>
            <CheckCheck size={16} className="text-[var(--chat-tick-read,#34b7f1)]" />
          </div>

          {readBy.length === 0 ? (
            <p className="px-4 pb-2 text-[#7c827e] dark:text-[#8b96a5] text-sm">No one yet.</p>
          ) : (
            readBy.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 py-3 px-4 border-t border-[#eef1ee] dark:border-[#232d3a]"
              >
                <Avatar name={r.name} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#1a1a1a] dark:text-[#e9edef] truncate">{r.name}</div>
                  <div className="text-[#7c827e] dark:text-[#8b96a5] text-[13px]">
                    {formatRelativeTime(r.readAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notReadBy.length > 0 && (
          <div className="mt-4 border-t-8 border-[#eef2f0] dark:border-[#10161f]">
            <div className="flex items-center gap-2 py-2.5 px-4">
              <span className="text-[#8b8f8c] dark:text-[#8b96a5] font-semibold text-sm flex-1">
                Not read by
              </span>
              <Check size={16} className="text-[#8b8f8c] dark:text-[#8b96a5]" />
            </div>

            {notReadBy.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 py-3 px-4 border-t border-[#eef1ee] dark:border-[#232d3a]"
              >
                <Avatar name={r.name} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#1a1a1a] dark:text-[#e9edef] truncate">{r.name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
