import api from "../utils/api";

const unwrapOne = (response) => response?.data?.data ?? null;
const unwrapList = (response) => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : [];
};

// Upload a chat attachment (image or document); returns { url, originalName, ... }.
export async function uploadChatAttachment(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/uploads/chat-attachments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapOne(response);
}

// Member side
export async function getMyThread() {
  const response = await api.get("/chat/my");
  return unwrapOne(response);
}

export async function sendMyMessage(content, attachment) {
  const response = await api.post("/chat/my", { content, ...attachmentFields(attachment) });
  return unwrapOne(response);
}

// Trainer side
export async function getConversations() {
  const response = await api.get("/chat/conversations");
  return unwrapList(response);
}

export async function getConversation(memberId) {
  const response = await api.get(`/chat/conversation/${memberId}`);
  return unwrapList(response);
}

export async function sendToMember(memberId, content, attachment) {
  const response = await api.post(`/chat/conversation/${memberId}`, { content, ...attachmentFields(attachment) });
  return unwrapOne(response);
}

// Admin / manager oversight (read-only)
export async function getOversightTrainers() {
  const response = await api.get("/chat/admin/trainers");
  return unwrapList(response);
}

export async function getOversightConversations(trainerId) {
  const response = await api.get(`/chat/admin/trainer/${trainerId}/conversations`);
  return unwrapList(response);
}

export async function getOversightConversation(trainerId, memberId) {
  const response = await api.get(`/chat/admin/trainer/${trainerId}/conversation/${memberId}`);
  return unwrapList(response);
}

// Maps an { url, originalName, type } attachment to the request fields the backend expects.
function attachmentFields(attachment) {
  if (!attachment?.url) return {};
  return {
    attachmentUrl: attachment.url,
    attachmentName: attachment.name,
    attachmentType: attachment.type, // "IMAGE" | "FILE"
  };
}

/* ---------------- Audio/video call APIs ---------------- */

const unwrap = (response) => response?.data?.data ?? null;

/** Fetch ICE (STUN/TURN) server configuration. */
export async function getIceServers() {
  const response = await api.get("/calls/ice-servers");
  return unwrap(response);
}

/** Member initiates a call to their personal trainer. */
export async function initiateCall(callType = "AUDIO") {
  const response = await api.post("/calls/initiate", { callType });
  return unwrap(response);
}

/** Trainer initiates a call to a specific member. */
export async function initiateCallToMember(memberId, callType = "AUDIO") {
  const response = await api.post(`/calls/initiate/${memberId}`, { callType });
  return unwrap(response);
}

/** Accept an incoming call. */
export async function acceptCall(callId) {
  const response = await api.post(`/calls/${callId}/accept`);
  return unwrap(response);
}

/** Reject an incoming call. */
export async function rejectCall(callId) {
  const response = await api.post(`/calls/${callId}/reject`);
  return unwrap(response);
}

/** End an active call. */
export async function endCall(callId) {
  const response = await api.post(`/calls/${callId}/end`);
  return unwrap(response);
}

/** Poll for pending incoming calls. */
export async function getPendingCalls() {
  const response = await api.get("/calls/pending");
  const data = response?.data?.data;
  return Array.isArray(data) ? data : [];
}

/** Get call history with a partner. */
export async function getCallHistory(partnerId) {
  const response = await api.get(`/calls/history/${partnerId}`);
  const data = response?.data?.data;
  return Array.isArray(data) ? data : [];
}
