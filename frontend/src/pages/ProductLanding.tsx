import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getToken } from "../services/api";
import { openWhatsAppDeepLink } from "../services/chat";
import LoadingScreen from "../components/common/LoadingScreen";

/**
 * The page a customer lands on after tapping a WhatsApp template's
 * "View Product Detail" button. Not logged in -> bounce to login and come
 * straight back here afterwards. Logged in -> record the campaign click,
 * inject the product into their conversation with admin (once), then drop
 * them into that chat so they can reply immediately.
 */
export default function ProductLanding() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const broadcastId = searchParams.get("b");
  const loggedIn = !!getToken();

  useEffect(() => {
    if (!loggedIn || !productId || started.current) return;
    started.current = true;

    openWhatsAppDeepLink(productId, broadcastId)
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
  }, [loggedIn, productId, broadcastId, navigate]);

  if (!productId) return <Navigate to="/login" replace />;

  if (!loggedIn) {
    const next = `/p/${productId}${broadcastId ? `?b=${broadcastId}` : ""}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
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
