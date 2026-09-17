import { resolveUploadUrl } from "./mediaUrl";

export function resolveDietImage(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return resolveUploadUrl(path);
}
