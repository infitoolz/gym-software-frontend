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
    <Card.Header className="d-flex justify-content-between align-items-center">
      <h4 className="mb-0"><IconMessageHeart size={20} className="me-1 text-primary" /> Wellness Chat</h4>
      <Link to="/wellness-chat" className="btn btn-sm btn-light d-inline-flex align-items-center gap-1">
        Open <IconArrowRight size={14} />
      </Link>
    </Card.Header>
  );

  if (loading) {
    return <Card>{Header}<Card.Body className="text-center text-muted py-4">Loading...</Card.Body></Card>;
  }

  // Plan doesn't include trainer chat.
  if (thread && !thread.enabled) {
    return (
      <Card>
        {Header}
        <Card.Body className="text-center py-4">
          <IconCrown size={32} color="#f4a23b" className="mb-2" />
          <p className="text-muted mb-3">{thread.notice || "Upgrade your plan to chat with a personal trainer."}</p>
          <Link to="/membership" className="btn btn-warning btn-sm">Upgrade plan</Link>
        </Card.Body>
      </Card>
    );
  }

  // Entitled but no trainer assigned yet.
  if (thread && !thread.partnerName) {
    return (
      <Card>
        {Header}
        <Card.Body className="text-center py-4">
          <IconBarbell size={32} className="mb-2" />
          <p className="text-muted mb-0">{thread.notice || "No personal trainer is assigned to you yet."}</p>
        </Card.Body>
      </Card>
    );
  }

  const messages = (thread?.messages || []).slice(-5);

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0"><IconMessageHeart size={20} className="me-1 text-primary" /> Wellness Chat · {thread.partnerName}</h4>
        <Link to="/wellness-chat" className="btn btn-sm btn-light d-inline-flex align-items-center gap-1">
          Open full chat <IconArrowRight size={14} />
        </Link>
      </Card.Header>
      <Card.Body>
        <div style={{ maxHeight: 200, overflowY: "auto" }} className="mb-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted py-4">Say hello to your trainer 👋</div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {messages.map((m) => (
                <div key={m.id} className={`d-flex ${m.mine ? "justify-content-end" : "justify-content-start"}`}>
                  <div
                    className={`px-3 py-2 rounded-3 ${m.mine ? "bg-primary text-white" : "bg-light text-dark chat-bubble-in"}`}
                    style={{ maxWidth: "75%" }}
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
        <Form onSubmit={send} className="d-flex gap-2">
          <Form.Control
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message your trainer..."
            disabled={sending}
          />
          <Button type="submit" variant="primary" disabled={sending || !text.trim()}>
            <IconSend size={18} />
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
