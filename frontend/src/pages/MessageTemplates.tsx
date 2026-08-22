import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import {
  createMessageTemplate,
  deleteMessageTemplate,
  fetchMessageTemplates,
  updateMessageTemplate,
} from "../services/messageTemplates";
import type { MessageTemplate } from "../services/messageTemplates";
import LoadingScreen from "../components/common/LoadingScreen";
import "./WhatsAppBroadcasts.css";
import "./MessageTemplates.css";

function extractErrorMessage(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    // FastAPI validation errors: a list of {loc, msg, ...} objects.
    const messages = detail
      .map((d) => (d && typeof d === "object" && "msg" in d ? String((d as { msg: unknown }).msg) : null))
      .filter(Boolean);
    if (messages.length > 0) return messages.join(", ");
  }
  return "Could not save the template. Check the fields and try again.";
}

const EMPTY_FORM = {
  name: "",
  message: "",
  button_text: "View Product Detail",
};

export default function MessageTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<MessageTemplate[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetchMessageTemplates().then(setTemplates);
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(t: MessageTemplate) {
    setEditing(t);
    setForm({ name: t.name, message: t.message, button_text: "View Product Detail" });
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editing) {
        const updated = await updateMessageTemplate(editing.id, {
          name: form.name,
          message: form.message,
        });
        setTemplates((prev) => prev?.map((t) => (t.id === updated.id ? updated : t)) ?? prev);
      } else {
        const created = await createMessageTemplate(form);
        setTemplates((prev) => [created, ...(prev ?? [])]);
      }
      setShowForm(false);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteMessageTemplate(id);
    setTemplates((prev) => prev?.filter((t) => t.id !== id) ?? prev);
    setShowForm(false);
  }

  return (
    <div className="wa-broadcasts-page">
      <header className="broadcast-confirm-page__header">
        <button onClick={() => navigate("/admin")}>
          <ArrowLeft size={20} />
        </button>
        <h1>Message Templates</h1>
      </header>

      <main className="wa-broadcasts-page__content">
        {!showForm && (
          <button
            className="wa-broadcasts-page__create"
            style={{ marginBottom: "0.875rem", border: "none", cursor: "pointer" }}
            onClick={openCreate}
          >
            <Plus size={16} /> Create Template
          </button>
        )}

        {showForm && (
          <form
            className="wa-broadcast-detail__summary"
            onSubmit={handleSubmit}
            style={{ marginBottom: "1rem" }}
          >
            <label>
              Template Name (shown bold as the WhatsApp message title)
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Today's Product"
                required
              />
            </label>
            <label>
              Message
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="New 4 products available now"
                required
              />
            </label>
            {!editing && (
              <label>
                Button Text
                <input
                  value={form.button_text}
                  onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                  placeholder="View Product Detail"
                  required
                />
              </label>
            )}

            <div className="message-template-preview">
              <div className="message-template-preview__card">
                <div className="message-template-preview__title">{form.name || "Template Name"}</div>
                <div className="message-template-preview__body">
                  {form.message || "Message text"}
                </div>
                <div className="message-template-preview__button">
                  {form.button_text || "View Product Detail"}
                </div>
              </div>
              <p className="broadcast-confirm-page__hint">
                This is how it will look on the customer's real WhatsApp. The
                button opens the app. {editing && "Editing here only changes the in-app text — the WhatsApp template already submitted to Meta stays as it is."}
              </p>
            </div>

            {!editing && (
              <p className="broadcast-confirm-page__hint">
                Creating submits this as a new WhatsApp template for Meta's
                approval — usually takes a few minutes to a day before it can
                be sent.
              </p>
            )}

            {error && <p className="wa-broadcasts-page__failed">{error}</p>}

            <div className="broadcast-confirm-page__actions">
              <button
                type="button"
                className="broadcast-confirm-page__everyone"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              {editing && (
                <button
                  type="button"
                  className="broadcast-confirm-page__everyone"
                  onClick={() => handleDelete(editing.id)}
                  disabled={submitting}
                >
                  Delete
                </button>
              )}
              <button type="submit" className="broadcast-confirm-page__send" disabled={submitting}>
                {submitting ? "Saving..." : editing ? "Save" : "Create"}
              </button>
            </div>
          </form>
        )}

        {templates === null ? (
          <LoadingScreen />
        ) : templates.length === 0 ? (
          <p className="wa-broadcasts-page__empty">No templates yet. Create one above.</p>
        ) : (
          <div className="wa-broadcasts-page__list">
            {templates.map((t) => (
              <div key={t.id} className="wa-broadcasts-page__row" onClick={() => openEdit(t)}>
                <div className="wa-broadcasts-page__row-main">
                  <span className="wa-broadcasts-page__row-title">{t.name}</span>
                  <Pencil size={16} />
                </div>
                <p style={{ margin: "0 0 0.375rem", fontSize: "0.875rem" }}>{t.message}</p>
                <div className="wa-broadcasts-page__row-stats">
                  <span>{t.whatsapp_template_name}</span>
                  <span>{t.whatsapp_template_language}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
