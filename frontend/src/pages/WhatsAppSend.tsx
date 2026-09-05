import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import {
  CAROUSEL_CARD_COUNTS,
  fetchCarouselStatus,
  sendWhatsAppMessage,
  uploadWhatsAppImage,
} from "../services/whatsapp";
import type { CarouselCardCount, CarouselStatusByCount, WhatsAppMessageType } from "../services/whatsapp";

const LABEL = "font-semibold text-sm text-[var(--wa-text-secondary)]";
const INPUT = "py-2.5 px-3 border border-[#dcdfe3] rounded-lg font-[inherit] mb-2";
const TOGGLE_ROW = "flex gap-2 mb-2";
const TOGGLE_BTN_BASE =
  "flex-1 py-2 border border-[#dcdfe3] rounded-lg bg-white font-semibold text-sm cursor-pointer";
const TOGGLE_BTN_ACTIVE = "bg-[var(--wa-accent)] border-[var(--wa-accent)] text-white";
const IMAGE_SLOT = "relative";
const IMAGE_SLOT_IMG = "w-full aspect-square max-h-[200px] object-cover rounded-lg block";
const IMAGE_SLOT_REMOVE =
  "absolute top-1.5 right-1.5 w-[22px] h-[22px] rounded-full border-none bg-black/55 text-white flex items-center justify-center cursor-pointer";

export default function WhatsAppSend() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [messageType, setMessageType] = useState<WhatsAppMessageType>("text");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [cardCount, setCardCount] = useState<CarouselCardCount>(3);
  const [carouselUrls, setCarouselUrls] = useState<(string | null)[]>(Array(3).fill(null));
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [carouselStatusByCount, setCarouselStatusByCount] = useState<CarouselStatusByCount | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const carouselSlotRef = useRef<number | null>(null);
  const carouselInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messageType !== "carousel") return;
    fetchCarouselStatus()
      .then(setCarouselStatusByCount)
      .catch(() => setCarouselStatusByCount(null));
  }, [messageType]);

  function changeCardCount(count: CarouselCardCount) {
    setCardCount(count);
    setCarouselUrls(Array(count).fill(null));
  }

  const carouselStatus = carouselStatusByCount?.[String(cardCount)]?.status ?? null;

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
        setStatus(`Please upload all ${cardCount} images.`);
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
      setCarouselUrls(Array(cardCount).fill(null));
    } catch (err: unknown) {
      setStatus(extractErrorDetail(err) ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[var(--wa-panel-bg)]">
      <header className="flex items-center gap-3 py-[1.125rem] px-4 bg-[var(--wa-header)]">
        <button
          className="flex border-none bg-transparent text-white cursor-pointer"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="m-0 text-xl text-white">Send WhatsApp Message</h1>
      </header>

      <div className="bg-white m-3.5 p-4 rounded-xl flex flex-col gap-2">
        <label className={LABEL}>WhatsApp Number</label>
        <input
          className={INPUT}
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="919876543210"
        />

        <label className={LABEL}>Message Type</label>
        <div className={TOGGLE_ROW}>
          <button
            type="button"
            className={`${TOGGLE_BTN_BASE} ${messageType === "text" ? TOGGLE_BTN_ACTIVE : ""}`}
            onClick={() => setMessageType("text")}
          >
            Text
          </button>
          <button
            type="button"
            className={`${TOGGLE_BTN_BASE} ${messageType === "image" ? TOGGLE_BTN_ACTIVE : ""}`}
            onClick={() => setMessageType("image")}
          >
            Image
          </button>
          <button
            type="button"
            className={`${TOGGLE_BTN_BASE} ${messageType === "carousel" ? TOGGLE_BTN_ACTIVE : ""}`}
            onClick={() => setMessageType("carousel")}
          >
            Carousel
          </button>
        </div>

        {messageType === "image" && (
          <>
            <label className={LABEL}>Image</label>
            {imageUrl ? (
              <div className={IMAGE_SLOT}>
                <img className={IMAGE_SLOT_IMG} src={imageUrl} alt="Selected" />
                <button
                  className={IMAGE_SLOT_REMOVE}
                  type="button"
                  onClick={() => setImageUrl("")}
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="flex items-center justify-center gap-2 p-5 border border-dashed border-[#dcdfe3] rounded-lg bg-[var(--wa-panel-bg)] text-[var(--wa-text-secondary)] text-sm cursor-pointer mb-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
            <label className={LABEL}>Number of Photos</label>
            <div className={TOGGLE_ROW}>
              {CAROUSEL_CARD_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`${TOGGLE_BTN_BASE} ${cardCount === count ? TOGGLE_BTN_ACTIVE : ""}`}
                  onClick={() => changeCardCount(count)}
                >
                  {count}
                </button>
              ))}
            </div>

            <label className={LABEL}>
              Images ({carouselUrls.filter(Boolean).length}/{cardCount})
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {carouselUrls.map((url, i) =>
                url ? (
                  <div key={i} className={IMAGE_SLOT}>
                    <img className={IMAGE_SLOT_IMG} src={url} alt={`Card ${i + 1}`} />
                    <button
                      className={IMAGE_SLOT_REMOVE}
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
                    className="aspect-square flex flex-col items-center justify-center gap-1 border border-dashed border-[#dcdfe3] rounded-lg bg-[var(--wa-panel-bg)] text-[var(--wa-text-secondary)] text-[0.72rem] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
              <p className="m-0 mb-2 py-2.5 px-3 rounded-lg bg-[#fff4e5] text-[#96551c] text-[13px] leading-[1.4]">
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

        <label className={LABEL}>
          {messageType === "image" ? "Caption" : messageType === "carousel" ? "Description" : "Message"}
        </label>
        <textarea
          className={INPUT}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message..."
          rows={5}
        />

        <button
          className="py-3 bg-[var(--wa-accent)] text-white border-none rounded-lg font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={sendMessage}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send WhatsApp"}
        </button>

        {status && <p className="m-0 text-sm">{status}</p>}
      </div>
    </div>
  );
}
