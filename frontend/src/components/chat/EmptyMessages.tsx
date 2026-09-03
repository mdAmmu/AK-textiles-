const DOT = "w-1.5 h-1.5 rounded-full";

interface Props {
  onSendClick?: () => void;
}

export default function EmptyMessages({ onSendClick }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center flex-1 py-8 px-7 m-5 bg-white rounded-[20px] shadow-[0_4px_20px_rgba(15,157,110,0.06)] dark:bg-[var(--chat-panel-bg)] dark:shadow-none">
      <div className="relative w-40 h-[110px] mb-6">
        <div className="absolute flex items-center justify-center gap-1 rounded-2xl top-0 right-1.5 w-[76px] h-[34px] bg-[#e3e1ee] rounded-br-[4px] dark:bg-[#2a2f45]">
          <span className={`${DOT} bg-[#a9a5c4] dark:bg-[#6c7fe0]`} />
          <span className={`${DOT} bg-[#a9a5c4] dark:bg-[#6c7fe0]`} />
          <span className={`${DOT} bg-[#a9a5c4] dark:bg-[#6c7fe0]`} />
        </div>
        <div className="absolute flex items-center justify-center gap-1 rounded-2xl top-[34px] left-0 w-[62px] h-[30px] bg-[#dfe6fb] rounded-bl-[4px] dark:bg-[#1c2e4a]">
          <span className={`${DOT} bg-[#6c7fe0]`} />
          <span className={`${DOT} bg-[#6c7fe0]`} />
          <span className={`${DOT} bg-[#6c7fe0]`} />
        </div>
        <div className="absolute flex items-center justify-center gap-1 rounded-2xl bottom-0 right-3 w-24 h-[38px] bg-[#0f9d6e] rounded-br-[4px]">
          <span className={`${DOT} bg-white/85`} />
          <span className={`${DOT} bg-white/85`} />
          <span className={`${DOT} bg-white/85`} />
        </div>
      </div>
      <h2 className="text-lg font-bold text-[#1a1a1a] m-0 dark:text-[var(--chat-text)]">
        No messages yet
      </h2>
      <p className="mt-2 mb-6 text-[#8b8f8c] text-sm max-w-[22rem] dark:text-[var(--chat-text-secondary)]">
        Start a conversation and it will appear here.
      </p>
      {onSendClick && (
        <button
          className="border-none bg-[#0f9d6e] text-white font-semibold text-[15px] py-3 px-7 rounded-full cursor-pointer dark:bg-[var(--chat-accent)]"
          onClick={onSendClick}
          type="button"
        >
          Send a message
        </button>
      )}
    </div>
  );
}
