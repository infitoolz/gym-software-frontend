// Central place for per-device user preferences (theme, notifications, PIN lock),
// persisted in localStorage. Components read/write through these helpers so the
// settings stay in sync. A `preferenceschange` window event is dispatched on every
// change so other mounted components (e.g. the header) can react immediately.

const THEME_KEY = "theme";
const NOTIF_KEY = "pref_notifications";
const PINLOCK_KEY = "pref_pinlock";
const PIN_KEY = "pref_pin";
const UNLOCK_KEY = "pin_unlocked"; // sessionStorage — re-locks on a new browser session

export const PREFERENCES_EVENT = "preferenceschange";

function notifyChange() {
  window.dispatchEvent(new Event(PREFERENCES_EVENT));
}

/* ---------------- Theme ---------------- */
export function getTheme() {
  return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

export function applyTheme(theme) {
  document.body.setAttribute("data-bs-theme", theme === "dark" ? "dark" : "light");
}

export function setTheme(theme) {
  const t = theme === "dark" ? "dark" : "light";
  localStorage.setItem(THEME_KEY, t);
  applyTheme(t);
  notifyChange();
  return t;
}

/* ---------------- Notifications ---------------- */
export function getNotificationsEnabled() {
  return localStorage.getItem(NOTIF_KEY) !== "false"; // default ON
}

export function setNotificationsEnabled(enabled) {
  localStorage.setItem(NOTIF_KEY, enabled ? "true" : "false");
  notifyChange();
}

/* ---------------- PIN lock ----------------
   A lightweight client-side lock (UX gate, not strong security). The PIN is
   hashed before storage so it isn't kept in plaintext. */
function hashPin(pin) {
  let h = 0;
  const s = `fitnexus:${pin}`;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return String(h);
}

export function isPinLockEnabled() {
  return localStorage.getItem(PINLOCK_KEY) === "true" && Boolean(localStorage.getItem(PIN_KEY));
}

export function setPin(pin) {
  localStorage.setItem(PIN_KEY, hashPin(pin));
  localStorage.setItem(PINLOCK_KEY, "true");
  sessionStorage.setItem(UNLOCK_KEY, "true"); // setting a PIN leaves the app unlocked now
  notifyChange();
}

export function verifyPin(pin) {
  return localStorage.getItem(PIN_KEY) === hashPin(pin);
}

export function disablePinLock() {
  localStorage.removeItem(PINLOCK_KEY);
  localStorage.removeItem(PIN_KEY);
  sessionStorage.removeItem(UNLOCK_KEY);
  notifyChange();
}

export function isUnlockedThisSession() {
  return sessionStorage.getItem(UNLOCK_KEY) === "true";
}

export function markUnlocked() {
  sessionStorage.setItem(UNLOCK_KEY, "true");
}
