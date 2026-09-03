import { useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";

const DISMISSED_KEY = "ak_install_dismissed";

export default function InstallAppBanner() {
  const { canInstall, isIOS, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === "1");
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  if (dismissed || (!canInstall && !isIOS)) return null;

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  return (
    <>
      <div className="sticky top-0 z-50 flex items-center gap-2.5 py-2.5 px-3.5 bg-[#863bff] text-white">
        <span className="shrink-0 flex">
          <Download size={18} />
        </span>
        <div className="flex-1 text-[13px] leading-[1.3]">
          <strong className="block text-sm">Install AK Textiles</strong>
          Add it to your home screen for quick access.
        </div>
        <button
          type="button"
          className="shrink-0 border-none rounded-lg bg-white text-[#863bff] text-[13px] font-semibold py-[7px] px-3.5 cursor-pointer"
          onClick={canInstall ? promptInstall : () => setShowIOSSteps(true)}
        >
          Install
        </button>
        <button
          type="button"
          className="shrink-0 border-none bg-transparent text-white opacity-85 cursor-pointer flex items-center justify-center p-1"
          aria-label="Dismiss"
          onClick={dismiss}
        >
          <X size={16} />
        </button>
      </div>

      {showIOSSteps && (
        <div
          className="fixed inset-0 z-[100] bg-black/45 flex items-end justify-center"
          onClick={() => setShowIOSSteps(false)}
        >
          <div
            className="w-full max-w-[480px] bg-white text-[#1a1a1a] rounded-t-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 mb-3 text-base">Add to Home Screen</h3>
            <ol className="m-0 mb-4 pl-5 text-sm leading-[1.7]">
              <li>
                Tap the Share icon <Share size={14} style={{ verticalAlign: "-2px" }} /> in Safari's toolbar.
              </li>
              <li>Scroll down and tap "Add to Home Screen".</li>
              <li>Tap "Add" in the top right corner.</li>
            </ol>
            <button
              type="button"
              className="w-full border-none rounded-[10px] bg-[#863bff] text-white font-semibold py-2.5 cursor-pointer"
              onClick={() => setShowIOSSteps(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
