import { resolveUploadUrl } from "./mediaUrl";

// Curated cover photos chosen by keywords in the plan's name/level/category, so
// plans without an uploaded mainImage still show a relevant picture instead of a
// blank placeholder. An uploaded mainImage always wins over these fallbacks.
const FALLBACKS = [
  { keys: ["strength", "power", "muscle", "build", "barbell", "weight"], url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=60" },
  { keys: ["hiit", "cardio", "fat", "loss", "burn", "shred", "run", "conditioning"], url: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=800&q=60" },
  { keys: ["yoga", "flex", "mobility", "stretch", "pilates", "core"], url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=60" },
  { keys: ["beginner", "full body", "fullbody", "starter", "foundation"], url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=60" },
];

// Generic gym shot when nothing matches.
const DEFAULT_IMG = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=60";

export function resolveWorkoutImage(plan) {
  const uploaded = plan?.mainImage;
  if (uploaded) {
    return /^https?:\/\//i.test(uploaded) ? uploaded : resolveUploadUrl(uploaded);
  }
  const haystack = `${plan?.name || ""} ${plan?.level || ""} ${plan?.category || ""}`.toLowerCase();
  const match = FALLBACKS.find((f) => f.keys.some((k) => haystack.includes(k)));
  return match ? match.url : DEFAULT_IMG;
}
