import { createClient } from "@/lib/supabase/client";

const AVATARS_BUCKET = "avatars";

export function getAvatarPublicUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  try {
    const supabase = createClient();
    const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(pathOrUrl);
    return data.publicUrl ?? null;
  } catch {
    return null;
  }
}
