const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8082/api";
const UPLOADS_BASE = API_BASE.replace(/\/api\/?$/, "");

export function resolveUploadUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/uploads/")) return `${UPLOADS_BASE}${path}`;
  return path;
}
