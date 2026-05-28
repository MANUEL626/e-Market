import {
  ARTICLE_POST_BUCKET,
  assertArticlePostSlot,
  isPostMediaPathForOrganization,
} from "@/lib/article-posts/utils";
import { createClient } from "@/lib/supabase/client";

export async function uploadOrganizationArticlePostMedia(
  organizationId: string,
  articleId: string,
  slot: number,
  file: File
): Promise<string> {
  assertArticlePostSlot(slot);
  const supabase = createClient();
  const fallbackName = crypto.randomUUID();
  const safeName = (file.name || fallbackName).replace(/[^a-zA-Z0-9._-]/g, "-");
  const objectPath = `${organizationId}/posts/${articleId}/${slot}/${Date.now()}-${safeName}`;
  if (!isPostMediaPathForOrganization(organizationId, objectPath)) {
    throw new Error("Chemin d’upload invalide (préfixe organisation requis).");
  }
  const { error } = await supabase.storage.from(ARTICLE_POST_BUCKET).upload(objectPath, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return objectPath;
}
