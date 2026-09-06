interface Props {
  onClose: () => void;
  onInfo?: () => void;
  onCopy?: () => void;
}

const ITEM =
  "block w-full text-left py-2.5 px-4 border-none bg-transparent font-[inherit] text-[15px] text-[#1a1a1a] dark:text-[#e9edef] cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/5";

export default function SelectionMenu({ onClose, onInfo, onCopy }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute top-[52px] right-3 z-30 bg-white dark:bg-[#1e2530] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.18)] py-1 min-w-[150px] overflow-hidden">
        {onInfo && (
          <button
            type="button"
            className={ITEM}
            onClick={() => {
              onInfo();
              onClose();
            }}
          >
            Info
          </button>
        )}
        {onCopy && (
          <button
            type="button"
            className={ITEM}
            onClick={() => {
              onCopy();
              onClose();
            }}
          >
            Copy
          </button>
        )}
      </div>
    </>
  );
}
