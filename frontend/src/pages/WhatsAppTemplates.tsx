import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { createTemplate, fetchTemplates } from "../services/whatsappTemplates";
import type { WhatsAppTemplate } from "../services/whatsappTemplates";
import LoadingScreen from "../components/common/LoadingScreen";
import "./WhatsAppBroadcasts.css";

export default function WhatsAppTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<WhatsAppTemplate[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [buttonText, setButtonText] = useState("View Product Detail");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);

  function load() {
    fetchTemplates()
      .then((t) => {
        setTemplates(t);
        setLoadError(null);
      })
      .catch(() => setLoadError("Could not load templates from Meta."));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting || !file) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createTemplate({
        name: name.trim(),
        category,
        languageCode: "en_US",
        buttonText,
        file,
      });
      setSubmitted(
        `Submitted for review (status: ${result.status ?? "PENDING"}). Meta usually takes a few minutes to a day to approve marketing templates.`,
      );
      setShowCreate(false);
      setName("");
      setFile(null);
      load();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSubmitError(detail ?? "Could not create the template. Check the name and image.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wa-broadcasts-page">
      <header className="broadcast-confirm-page__header">
        <button onClick={() => navigate("/admin/whatsapp")}>
          <ArrowLeft size={20} />
        </button>
        <h1>Templates</h1>
      </header>

      <main className="wa-broadcasts-page__content">
        {!showCreate && (
          <button
            className="wa-broadcasts-page__create"
            style={{ marginBottom: "0.875rem", border: "none", cursor: "pointer" }}
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} /> New Template
          </button>
        )}

        {submitted && <p className="broadcast-confirm-page__hint">{submitted}</p>}

        {showCreate && (
          <form
            className="wa-broadcast-detail__summary"
            onSubmit={handleSubmit}
            style={{ marginBottom: "1rem" }}
          >
            <label>
              Template name (lowercase, underscores only)
              <input
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                placeholder="product_announcement"
                required
              />
            </label>
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utility</option>
              </select>
            </label>
            <p className="broadcast-confirm-page__hint">
              Every template uses this fixed layout: product image, name,
              quantity in bundle, rate, and a button. Only the name, category
              and sample image are customizable here.
            </p>
            <label>
              Button text
              <input
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                required
              />
            </label>
            <label>
              Sample header image (used for Meta's review only — the real
              send uses each product's own image)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </label>

            {submitError && (
              <p className="wa-broadcasts-page__failed">{submitError}</p>
            )}

            <div className="broadcast-confirm-page__actions">
              <button
                type="button"
                className="broadcast-confirm-page__everyone"
                onClick={() => setShowCreate(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="broadcast-confirm-page__send"
                disabled={submitting || !file}
              >
                {submitting ? "Submitting..." : "Submit for Approval"}
              </button>
            </div>
          </form>
        )}

        {loadError && <p className="wa-broadcasts-page__failed">{loadError}</p>}

        {templates === null ? (
          <LoadingScreen />
        ) : templates.length === 0 ? (
          <p className="wa-broadcasts-page__empty">
            No templates yet. Create one above to send real product campaigns.
          </p>
        ) : (
          <div className="wa-broadcasts-page__list">
            {templates.map((t) => (
              <div key={t.id ?? t.name} className="wa-broadcasts-page__row">
                <div className="wa-broadcasts-page__row-main">
                  <span className="wa-broadcasts-page__row-title">{t.name}</span>
                  <span
                    className={`wa-broadcasts-page__status wa-broadcasts-page__status--${t.status.toLowerCase()}`}
                  >
                    {t.status}
                  </span>
                </div>
                <div className="wa-broadcasts-page__row-stats">
                  <span>{t.category ?? "—"}</span>
                  <span>{t.language ?? "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
