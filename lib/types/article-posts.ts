/** Aligné sur l’API e-Mall — posts promotionnels par article (slots 1–3). */

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

export const ARTICLE_POST_SLOTS = [1, 2, 3] as const;
export type ArticlePostSlot = (typeof ARTICLE_POST_SLOTS)[number];

export function inferArticlePostMediaKind(file: File): ArticlePostMediaKind {
  return file.type.startsWith("video/") ? "video" : "image";
}

/**
 * Mode progressif : n’affiche que les emplacements utiles — au minimum le **1**,
 * puis le **2** une fois le 1 rempli (ou partiellement utilisé), etc.
 * Les trous (ex. slot 2 sans slot 1) ouvrent quand même jusqu’au plus haut slot occupé + le premier vide.
 */
export function getVisiblePostSlots(posts: OrganizationArticlePost[]): ArticlePostSlot[] {
  if (posts.length === 0) return [1];
  const occupied = new Set(posts.map((p) => p.slot));
  const maxOcc = Math.max(...posts.map((p) => p.slot));
  const nextEmpty = ARTICLE_POST_SLOTS.find((s) => !occupied.has(s));
  const upTo =
    nextEmpty === undefined ? 3 : Math.min(3, Math.max(maxOcc, nextEmpty));
  return ARTICLE_POST_SLOTS.filter((s) => s <= upTo);
}

/** Les trois emplacements API (1–3), pour mode « tout afficher ». */
export function getAllPostSlots(): ArticlePostSlot[] {
  return [...ARTICLE_POST_SLOTS];
}
