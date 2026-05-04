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
  const rawExt = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
  const ext = /^[a-z0-9]+$/i.test(rawExt) ? rawExt : "bin";
  const objectPath = `${organizationId}/posts/${articleId}/slot-${slot}-${crypto.randomUUID()}.${ext}`;
  if (!isPostMediaPathForOrganization(organizationId, objectPath)) {
    throw new Error("Chemin d’upload invalide (préfixe organisation requis).");
  }
  const { error } = await supabase.storage.from(ARTICLE_POST_BUCKET).upload(objectPath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return objectPath;
}
