// A human-friendly, unique, alphanumeric member code derived from the account id.
// The "FNX" prefix guarantees letters; the zero-padded id guarantees digits and
// uniqueness (1:1 with the unique account id). e.g. id 28 -> "FNX00028".
const PREFIX = "FNX";

export function formatMemberCode(id) {
  if (id === null || id === undefined || id === "") return "";
  const n = Number(id);
  if (!Number.isFinite(n)) return "";
  return `${PREFIX}${String(n).padStart(5, "0")}`;
}

// Reverse: pull the numeric account id back out of a member code (or a plain id).
export function parseMemberCode(code) {
  if (code === null || code === undefined) return null;
  const digits = String(code).toUpperCase().replace(PREFIX, "").replace(/\D/g, "");
  if (!digits) return null;
  return Number(digits);
}
