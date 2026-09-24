// Central place for per-device user preferences (theme, notifications, PIN lock),
// persisted in localStorage. Components read/write through these helpers so the
// settings stay in sync. A `preferenceschange` window event is dispatched on every
// change so other mounted components (e.g. the header) can react immediately.

const THEME_KEY = "theme";
const NOTIF_KEY = "pref_notifications";
const PINLOCK_KEY = "pref_pinlock";
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
   Server-backed screen lock.
   - PIN is stored hashed on the backend server.
   - Status (enabled/disabled) is mirrored in localStorage.
   - Active unlock state is stored in sessionStorage (relocks when browser restarts).
*/

export function isPinLockEnabled() {
  return localStorage.getItem(PINLOCK_KEY) === "true";
}

export function setPinLockEnabled(enabled) {
  if (enabled) {
    localStorage.setItem(PINLOCK_KEY, "true");
    sessionStorage.setItem(UNLOCK_KEY, "true");
  } else {
    localStorage.removeItem(PINLOCK_KEY);
    sessionStorage.removeItem(UNLOCK_KEY);
  }
  notifyChange();
}

export function disablePinLock() {
  setPinLockEnabled(false);
}

export function isUnlockedThisSession() {
  return sessionStorage.getItem(UNLOCK_KEY) === "true";
}

export function markUnlocked() {
  sessionStorage.setItem(UNLOCK_KEY, "true");
}

export function lockCurrentSession() {
  sessionStorage.removeItem(UNLOCK_KEY);
}
