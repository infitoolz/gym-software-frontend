import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Button, Form } from "react-bootstrap";
import { IconMessageHeart, IconSend, IconCrown, IconBarbell, IconArrowRight, IconCheck, IconChecks } from "@tabler/icons-react";
import { getMyThread, sendMyMessage } from "../api/chatApi";

const POLL_MS = 10000;

// WhatsApp-style ticks: single (sent), grey double (delivered), blue double (read).
function MessageTicks({ status }) {
  if (!status) return null;
  if (status === "read") return <IconChecks size={15} style={{ color: "#2f7bff", filter: "drop-shadow(0 0 1px rgba(255,255,255,0.95))" }} />;
  if (status === "delivered") return <IconChecks size={15} style={{ color: "#ffffff" }} />;
  return <IconCheck size={14} style={{ color: "#ffffff" }} />;
}

export default function DashboardChatCard() {
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setThread(await getMyThread());
    } catch {
      /* non-blocking on the dashboard */
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

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

  const Header = (
    <div className="card-header-clean d-flex justify-content-between align-items-center py-3 px-3.5 border-bottom bg-white">
      <h5 className="card-title-main mb-0 d-flex align-items-center gap-2" style={{ fontSize: "1rem", fontWeight: 700 }}>
        <IconMessageHeart size={18} className="text-primary" />
        <span>Wellness Chat {thread?.partnerName ? `· ${thread.partnerName}` : ""}</span>
      </h5>
      <Link to="/wellness-chat" className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1 font-monospace" style={{ fontSize: "0.78rem" }}>
        <span>Open full chat</span>
        <IconArrowRight size={13} />
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div className="overview-panel-card shadow-sm border-0 rounded-4 overflow-hidden bg-white mb-4">
        {Header}
        <div className="text-center text-muted py-5">Loading chat preview...</div>
      </div>
    );
  }

  // Plan doesn't include trainer chat.
  if (thread && !thread.enabled) {
    return (
      <div className="overview-panel-card shadow-sm border-0 rounded-4 overflow-hidden bg-white mb-4">
        {Header}
        <div className="text-center py-4 px-3">
          <IconCrown size={32} color="#f4a23b" className="mb-2" />
          <p className="text-muted mb-3 small">{thread.notice || "Upgrade your plan to chat with a personal trainer."}</p>
          <Link to="/membership" className="btn btn-warning btn-sm rounded-pill px-3">Upgrade plan</Link>
        </div>
      </div>
    );
  }

  // Entitled but no trainer assigned yet.
  if (thread && !thread.partnerName) {
    return (
      <div className="overview-panel-card shadow-sm border-0 rounded-4 overflow-hidden bg-white mb-4">
        {Header}
        <div className="text-center py-4 px-3">
          <IconBarbell size={32} className="mb-2 text-secondary opacity-50" />
          <p className="text-muted mb-0 small">{thread.notice || "No personal trainer is assigned to you yet."}</p>
        </div>
      </div>
    );
  }

  const messages = (thread?.messages || []).slice(-5);

  return (
    <div className="overview-panel-card shadow-sm border-0 rounded-4 overflow-hidden bg-white mb-4">
      {Header}
      <div className="p-3">
        <div style={{ maxHeight: 210, overflowY: "auto" }} className="mb-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted py-4 small">Say hello to your trainer 👋</div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {messages.map((m) => (
                <div key={m.id} className={`d-flex ${m.mine ? "justify-content-end" : "justify-content-start"}`}>
                  <div
                    className={`px-3 py-2 rounded-3 ${m.mine ? "bg-primary text-white" : "bg-light text-dark chat-bubble-in"}`}
                    style={{ maxWidth: "78%", fontSize: "0.88rem" }}
                  >
                    <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.content}</div>
                    <div className={`mt-1 d-flex align-items-center gap-1 ${m.mine ? "justify-content-end text-white-50" : "text-muted"}`} style={{ fontSize: 11 }}>
                      <span>{m.createdAt}</span>
                      {m.mine && <MessageTicks status={m.status} />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>
        <Form onSubmit={send} className="d-flex gap-2 align-items-center pt-2 border-top">
          <Form.Control
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message your trainer..."
            disabled={sending}
            className="rounded-pill bg-light border-0 px-3 py-2"
            style={{ fontSize: "0.88rem" }}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={sending || !text.trim()}
            className="rounded-circle d-flex align-items-center justify-content-center p-0 flex-shrink-0"
            style={{ width: 38, height: 38 }}
            title="Send"
          >
            <IconSend size={16} />
          </Button>
        </Form>
      </div>
    </div>
  );
}
