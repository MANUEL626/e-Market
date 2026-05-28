/** Aligné sur l’API e-Mall — posts promotionnels par article (slots dynamiques >= 1). */

export type ArticlePostMediaKind = "image" | "video";
export type ArticlePostProcessingStatus = "pending" | "processing" | "ready" | "failed";

export interface OrganizationArticlePost {
  id: string;
  organization_article_id: string;
  slot: number;
  media_kind: ArticlePostMediaKind;
  media_storage_path: string;
  original_media_storage_path?: string | null;
  thumbnail_storage_path?: string | null;
  caption: string | null;
  active: boolean;
  processing_status?: ArticlePostProcessingStatus | null;
  processing_error?: string | null;
  media_width?: number | null;
  media_height?: number | null;
  media_duration_seconds?: number | null;
  media_size_bytes?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface UpsertArticlePostPayload {
  media_kind: ArticlePostMediaKind;
  media_storage_path: string;
  caption?: string | null;
  active?: boolean;
}

export function inferArticlePostMediaKind(file: File): ArticlePostMediaKind {
  return file.type.startsWith("video/") ? "video" : "image";
}

/**
 * Guide API : les slots ne sont plus limites a 3.
 * Le prochain emplacement est max(slot) + 1, sans renumeroter les trous apres suppression.
 */
export function getNextPostSlot(posts: OrganizationArticlePost[]): number {
  const slots = posts
    .map((post) => post.slot)
    .filter((slot) => Number.isInteger(slot) && slot >= 1);
  if (slots.length === 0) return 1;
  return Math.max(...slots) + 1;
}

/**
 * Affiche les posts existants tries par slot + un emplacement vide pour ajouter le suivant.
 */
export function getVisiblePostSlots(posts: OrganizationArticlePost[]): number[] {
  const slots = new Set(
    posts
      .map((post) => post.slot)
      .filter((slot) => Number.isInteger(slot) && slot >= 1)
  );
  slots.add(getNextPostSlot(posts));
  return Array.from(slots).sort((a, b) => a - b);
}
