import { ARTICLE_POST_BUCKET } from "@/lib/article-posts/utils";
import { createClient } from "@/lib/supabase/client";

/** URL publique (si le bucket est public). */
export function getOrganizationArticlePostPublicUrl(
  storagePath: string | null | undefined
): string | null {
  if (!storagePath) return null;
  const supabase = createClient();
  const { data } = supabase.storage.from(ARTICLE_POST_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl ?? null;
}

/** URL signée (1 h) — à utiliser en priorité si le bucket n’est pas public. */
export async function getOrganizationArticlePostSignedUrl(
  storagePath: string | null | undefined
): Promise<string | null> {
  if (!storagePath) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(ARTICLE_POST_BUCKET)
      .createSignedUrl(storagePath, 3600);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

export async function removeOrganizationArticlePostFromStorage(
  storagePath: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(ARTICLE_POST_BUCKET).remove([storagePath]);
  if (error) throw new Error(error.message);
}
