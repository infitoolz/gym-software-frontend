import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Card, CardBody, Button, Form } from "react-bootstrap";
import { IconHome, IconSend, IconMessageHeart, IconCrown, IconUser, IconBarbell, IconCheck, IconChecks, IconPaperclip, IconFileText, IconX, IconEye, IconPhone, IconVideo } from "@tabler/icons-react";
import { useAuth } from "../../context/AuthContext";
import { useCall } from "../../context/CallContext";
import IncomingCallModal from "../../components/IncomingCallModal";
import CallOverlay from "../../components/CallOverlay";
import { extractApiErrorMessage } from "../../utils/errorMessage";
import { resolveUploadUrl } from "../../utils/mediaUrl";
import { moderateImageFile } from "../../utils/imageModeration";
import {
  getMyThread,
  sendMyMessage,
  getConversations,
  getConversation,
  sendToMember,
  uploadChatAttachment,
  getOversightTrainers,
  getOversightConversations,
  getOversightConversation,
} from "../../api/chatApi";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // keep in sync with the backend

const POLL_MS = 8000;

// WhatsApp-style delivery ticks for messages the viewer sent.
function MessageTicks({ status }) {
  if (!status) return null;
  if (status === "read") {
    return <IconChecks size={16} style={{ color: "#2f7bff", filter: "drop-shadow(0 0 1px rgba(255,255,255,0.95))" }} />;
  }
  if (status === "delivered") {
    return <IconChecks size={16} style={{ color: "#ffffff" }} />;
  }
  return <IconCheck size={15} style={{ color: "#ffffff" }} />;
}

// "Online" with a green dot, or "last seen …" in muted text.
function PresenceLine({ online, lastSeen }) {
  if (online) {
    return (
      <span className="small text-success d-inline-flex align-items-center gap-1">
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
        Online
      </span>
    );
  }
  return <span className="small text-muted">{lastSeen || "Offline"}</span>;
}

// Renders an attached image inline (click to open full size) or a document as a download chip.
function Attachment({ message }) {
  const url = resolveUploadUrl(message.attachmentUrl);
  if (message.attachmentType === "IMAGE") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="d-block mb-1">
        <img
          src={url}
          alt={message.attachmentName || "image"}
          style={{ maxWidth: 220, maxHeight: 220, borderRadius: 8, display: "block", objectFit: "cover" }}
        />
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={message.attachmentName}
      className={`d-flex align-items-center gap-2 mb-1 text-decoration-none ${message.mine ? "text-white" : "text-dark"}`}
    >
      <IconFileText size={22} />
      <span className="text-truncate" style={{ maxWidth: 180, textDecoration: "underline" }}>
        {message.attachmentName || "Document"}
      </span>
    </a>
  );
}

function MessageList({ messages, emptyText }) {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!messages.length) {
    return <div className="text-center text-muted py-5">{emptyText}</div>;
  }
  return (
    <div className="d-flex flex-column gap-2">
      {messages.map((m) => (
        <div key={m.id} className={`d-flex ${m.mine ? "justify-content-end" : "justify-content-start"}`}>
          <div
            className={`px-3 py-2 rounded-3 ${m.mine ? "bg-primary text-white" : "bg-light text-dark chat-bubble-in"}`}
            style={{ maxWidth: "75%" }}
          >
            {m.attachmentUrl && <Attachment message={m} />}
            {m.content && <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.content}</div>}
            <div className={`small mt-1 d-flex align-items-center gap-1 ${m.mine ? "justify-content-end text-white-50" : "text-muted"}`} style={{ fontSize: 11 }}>
              <span>{m.createdAt}</span>
              {m.mine && <MessageTicks status={m.status} />}
            </div>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

function Composer({ onSend, disabled, placeholder }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileInputRef = useRef(null);

  const isImage = file && String(file.type || "").startsWith("image/");
  const previewUrl = useMemo(() => (isImage ? URL.createObjectURL(file) : null), [file, isImage]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const pickFile = async (e) => {
    setErr("");
    const chosen = e.target.files?.[0];
    e.target.value = "";
    if (!chosen) return;
    if (chosen.size > MAX_ATTACHMENT_BYTES) {
      setErr("Attachments must be 10 MB or less.");
      return;
    }
    if (String(chosen.type || "").startsWith("image/")) {
      setBusy(true);
      try {
        const verdict = await moderateImageFile(chosen);
        if (!verdict.safe) {
          setErr(verdict.reason || "This image can't be sent.");
          return;
        }
      } finally {
        setBusy(false);
      }
    }
    setFile(chosen);
  };

  const clearFile = () => { setFile(null); setErr(""); };

  const submit = async (e) => {
    e?.preventDefault();
    const value = text.trim();
    if ((!value && !file) || busy || disabled) return;
    setBusy(true);
    setErr("");
    try {
      let attachment;
      if (file) {
        const uploaded = await uploadChatAttachment(file);
        attachment = {
          url: uploaded.url,
          name: uploaded.originalName || file.name,
          type: String(file.type || "").startsWith("image/") ? "IMAGE" : "FILE",
        };
      }
      await onSend(value, attachment);
      setText("");
      setFile(null);
    } catch (sendErr) {
      setErr(extractApiErrorMessage(sendErr, "Could not send"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      {err && <div className="text-danger small mb-1">{err}</div>}
      {file && (
        <div className="d-flex align-items-center gap-2 mb-2 p-2 border rounded-3 bg-light" style={{ maxWidth: 320 }}>
          {isImage ? (
            <img src={previewUrl} alt="preview" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
          ) : (
            <IconFileText size={28} className="text-secondary" />
          )}
          <span className="small text-truncate flex-grow-1">{file.name}</span>
          <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={clearFile} title="Remove">
            <IconX size={16} />
          </button>
        </div>
      )}
      <Form onSubmit={submit} className="d-flex gap-2 align-items-end">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="d-none"
          onChange={pickFile}
        />
        <Button
          type="button"
          variant="light"
          className="border"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || busy}
          title="Attach image or document"
        >
          <IconPaperclip size={18} />
        </Button>
        <Form.Control
          as="textarea"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) submit(e);
          }}
          placeholder={placeholder}
          disabled={disabled || busy}
          style={{ resize: "none" }}
        />
        <Button type="submit" variant="primary" disabled={disabled || busy || (!text.trim() && !file)}>
          <IconSend size={18} />
        </Button>
      </Form>
    </div>
  );
}

/* ---------------- Audio/Video Call UI ---------------- */

function CallButtons({ onAudioCall, onVideoCall, disabled }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <Button
        variant="light"
        size="sm"
        className="border rounded-circle d-flex align-items-center justify-content-center"
        style={{ width: 36, height: 36 }}
        onClick={onAudioCall}
        disabled={disabled}
        title="Audio call"
      >
        <IconPhone size={16} className="text-success" />
      </Button>
      <Button
        variant="light"
        size="sm"
        className="border rounded-circle d-flex align-items-center justify-content-center"
        style={{ width: 36, height: 36 }}
        onClick={onVideoCall}
        disabled={disabled}
        title="Video call"
      >
        <IconVideo size={16} className="text-primary" />
      </Button>
    </div>
  );
}

/* ---------------- Member Chat ---------------- */

function MemberChat() {
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { startCall } = useCall();

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setThread(await getMyThread());
      setError("");
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to load chat"));
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

  const handleSend = async (content, attachment) => {
    await sendMyMessage(content, attachment);
    await load(true);
  };

  if (loading) return <div className="text-center py-5">Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  if (thread && !thread.enabled) {
    return (
      <Card>
        <CardBody className="text-center py-5">
          <IconCrown size={40} color="#f4a23b" className="mb-2" />
          <h4 className="fw-bold">Wellness chat is a premium perk</h4>
          <p className="text-muted mb-3">{thread.notice || "Upgrade your plan to chat with a personal trainer."}</p>
          <Link to="/membership" className="btn btn-warning">Upgrade plan</Link>
        </CardBody>
      </Card>
    );
  }

  if (thread && !thread.partnerName) {
    return (
      <Card>
        <CardBody className="text-center py-5">
          <IconBarbell size={40} className="mb-2" />
          <h4 className="fw-bold">No trainer assigned yet</h4>
          <p className="text-muted mb-0">{thread.notice || "Please contact the gym to get a personal trainer."}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="wellness-member-chat">
      <CardBody className="d-flex align-items-center gap-2 border-bottom flex-shrink-0">
        <div className="rounded-circle bg-light-primary d-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
          <IconBarbell size={22} className="text-primary" />
        </div>
        <div className="flex-grow-1">
          <div className="fw-bold">{thread.partnerName}</div>
          <PresenceLine online={thread.partnerOnline} lastSeen={thread.partnerLastSeen} />
        </div>
        <CallButtons
          onAudioCall={() => startCall("AUDIO")}
          onVideoCall={() => startCall("VIDEO")}
        />
      </CardBody>
      <CardBody className="wellness-chat-messages" style={{ height: "55vh", overflowY: "auto" }}>
        <MessageList messages={thread.messages || []} emptyText="Say hello to your trainer 👋" />
      </CardBody>
      <CardBody className="border-top pt-0 flex-shrink-0">
        <Composer onSend={handleSend} placeholder="Message your trainer..." />
      </CardBody>
    </Card>
  );
}

/* ---------------- Trainer Chat ---------------- */

function TrainerChat() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const activeIdRef = useRef(null);
  activeIdRef.current = activeId;
  const { startCallToMember } = useCall();

  const loadConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const list = await getConversations();
      setConversations(list);
      setError("");
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to load conversations"));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadMessages = async (memberId, silent = false) => {
    if (!memberId) return;
    try {
      setMessages(await getConversation(memberId));
    } catch (err) {
      if (!silent) setError(extractApiErrorMessage(err, "Failed to load conversation"));
    }
  };

  useEffect(() => {
    loadConversations();
    const t = setInterval(() => {
      loadConversations(true);
      if (activeIdRef.current) loadMessages(activeIdRef.current, true);
    }, POLL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openConversation = async (memberId) => {
    setActiveId(memberId);
    await loadMessages(memberId);
    loadConversations(true);
  };

  const handleSend = async (content, attachment) => {
    await sendToMember(activeId, content, attachment);
    await loadMessages(activeId, true);
    loadConversations(true);
  };

  const active = useMemo(() => conversations.find((c) => c.memberId === activeId) || null, [conversations, activeId]);

  if (loading) return <div className="text-center py-5">Loading...</div>;

  return (
    <>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row g-3">
        <div className="col-md-4">
          <Card style={{ height: "70vh" }}>
            <CardBody className="border-bottom flex-grow-0"><h6 className="fw-bold mb-0">Members</h6></CardBody>
            <div className="flex-grow-1" style={{ overflowY: "auto", minHeight: 0 }}>
              {conversations.length === 0 ? (
                <div className="text-center text-muted py-4 px-3">No members assigned to you yet.</div>
              ) : (
                conversations.map((c) => (
                  <button
                    type="button"
                    key={c.memberId}
                    onClick={() => openConversation(c.memberId)}
                    className={`w-100 text-start border-0 border-bottom px-3 py-2 d-flex align-items-center gap-2 ${activeId === c.memberId ? "bg-light-primary" : "bg-white"}`}
                  >
                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: 38, height: 38 }}>
                      <IconUser size={18} />
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold d-flex justify-content-between">
                        <span className="text-truncate">{c.memberName}</span>
                        {c.unread > 0 && <span className="badge bg-danger ms-1">{c.unread}</span>}
                      </div>
                      <div className="small text-muted text-truncate">{c.lastMessage || "No messages yet"}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
        <div className="col-md-8">
          <Card style={{ height: "70vh" }} className="d-flex flex-column">
            {active ? (
              <>
                <CardBody className="border-bottom d-flex align-items-center gap-2 flex-shrink-0">
                  <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
                    <IconUser size={22} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-bold">{active.memberName}</div>
                    <PresenceLine online={active.memberOnline} lastSeen={active.memberLastSeen} />
                  </div>
                  <CallButtons
                    onAudioCall={() => startCallToMember(active.memberId, "AUDIO")}
                    onVideoCall={() => startCallToMember(active.memberId, "VIDEO")}
                  />
                </CardBody>
                <CardBody style={{ flex: 1, overflowY: "auto" }}>
                  <MessageList messages={messages} emptyText="No messages yet. Start the conversation." />
                </CardBody>
                <CardBody className="border-top pt-0 flex-shrink-0">
                  <Composer onSend={handleSend} placeholder={`Message ${active.memberName}...`} />
                </CardBody>
              </>
            ) : (
              <CardBody className="d-flex flex-column align-items-center justify-content-center text-muted" style={{ flex: 1 }}>
                <IconMessageHeart size={40} className="mb-2" />
                <div>Select a member to start chatting</div>
              </CardBody>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

/* ---------------- Admin / Manager Oversight ---------------- */

function AdminChat() {
  const [trainers, setTrainers] = useState([]);
  const [activeTrainerId, setActiveTrainerId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeMemberId, setActiveMemberId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const trainerRef = useRef(null);
  const memberRef = useRef(null);
  trainerRef.current = activeTrainerId;
  memberRef.current = activeMemberId;

  const loadTrainers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setTrainers(await getOversightTrainers());
      setError("");
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to load trainers"));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadConversations = async (trainerId, silent = false) => {
    if (!trainerId) return;
    try {
      setConversations(await getOversightConversations(trainerId));
    } catch (err) {
      if (!silent) setError(extractApiErrorMessage(err, "Failed to load conversations"));
    }
  };

  const loadMessages = async (trainerId, memberId, silent = false) => {
    if (!trainerId || !memberId) return;
    try {
      setMessages(await getOversightConversation(trainerId, memberId));
    } catch (err) {
      if (!silent) setError(extractApiErrorMessage(err, "Failed to load conversation"));
    }
  };

  useEffect(() => {
    loadTrainers();
    const t = setInterval(() => {
      loadTrainers(true);
      if (trainerRef.current) loadConversations(trainerRef.current, true);
      if (trainerRef.current && memberRef.current) loadMessages(trainerRef.current, memberRef.current, true);
    }, POLL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openTrainer = async (trainerId) => {
    setActiveTrainerId(trainerId);
    setActiveMemberId(null);
    setMessages([]);
    await loadConversations(trainerId);
  };

  const openMember = async (memberId) => {
    setActiveMemberId(memberId);
    await loadMessages(activeTrainerId, memberId);
  };

  const activeTrainer = useMemo(
    () => trainers.find((t) => t.trainerId === activeTrainerId) || null,
    [trainers, activeTrainerId]
  );
  const activeMember = useMemo(
    () => conversations.find((c) => c.memberId === activeMemberId) || null,
    [conversations, activeMemberId]
  );

  if (loading) return <div className="text-center py-5">Loading...</div>;

  return (
    <>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="alert alert-info d-flex align-items-center gap-2 py-2">
        <IconEye size={18} />
        <span className="small mb-0">Read-only oversight. You can view trainer–member conversations but cannot reply, and viewing won&apos;t mark messages as read.</span>
      </div>
      <div className="row g-3">
        <div className="col-md-3">
          <Card style={{ height: "70vh" }}>
            <CardBody className="border-bottom flex-grow-0"><h6 className="fw-bold mb-0">Trainers</h6></CardBody>
            <div className="flex-grow-1" style={{ overflowY: "auto", minHeight: 0 }}>
              {trainers.length === 0 ? (
                <div className="text-center text-muted py-4 px-3">No trainers found.</div>
              ) : (
                trainers.map((t) => (
                  <button
                    type="button"
                    key={t.trainerId}
                    onClick={() => openTrainer(t.trainerId)}
                    className={`w-100 text-start border-0 border-bottom px-3 py-2 d-flex align-items-center gap-2 ${activeTrainerId === t.trainerId ? "bg-light-primary" : "bg-white"}`}
                  >
                    <div className="rounded-circle bg-light-primary d-flex align-items-center justify-content-center" style={{ width: 38, height: 38 }}>
                      <IconBarbell size={18} className="text-primary" />
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold d-flex justify-content-between">
                        <span className="text-truncate">{t.trainerName}</span>
                        {t.unread > 0 && <span className="badge bg-danger ms-1">{t.unread}</span>}
                      </div>
                      <div className="small text-muted text-truncate">{t.memberCount} member{t.memberCount === 1 ? "" : "s"}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="col-md-3">
          <Card style={{ height: "70vh" }}>
            <CardBody className="border-bottom flex-grow-0">
              <h6 className="fw-bold mb-0 text-truncate">{activeTrainer ? `${activeTrainer.trainerName}'s members` : "Members"}</h6>
            </CardBody>
            <div className="flex-grow-1" style={{ overflowY: "auto", minHeight: 0 }}>
              {!activeTrainerId ? (
                <div className="text-center text-muted py-4 px-3">Select a trainer to see their conversations.</div>
              ) : conversations.length === 0 ? (
                <div className="text-center text-muted py-4 px-3">No members assigned to this trainer.</div>
              ) : (
                conversations.map((c) => (
                  <button
                    type="button"
                    key={c.memberId}
                    onClick={() => openMember(c.memberId)}
                    className={`w-100 text-start border-0 border-bottom px-3 py-2 d-flex align-items-center gap-2 ${activeMemberId === c.memberId ? "bg-light-primary" : "bg-white"}`}
                  >
                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: 38, height: 38 }}>
                      <IconUser size={18} />
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-truncate">{c.memberName}</div>
                      <div className="small text-muted text-truncate">{c.lastMessage || "No messages yet"}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="col-md-6">
          <Card style={{ height: "70vh" }} className="d-flex flex-column">
            {activeMember ? (
              <>
                <CardBody className="border-bottom d-flex align-items-center gap-2 flex-shrink-0">
                  <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
                    <IconUser size={22} />
                  </div>
                  <div>
                    <div className="fw-bold">{activeMember.memberName}</div>
                    <div className="small text-muted">with {activeTrainer?.trainerName}</div>
                  </div>
                </CardBody>
                <CardBody style={{ flex: 1, overflowY: "auto" }}>
                  <MessageList messages={messages} emptyText="No messages in this conversation yet." />
                </CardBody>
                <CardBody className="border-top text-muted small d-flex align-items-center gap-2 flex-shrink-0">
                  <IconEye size={16} /> Viewing only — replies are disabled.
                </CardBody>
              </>
            ) : (
              <CardBody className="d-flex flex-column align-items-center justify-content-center text-muted" style={{ flex: 1 }}>
                <IconMessageHeart size={40} className="mb-2" />
                <div>{activeTrainerId ? "Select a member to read the conversation" : "Select a trainer, then a member"}</div>
              </CardBody>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

/* ---------------- Root Export ---------------- */

export default function WellnessChat() {
  const { user } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const isTrainer = role === "TRAINER";
  const isMember = role === "USER";
  const isOverseer = role === "ADMIN" || role === "SUPER_ADMIN" || role === "MANAGER";

  if (!isTrainer && !isMember && !isOverseer) return <Navigate to="/" replace />;

  return (
    <div className="page-wrapper users-page-wrapper wellness-chat-page">
      <div className="content">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h2 className="mb-1"><IconMessageHeart size={24} className="me-1 text-primary" /> Wellness Chat</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item"><Link to="/"><IconHome size={16} /></Link></li>
                <li className="breadcrumb-item active">Wellness Chat</li>
              </ol>
            </nav>
          </div>
        </div>

        {isOverseer ? <AdminChat /> : isTrainer ? <TrainerChat /> : <MemberChat />}
      </div>

      {/* Call overlays — mounted globally via portal */}
      <IncomingCallModal />
      <CallOverlay />
    </div>
  );
}
