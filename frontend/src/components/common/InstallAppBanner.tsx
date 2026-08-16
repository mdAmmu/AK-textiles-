import { useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import "./InstallAppBanner.css";

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
      <div className="install-banner">
        <span className="install-banner__icon">
          <Download size={18} />
        </span>
        <div className="install-banner__text">
          <strong>Install AK Textiles</strong>
          Add it to your home screen for quick access.
        </div>
        <button
          type="button"
          className="install-banner__action"
          onClick={canInstall ? promptInstall : () => setShowIOSSteps(true)}
        >
          Install
        </button>
        <button
          type="button"
          className="install-banner__dismiss"
          aria-label="Dismiss"
          onClick={dismiss}
        >
          <X size={16} />
        </button>
      </div>

      {showIOSSteps && (
        <div className="install-banner__overlay" onClick={() => setShowIOSSteps(false)}>
          <div className="install-banner__modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add to Home Screen</h3>
            <ol>
              <li>
                Tap the Share icon <Share size={14} style={{ verticalAlign: "-2px" }} /> in Safari's toolbar.
              </li>
              <li>Scroll down and tap "Add to Home Screen".</li>
              <li>Tap "Add" in the top right corner.</li>
            </ol>
            <button
              type="button"
              className="install-banner__modal-close"
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
