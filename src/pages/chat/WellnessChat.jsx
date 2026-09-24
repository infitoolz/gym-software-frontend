import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Card, CardBody, Button, Form } from "react-bootstrap";
import { IconHome, IconSend, IconMessageHeart, IconCrown, IconUser, IconBarbell, IconCheck, IconChecks, IconPaperclip, IconFileText, IconX, IconEye, IconPhone, IconVideo, IconSearch } from "@tabler/icons-react";
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
      <span className="text-success d-inline-flex align-items-center gap-1" style={{ fontSize: "0.76rem", lineHeight: 1.1 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
        Online
      </span>
    );
  }
  return <span className="text-muted" style={{ fontSize: "0.76rem", lineHeight: 1.1 }}>{lastSeen || "Offline"}</span>;
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

function Composer({ onSend, placeholder = "Type a message...", disabled }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isImage, setIsImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setIsImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const pickFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_ATTACHMENT_BYTES) {
      alert("Attachments must be 10MB or smaller.");
      clearFile();
      return;
    }
    const isImg = f.type.startsWith("image/");
    if (isImg) {
      const check = await moderateImageFile(f);
      if (!check.allowed) {
        alert(check.reason || "This image does not comply with community guidelines.");
        clearFile();
        return;
      }
    }
    setFile(f);
    setIsImage(isImg);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e?.preventDefault();
    const content = text.trim();
    if (!content && !file) return;
    setBusy(true);
    try {
      let attachment = null;
      if (file) {
        attachment = await uploadChatAttachment(file);
      }
      await onSend(content, attachment);
      setText("");
      clearFile();
    } catch (err) {
      alert(extractApiErrorMessage(err, "Failed to send message"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wellness-chat-composer">
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
      <Form onSubmit={submit} className="d-flex gap-2 align-items-center m-0">
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
          className="border d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle p-0"
          style={{ width: 42, height: 42, color: "#64748b", background: "#f8fafc" }}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || busy}
          title="Attach image or document"
        >
          <IconPaperclip size={20} />
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
          style={{
            resize: "none",
            height: 42,
            minHeight: 42,
            borderRadius: 21,
            padding: "9px 18px",
            fontSize: "0.92rem",
            backgroundColor: "#f8fafc",
            borderColor: "#e2e8f0",
          }}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={disabled || busy || (!text.trim() && !file)}
          className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle p-0"
          style={{ width: 42, height: 42, background: "#2563eb", border: "none" }}
          title="Send message"
        >
          <IconSend size={18} />
        </Button>
      </Form>
    </div>
  );
}

/* ---------------- WhatsApp-style Avatar ---------------- */

function ChatAvatar({ src, name, size = 42, online = false, showStatus = true, className = "" }) {
  const [imgError, setImgError] = useState(false);
  const resolvedUrl = useMemo(() => resolveUploadUrl(src), [src]);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const initials = useMemo(() => {
    const trimmed = String(name || "").trim();
    if (!trimmed) return "?";
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }, [name]);

  const avatarColors = [
    "linear-gradient(135deg, #00a884 0%, #008069 100%)", // WhatsApp emerald
    "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", // Royal Blue
    "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", // Purple
    "linear-gradient(135deg, #db2777 0%, #be185d 100%)", // Pink
    "linear-gradient(135deg, #d97706 0%, #b45309 100%)", // Amber
    "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)", // Cyan
  ];

  const colorIndex = useMemo(() => {
    let hash = 0;
    const str = name || "User";
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % avatarColors.length;
  }, [name]);

  const dotSize = Math.max(10, Math.round(size * 0.26));

  return (
    <div className={`position-relative d-inline-block flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      {resolvedUrl && !imgError ? (
        <img
          src={resolvedUrl}
          alt={name || "User Avatar"}
          onError={() => setImgError(true)}
          className="rounded-circle shadow-sm"
          style={{
            width: size,
            height: size,
            objectFit: "cover",
            display: "block",
            border: "2px solid #ffffff",
          }}
        />
      ) : (
        <div
          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
          style={{
            width: size,
            height: size,
            background: avatarColors[colorIndex],
            fontSize: Math.max(12, Math.round(size * 0.38)),
            letterSpacing: "0.5px",
            border: "2px solid #ffffff",
            userSelect: "none",
          }}
        >
          {initials}
        </div>
      )}
      {showStatus && online && (
        <span
          className="position-absolute rounded-circle"
          style={{
            width: dotSize,
            height: dotSize,
            background: "#22c55e",
            border: "2px solid #ffffff",
            bottom: 0,
            right: 0,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.06)",
          }}
          title="Online"
        />
      )}
    </div>
  );
}

/* ---------------- WhatsApp-style Audio/Video Call Buttons (Compact) ---------------- */

function CallButtons({ onAudioCall, onVideoCall, disabled, size = 34 }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <button
        type="button"
        className="btn d-flex align-items-center justify-content-center rounded-circle p-0 call-btn-audio"
        style={{
          width: size,
          height: size,
          backgroundColor: "#f0fdf4",
          border: "1px solid #86efac",
          color: "#16a34a",
          boxShadow: "0 1px 4px rgba(22, 163, 74, 0.12)",
          transition: "all 0.2s ease",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
        onClick={onAudioCall}
        disabled={disabled}
        title="Voice Call"
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = "#16a34a";
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.transform = "scale(1.06)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(22, 163, 74, 0.28)";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = "#f0fdf4";
            e.currentTarget.style.color = "#16a34a";
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 1px 4px rgba(22, 163, 74, 0.12)";
          }
        }}
      >
        <IconPhone size={16} stroke={2.1} />
      </button>

      <button
        type="button"
        className="btn d-flex align-items-center justify-content-center rounded-circle p-0 call-btn-video"
        style={{
          width: size,
          height: size,
          backgroundColor: "#eff6ff",
          border: "1px solid #93c5fd",
          color: "#2563eb",
          boxShadow: "0 1px 4px rgba(37, 99, 235, 0.12)",
          transition: "all 0.2s ease",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
        onClick={onVideoCall}
        disabled={disabled}
        title="Video Call"
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = "#2563eb";
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.transform = "scale(1.06)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(37, 99, 235, 0.28)";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = "#eff6ff";
            e.currentTarget.style.color = "#2563eb";
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 1px 4px rgba(37, 99, 235, 0.12)";
          }
        }}
      >
        <IconVideo size={16} stroke={2.1} />
      </button>
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
    <Card className="wellness-member-chat shadow-sm border-0 rounded-4 overflow-hidden">
      <div
        className="border-bottom d-flex align-items-center gap-2.5 flex-shrink-0 bg-white"
        style={{ padding: "8px 18px", minHeight: "52px" }}
      >
        <ChatAvatar
          src={thread.partnerPhotoPath}
          name={thread.partnerName}
          size={38}
          online={thread.partnerOnline}
          showStatus={true}
        />
        <div className="flex-grow-1 min-w-0">
          <div className="fw-semibold text-dark text-truncate" style={{ fontSize: "0.95rem", lineHeight: 1.2 }}>
            {thread.partnerName}
          </div>
          <PresenceLine online={thread.partnerOnline} lastSeen={thread.partnerLastSeen} />
        </div>
        <CallButtons
          size={34}
          onAudioCall={() => startCall("AUDIO")}
          onVideoCall={() => startCall("VIDEO")}
        />
      </div>
      <CardBody className="wellness-chat-messages bg-light-subtle" style={{ height: "55vh", overflowY: "auto" }}>
        <MessageList messages={thread.messages || []} emptyText="Say hello to your trainer 👋" />
      </CardBody>
      <div className="border-top bg-white px-3 py-2.5 flex-shrink-0 chat-composer-container" style={{ padding: "10px 16px" }}>
        <Composer onSend={handleSend} placeholder="Message your trainer..." />
      </div>
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
  const [memberSearch, setMemberSearch] = useState("");
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

  const filteredConversations = useMemo(() => {
    if (!memberSearch.trim()) return conversations;
    const q = memberSearch.toLowerCase();
    return conversations.filter((c) => String(c.memberName || "").toLowerCase().includes(q));
  }, [conversations, memberSearch]);

  if (loading) return <div className="text-center py-5">Loading...</div>;

  return (
    <>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row g-3">
        <div className="col-md-4">
          <Card style={{ height: "72vh" }} className="shadow-sm border-0 rounded-4 overflow-hidden">
            <CardBody className="border-bottom flex-grow-0 p-3 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold mb-0">Members</h6>
                <span className="badge bg-light text-dark border px-2 py-1">{conversations.length}</span>
              </div>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <IconSearch size={14} />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0 ps-0"
                  placeholder="Search member..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>
            </CardBody>
            <div className="flex-grow-1" style={{ overflowY: "auto", minHeight: 0 }}>
              {filteredConversations.length === 0 ? (
                <div className="text-center text-muted py-5 px-3">
                  {conversations.length === 0 ? "No members assigned to you yet." : "No matching members found."}
                </div>
              ) : (
                filteredConversations.map((c) => (
                  <button
                    type="button"
                    key={c.memberId}
                    onClick={() => openConversation(c.memberId)}
                    className={`w-100 text-start border-0 border-bottom px-3 py-3 d-flex align-items-center gap-3 ${activeId === c.memberId ? "bg-light-primary border-start border-primary border-3" : "bg-white"}`}
                    style={{ transition: "all 0.15s ease" }}
                  >
                    <ChatAvatar
                      src={c.photoPath || c.memberPhotoPath}
                      name={c.memberName}
                      size={42}
                      online={c.memberOnline || c.isOnline}
                      showStatus={true}
                    />
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold d-flex justify-content-between align-items-center mb-1">
                        <span className="text-truncate text-dark">{c.memberName}</span>
                        {c.unread > 0 && <span className="badge bg-danger rounded-pill px-2 py-1">{c.unread}</span>}
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
          <Card style={{ height: "72vh" }} className="shadow-sm border-0 rounded-4 overflow-hidden d-flex flex-column">
            {active ? (
              <>
                <div
                  className="border-bottom d-flex align-items-center gap-2.5 flex-shrink-0 bg-white"
                  style={{ padding: "8px 18px", minHeight: "52px" }}
                >
                  <ChatAvatar
                    src={active.photoPath || active.memberPhotoPath}
                    name={active.memberName}
                    size={38}
                    online={active.memberOnline || active.isOnline}
                    showStatus={true}
                  />
                  <div className="flex-grow-1 min-w-0">
                    <div className="fw-semibold text-dark text-truncate" style={{ fontSize: "0.95rem", lineHeight: 1.2 }}>
                      {active.memberName}
                    </div>
                    <PresenceLine online={active.memberOnline} lastSeen={active.memberLastSeen} />
                  </div>
                  <CallButtons
                    size={34}
                    onAudioCall={() => startCallToMember(active.memberId, "AUDIO")}
                    onVideoCall={() => startCallToMember(active.memberId, "VIDEO")}
                  />
                </div>
                <CardBody className="bg-light-subtle" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                  <MessageList messages={messages} emptyText="No messages yet. Start the conversation." />
                </CardBody>
                <div className="border-top bg-white px-3 py-2.5 flex-shrink-0 chat-composer-container" style={{ padding: "10px 16px" }}>
                  <Composer onSend={handleSend} placeholder={`Message ${active.memberName}...`} />
                </div>
              </>
            ) : (
              <CardBody className="d-flex flex-column align-items-center justify-content-center text-muted bg-white" style={{ flex: 1 }}>
                <IconMessageHeart size={44} className="mb-2 text-primary opacity-50" />
                <div className="fw-semibold fs-6">Select a member to start chatting</div>
                <small className="text-muted">Chat, share photos, and place voice or video calls</small>
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
      <div className="alert alert-info d-flex align-items-center gap-2 py-2 rounded-3">
        <IconEye size={18} />
        <span className="small mb-0">Read-only oversight. You can view trainer–member conversations but cannot reply, and viewing won&apos;t mark messages as read.</span>
      </div>
      <div className="row g-3">
        <div className="col-md-3">
          <Card style={{ height: "72vh" }} className="shadow-sm border-0 rounded-4 overflow-hidden">
            <CardBody className="border-bottom flex-grow-0 p-3 bg-white"><h6 className="fw-bold mb-0">Trainers</h6></CardBody>
            <div className="flex-grow-1" style={{ overflowY: "auto", minHeight: 0 }}>
              {trainers.length === 0 ? (
                <div className="text-center text-muted py-5 px-3">No trainers found.</div>
              ) : (
                trainers.map((t) => (
                  <button
                    type="button"
                    key={t.trainerId}
                    onClick={() => openTrainer(t.trainerId)}
                    className={`w-100 text-start border-0 border-bottom px-3 py-3 d-flex align-items-center gap-3 ${activeTrainerId === t.trainerId ? "bg-light-primary border-start border-primary border-3" : "bg-white"}`}
                    style={{ transition: "all 0.15s ease" }}
                  >
                    <ChatAvatar
                      src={t.trainerPhotoPath || t.photoPath}
                      name={t.trainerName}
                      size={40}
                      online={t.online || t.isOnline}
                      showStatus={true}
                    />
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold d-flex justify-content-between align-items-center mb-1">
                        <span className="text-truncate text-dark">{t.trainerName}</span>
                        {t.unread > 0 && <span className="badge bg-danger rounded-pill px-2 py-1">{t.unread}</span>}
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
          <Card style={{ height: "72vh" }} className="shadow-sm border-0 rounded-4 overflow-hidden">
            <CardBody className="border-bottom flex-grow-0 p-3 bg-white">
              <h6 className="fw-bold mb-0 text-truncate">{activeTrainer ? `${activeTrainer.trainerName}'s members` : "Members"}</h6>
            </CardBody>
            <div className="flex-grow-1" style={{ overflowY: "auto", minHeight: 0 }}>
              {!activeTrainerId ? (
                <div className="text-center text-muted py-5 px-3">Select a trainer to see their conversations.</div>
              ) : conversations.length === 0 ? (
                <div className="text-center text-muted py-5 px-3">No members assigned to this trainer.</div>
              ) : (
                conversations.map((c) => (
                  <button
                    type="button"
                    key={c.memberId}
                    onClick={() => openMember(c.memberId)}
                    className={`w-100 text-start border-0 border-bottom px-3 py-3 d-flex align-items-center gap-3 ${activeMemberId === c.memberId ? "bg-light-primary border-start border-primary border-3" : "bg-white"}`}
                    style={{ transition: "all 0.15s ease" }}
                  >
                    <ChatAvatar
                      src={c.photoPath || c.memberPhotoPath}
                      name={c.memberName}
                      size={40}
                      online={c.memberOnline || c.isOnline}
                      showStatus={true}
                    />
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-truncate text-dark mb-1">{c.memberName}</div>
                      <div className="small text-muted text-truncate">{c.lastMessage || "No messages yet"}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="col-md-6">
          <Card style={{ height: "72vh" }} className="shadow-sm border-0 rounded-4 overflow-hidden d-flex flex-column">
            {activeMember ? (
              <>
                <div
                  className="border-bottom d-flex align-items-center gap-2.5 flex-shrink-0 bg-white"
                  style={{ padding: "8px 18px", minHeight: "52px" }}
                >
                  <ChatAvatar
                    src={activeMember.photoPath || activeMember.memberPhotoPath}
                    name={activeMember.memberName}
                    size={38}
                    online={activeMember.memberOnline || activeMember.isOnline}
                    showStatus={true}
                  />
                  <div className="min-w-0">
                    <div className="fw-semibold text-dark text-truncate" style={{ fontSize: "0.95rem", lineHeight: 1.2 }}>
                      {activeMember.memberName}
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.75rem", lineHeight: 1.1 }}>
                      with {activeTrainer?.trainerName}
                    </div>
                  </div>
                </div>
                <CardBody className="bg-light-subtle" style={{ flex: 1, overflowY: "auto" }}>
                  <MessageList messages={messages} emptyText="No messages in this conversation yet." />
                </CardBody>
                <CardBody className="border-top text-muted small d-flex align-items-center gap-2 flex-shrink-0 py-2 px-4 bg-white">
                  <IconEye size={16} /> Viewing only — replies are disabled.
                </CardBody>
              </>
            ) : (
              <CardBody className="d-flex flex-column align-items-center justify-content-center text-muted bg-white" style={{ flex: 1 }}>
                <IconMessageHeart size={44} className="mb-2 text-primary opacity-50" />
                <div className="fw-semibold fs-6">{activeTrainerId ? "Select a member to read the conversation" : "Select a trainer, then a member"}</div>
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
