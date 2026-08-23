import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import {
  fetchCarouselStatus,
  sendWhatsAppMessage,
  uploadWhatsAppImage,
} from "../services/whatsapp";
import type { WhatsAppMessageType } from "../services/whatsapp";
import "./WhatsAppSend.css";

const CAROUSEL_CARD_COUNT = 3;

export default function WhatsAppSend() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [messageType, setMessageType] = useState<WhatsAppMessageType>("text");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [carouselUrls, setCarouselUrls] = useState<(string | null)[]>(
    Array(CAROUSEL_CARD_COUNT).fill(null),
  );
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [carouselStatus, setCarouselStatus] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const carouselSlotRef = useRef<number | null>(null);
  const carouselInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messageType !== "carousel") return;
    fetchCarouselStatus()
      .then((s) => setCarouselStatus(s.exists ? s.status : "NOT_CREATED"))
      .catch(() => setCarouselStatus(null));
  }, [messageType]);

  function extractErrorDetail(err: unknown): string | undefined {
    const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((d) => (d && typeof d === "object" && "msg" in d ? String((d as { msg: unknown }).msg) : null))
        .filter(Boolean);
      if (messages.length > 0) return messages.join(", ");
    }
    return undefined;
  }

  async function handleSingleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setStatus("");
    try {
      const url = await uploadWhatsAppImage(file);
      setImageUrl(url);
    } catch {
      setStatus("Could not upload the image.");
    } finally {
      setUploading(false);
    }
  }

  function pickCarouselSlot(index: number) {
    carouselSlotRef.current = index;
    carouselInputRef.current?.click();
  }

  async function handleCarouselImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const slot = carouselSlotRef.current;
    e.target.value = "";
    if (!file || slot === null) return;
    setUploading(true);
    setStatus("");
    try {
      const url = await uploadWhatsAppImage(file);
      setCarouselUrls((prev) => {
        const next = [...prev];
        next[slot] = url;
        return next;
      });
    } catch {
      setStatus("Could not upload the image.");
    } finally {
      setUploading(false);
    }
  }

  function removeCarouselImage(index: number) {
    setCarouselUrls((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }

  async function sendMessage() {
    if (!phoneNumber) {
      setStatus("Please enter a phone number.");
      return;
    }
    if (messageType === "text" && !message) {
      setStatus("Please enter a message.");
      return;
    }
    if (messageType === "image" && !imageUrl) {
      setStatus("Please upload an image.");
      return;
    }
    if (messageType === "carousel") {
      if (!message) {
        setStatus("Please enter a description.");
        return;
      }
      if (carouselUrls.some((u) => !u)) {
        setStatus(`Please upload all ${CAROUSEL_CARD_COUNT} images.`);
        return;
      }
    }

    try {
      setLoading(true);
      setStatus("");
      await sendWhatsAppMessage({
        phone_number: phoneNumber,
        message_type: messageType,
        message,
        image_url: messageType === "image" ? imageUrl : undefined,
        image_urls: messageType === "carousel" ? (carouselUrls as string[]) : undefined,
        preview_url: true,
      });
      setStatus("Message sent successfully!");
      setMessage("");
      setImageUrl("");
      setCarouselUrls(Array(CAROUSEL_CARD_COUNT).fill(null));
    } catch (err: unknown) {
      setStatus(extractErrorDetail(err) ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="whatsapp-send-page">
      <header className="whatsapp-send-page__header">
        <button onClick={() => navigate("/admin")}>
          <ArrowLeft size={20} />
        </button>
        <h1>Send WhatsApp Message</h1>
      </header>

      <div className="whatsapp-send-page__content">
        <label className="whatsapp-send-page__label">WhatsApp Number</label>
        <input
          className="whatsapp-send-page__input"
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="919876543210"
        />

        <label className="whatsapp-send-page__label">Message Type</label>
        <div className="whatsapp-send-page__type-toggle">
          <button
            type="button"
            className={messageType === "text" ? "active" : ""}
            onClick={() => setMessageType("text")}
          >
            Text
          </button>
          <button
            type="button"
            className={messageType === "image" ? "active" : ""}
            onClick={() => setMessageType("image")}
          >
            Image
          </button>
          <button
            type="button"
            className={messageType === "carousel" ? "active" : ""}
            onClick={() => setMessageType("carousel")}
          >
            Carousel
          </button>
        </div>

        {messageType === "image" && (
          <>
            <label className="whatsapp-send-page__label">Image</label>
            {imageUrl ? (
              <div className="whatsapp-send-page__image-slot">
                <img src={imageUrl} alt="Selected" />
                <button type="button" onClick={() => setImageUrl("")} aria-label="Remove image">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="whatsapp-send-page__image-pick"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading}
              >
                <ImagePlus size={20} />
                {uploading ? "Uploading..." : "Upload / Select Image"}
              </button>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleSingleImagePick}
            />
          </>
        )}

        {messageType === "carousel" && (
          <>
            <label className="whatsapp-send-page__label">
              Images ({carouselUrls.filter(Boolean).length}/{CAROUSEL_CARD_COUNT})
            </label>
            <div className="whatsapp-send-page__carousel-grid">
              {carouselUrls.map((url, i) =>
                url ? (
                  <div key={i} className="whatsapp-send-page__image-slot">
                    <img src={url} alt={`Card ${i + 1}`} />
                    <button
                      type="button"
                      onClick={() => removeCarouselImage(i)}
                      aria-label={`Remove image ${i + 1}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    key={i}
                    type="button"
                    className="whatsapp-send-page__carousel-slot"
                    onClick={() => pickCarouselSlot(i)}
                    disabled={uploading}
                  >
                    <ImagePlus size={18} />
                    <span>Card {i + 1}</span>
                  </button>
                ),
              )}
            </div>
            <input
              ref={carouselInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleCarouselImagePick}
            />

            {carouselStatus && carouselStatus !== "APPROVED" && (
              <p className="whatsapp-send-page__notice">
                {carouselStatus === "NOT_CREATED" &&
                  "The carousel template hasn't been created yet. Sending now will submit it to Meta for one-time approval — delivery only starts working once Meta approves it."}
                {carouselStatus === "PENDING" &&
                  "The carousel template is still pending Meta's approval. Sending won't deliver until it's approved."}
                {carouselStatus === "REJECTED" &&
                  "Meta rejected the carousel template. Contact your developer to review its content."}
              </p>
            )}
          </>
        )}

        <label className="whatsapp-send-page__label">
          {messageType === "image" ? "Caption" : messageType === "carousel" ? "Description" : "Message"}
        </label>
        <textarea
          className="whatsapp-send-page__input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message..."
          rows={5}
        />

        <button className="whatsapp-send-page__submit" onClick={sendMessage} disabled={loading}>
          {loading ? "Sending..." : "Send WhatsApp"}
        </button>

        {status && <p className="whatsapp-send-page__status">{status}</p>}
      </div>
    </div>
  );
}
