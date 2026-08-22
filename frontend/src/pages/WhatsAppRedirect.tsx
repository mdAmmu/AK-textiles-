import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { getToken } from "../services/api";
import { openWhatsAppDeepLinkByBroadcast } from "../services/chat";
import LoadingScreen from "../components/common/LoadingScreen";

/**
 * The actual URL a real WhatsApp product template's button points to:
 * /w/:broadcastId (Meta only allows one dynamic suffix variable in a URL
 * button, so the product is resolved backend-side from the broadcast).
 * Same login-bounce behavior as ProductLanding.
 */
export default function WhatsAppRedirect() {
  const { broadcastId } = useParams<{ broadcastId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const loggedIn = !!getToken();

  useEffect(() => {
    if (!loggedIn || !broadcastId || started.current) return;
    started.current = true;

    openWhatsAppDeepLinkByBroadcast(broadcastId)
      .then(() => navigate("/chat/support", { replace: true }))
      .catch((err: unknown) => {
        const detail =
          (err as { response?: { status?: number; data?: { detail?: string } } })?.response;
        if (detail?.status === 404) {
          setError("This product is no longer available.");
        } else {
          setError(detail?.data?.detail ?? "Something went wrong opening this product.");
        }
      });
  }, [loggedIn, broadcastId, navigate]);

  if (!broadcastId) return <Navigate to="/login" replace />;

  if (!loggedIn) {
    return <Navigate to={`/login?next=${encodeURIComponent(`/w/${broadcastId}`)}`} replace />;
  }

  if (error) {
    return (
      <div className="loading-screen">
        <p>{error}</p>
      </div>
    );
  }

  return <LoadingScreen />;
}
