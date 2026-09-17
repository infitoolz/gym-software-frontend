import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import {
  IconMessageHeart, IconSend, IconCrown, IconBarbell, IconX, IconArrowsDiagonal,
  IconCheck, IconChecks,
} from "@tabler/icons-react";
import { getMyThread, sendMyMessage } from "../api/chatApi";
import { useAuth } from "../context/AuthContext";
import { resolveUploadUrl } from "../utils/mediaUrl";

const POLL_MS = 10000;

// WhatsApp-style ticks: single (sent), grey double (delivered), blue double (read).
function MessageTicks({ status }) {
  if (!status) return null;
  if (status === "read") return <IconChecks size={15} style={{ color: "#2f7bff", filter: "drop-shadow(0 0 1px rgba(255,255,255,0.95))" }} />;
  if (status === "delivered") return <IconChecks size={15} style={{ color: "#ffffff" }} />;
  return <IconCheck size={14} style={{ color: "#ffffff" }} />;
}

// Floating bottom-right Wellness Chat. Renders on every logged-in page via
// ProtectedRoute. Members chat with their personal trainer; trainers use the
// full inbox at /wellness-chat instead, so the bubble is hidden for them.
export default function FloatingChatbot() {
  const { user } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  // Wellness chat is only for members (floating bubble) and trainers (full inbox
  // page). Staff/admins have no wellness chat, so the bubble is members-only.
  const isMember = role === "USER";

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setThread(await getMyThread());
    } catch {
      /* non-blocking floating widget */
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isMember) return undefined; // no wellness chat thread for staff/trainers/admins
    load();
    const t = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(t);
  }, [isMember]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread, open]);

  // Members-only: trainers use the full inbox page, staff/admins have no chat.
  if (!isMember) return null;
  // Redundant on the full Wellness Chat page itself.
  if (location.pathname.startsWith("/wellness-chat")) return null;

  const send = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setSending(true);
    setText("");
    try {
      await sendMyMessage(value);
      await load(true);
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const messages = (thread?.messages || []).slice(-30);
  const partnerName = thread?.partnerName;

  const renderBody = () => {
    if (loading) {
      return <div className="text-center text-muted py-5">Loading…</div>;
    }
    if (thread && !thread.enabled) {
      return (
        <div className="text-center py-5 px-3">
          <IconCrown size={32} color="#f4a23b" className="mb-2" />
          <p className="text-muted mb-3">{thread.notice || "Upgrade your plan to chat with a personal trainer."}</p>
          <Link to="/membership" className="btn btn-warning btn-sm" onClick={() => setOpen(false)}>Upgrade plan</Link>
        </div>
      );
    }
    if (thread && !partnerName) {
      return (
        <div className="text-center py-5 px-3">
          <IconBarbell size={32} className="mb-2" />
          <p className="text-muted mb-0">{thread.notice || "No personal trainer is assigned to you yet."}</p>
        </div>
      );
    }
    return (
      <div className="d-flex flex-column gap-2">
        {messages.length === 0 ? (
          <div className="text-center text-muted py-5">Say hello to your trainer 👋</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`d-flex ${m.mine ? "justify-content-end" : "justify-content-start"}`}>
              <div
                className={`px-3 py-2 rounded-3 ${m.mine ? "bg-primary text-white" : "bg-light text-dark chat-bubble-in"}`}
                style={{ maxWidth: "80%" }}
              >
                {m.attachmentUrl && (
                  m.attachmentType === "IMAGE" ? (
                    <a href={resolveUploadUrl(m.attachmentUrl)} target="_blank" rel="noopener noreferrer" className="d-block mb-1">
                      <img src={resolveUploadUrl(m.attachmentUrl)} alt={m.attachmentName || "image"}
                        style={{ maxWidth: 160, maxHeight: 160, borderRadius: 6, display: "block", objectFit: "cover" }} />
                    </a>
                  ) : (
                    <a href={resolveUploadUrl(m.attachmentUrl)} target="_blank" rel="noopener noreferrer" download={m.attachmentName}
                      className={`d-block mb-1 text-decoration-underline ${m.mine ? "text-white" : "text-dark"}`}>
                      📎 {m.attachmentName || "Document"}
                    </a>
                  )
                )}
                {m.content && <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.content}</div>}
                <div className={`mt-1 d-flex align-items-center gap-1 ${m.mine ? "justify-content-end text-white-50" : "text-muted"}`} style={{ fontSize: 11 }}>
                  <span>{m.createdAt}</span>
                  {m.mine && <MessageTicks status={m.status} />}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    );
  };

  const canCompose = !loading && thread?.enabled && partnerName;

  return (
    <div className="floating-chatbot">
      {open ? (
        <div className="floating-chatbot-panel shadow-lg">
          <div className="floating-chatbot-header d-flex align-items-center justify-content-between bg-primary text-white px-3 py-2">
            <span className="d-flex align-items-center gap-1 fw-semibold">
              <IconMessageHeart size={18} /> Wellness Chat{partnerName ? ` · ${partnerName}` : ""}
            </span>
            <span className="d-flex align-items-center gap-2">
              <Link
                to="/wellness-chat"
                className="text-white d-inline-flex"
                title="Open full chat"
                onClick={() => setOpen(false)}
              >
                <IconArrowsDiagonal size={18} />
              </Link>
              <button type="button" className="btn btn-sm p-0 text-white border-0" title="Close" onClick={() => setOpen(false)}>
                <IconX size={18} />
              </button>
            </span>
          </div>
          <div className="floating-chatbot-body">{renderBody()}</div>
          {canCompose && (
            <Form onSubmit={send} className="d-flex gap-2 p-2 border-top">
              <Form.Control
                size="sm"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Message your trainer…"
                disabled={sending}
              />
              <Button type="submit" size="sm" variant="primary" disabled={sending || !text.trim()}>
                <IconSend size={16} />
              </Button>
            </Form>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="floating-chatbot-bubble btn btn-primary shadow-lg d-flex align-items-center justify-content-center gap-2"
          title="Wellness Chat"
          onClick={() => setOpen(true)}
        >
          <span className="floating-chatbot-bubble-icon d-flex align-items-center justify-content-center">
            <IconMessageHeart size={26} />
          </span>
          <span className="floating-chatbot-bubble-label fw-semibold">Wellness Chat</span>
        </button>
      )}
    </div>
  );
}
