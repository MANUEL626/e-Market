import { createClient } from "@/lib/supabase/client";

const BUCKET = "organization-articles";

/** URL signée (1 h) pour afficher une image du bucket ; null si échec ou chemin vide. */
export async function getOrganizationArticleSignedUrl(
  storagePath: string | null | undefined
): Promise<string | null> {
  if (!storagePath) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

export async function getOrganizationArticleSignedUrls(
  paths: (string | null | undefined)[]
): Promise<(string | null)[]> {
  return Promise.all(paths.map((p) => getOrganizationArticleSignedUrl(p ?? null)));
}
