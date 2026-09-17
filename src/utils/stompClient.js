import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getAccessToken } from "./api";

// Derive the WebSocket base URL from the API base used by axios.
// This works with both local dev (port 8082) and production.
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8082/api";
const WS_BASE = API_BASE.replace(/^http/, "ws").replace(/\/api\/?$/, "");
const WS_URL = `${WS_BASE}/ws/call`;

let client = null;
let subscriptions = [];
let useSockJS = false;
let connectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Get the current STOMP client if connected.
 */
export function getStompClient() {
  if (client && client.connected) return client;
  return null;
}

/**
 * Connect to the call-signaling WebSocket via STOMP.
 * @param {Object} callbacks - { onConnect, onDisconnect, onError }
 */
export function connectStomp(callbacks = {}) {
  if (client && client.connected) {
    callbacks.onConnect?.();
    return;
  }

  if (connectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.warn("[STOMP] Max reconnect attempts reached");
    return;
  }
  connectAttempts++;

  const token = getAccessToken();
  if (!token) return;

  const options = {
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      console.log("[STOMP] Connected to call signaling");
      connectAttempts = 0;
      useSockJS = false;
      callbacks.onConnect?.();
    },
    onDisconnect: () => {
      console.log("[STOMP] Disconnected from call signaling");
      callbacks.onDisconnect?.();
    },
    onStompError: (frame) => {
      console.error("[STOMP] Error:", frame.headers?.message);
      callbacks.onError?.(frame.headers?.message);
    },
  };

  if (useSockJS) {
    // SockJS fallback for environments where raw WebSocket won't connect
    const httpBase = API_BASE.replace(/\/api\/?$/, "");
    options.webSocketFactory = () => new SockJS(`${httpBase}/ws/call`);
  } else {
    options.brokerURL = WS_URL;
  }

  client = new Client(options);
  client.activate();
}

/**
 * Subscribe to a user-specific STOMP destination.
 * @param {string} destination - e.g., "/queue/call/incoming"
 * @param {Function} callback - receives the parsed message body
 * @returns {Function} unsubscribe function
 */
export function subscribeStomp(destination, callback) {
  if (!client || !client.connected) {
    console.warn("[STOMP] Not connected, cannot subscribe to", destination);
    return () => {};
  }

  const subscription = client.subscribe(destination, (message) => {
    try {
      const body = JSON.parse(message.body);
      callback(body);
    } catch (e) {
      console.error("[STOMP] Failed to parse message:", e);
    }
  });

  subscriptions.push(subscription);
  return () => {
    subscription.unsubscribe();
    const idx = subscriptions.indexOf(subscription);
    if (idx !== -1) subscriptions.splice(idx, 1);
  };
}

/**
 * Send a message to a STOMP destination.
 * @param {string} destination - e.g., "/app/call.signal"
 * @param {object} body - JSON-serializable payload
 */
export function sendStomp(destination, body) {
  if (!client || !client.connected) {
    console.warn("[STOMP] Not connected, cannot send to", destination);
    return;
  }
  client.publish({
    destination,
    body: JSON.stringify(body),
  });
}

/**
 * Disconnect the STOMP client.
 */
export function disconnectStomp() {
  subscriptions.forEach((s) => s.unsubscribe());
  subscriptions = [];
  if (client) {
    client.deactivate();
    client = null;
  }
  connectAttempts = 0;
}
