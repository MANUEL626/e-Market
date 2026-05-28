/**
 * Règles alignées sur guide_api.md — posts promotionnels (organization-article-posts).
 */

import type {
  ArticlePostProcessingStatus,
  OrganizationArticlePost,
  UpsertArticlePostPayload,
} from "@/lib/types/article-posts";

export const ARTICLE_POST_CAPTION_MAX = 500;

export const ARTICLE_POST_BUCKET = "organization-article-posts" as const;

export function isArticlePostSlot(n: number): boolean {
  return Number.isInteger(n) && n >= 1;
}

export function assertArticlePostSlot(slot: number): void {
  if (!isArticlePostSlot(slot)) {
    throw new Error("Emplacement invalide : utilisez un entier superieur ou egal a 1.");
  }
}

/**
 * Guide : le chemin d’objet Storage doit commencer par `{organization_id}/`
 * (sinon l’API répond 400).
 */
export function isPostMediaPathForOrganization(
  organizationId: string,
  mediaStoragePath: string
): boolean {
  if (!organizationId || !mediaStoragePath) return false;
  const prefix = `${organizationId}/`;
  return mediaStoragePath.startsWith(prefix);
}

export function normalizeCaptionForApi(caption: string | null | undefined): string | null {
  if (caption == null) return null;
  if (typeof caption !== "string") return null;
  const t = caption.trim();
  return t.length === 0 ? null : t;
}

export function assertCaptionWithinLimit(caption: string | null): void {
  if (caption != null && caption.length > ARTICLE_POST_CAPTION_MAX) {
    throw new Error(`Légende trop longue (max. ${ARTICLE_POST_CAPTION_MAX} caractères).`);
  }
}

/**
 * Corps complet pour un PUT sur un slot (pas de PATCH partiel — guide).
 */
/** Corps brut HTTP → payload typé (PUT). */
export function parseUpsertPostBodyFromRequest(body: unknown): UpsertArticlePostPayload | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const media_kind = o.media_kind;
  const media_storage_path = o.media_storage_path;
  if (media_kind !== "image" && media_kind !== "video") return null;
  if (typeof media_storage_path !== "string" || media_storage_path.length === 0) return null;
  const cap = o.caption;
  return {
    media_kind,
    media_storage_path,
    caption: cap === null || typeof cap === "string" ? (cap as string | null) : null,
    active: typeof o.active === "boolean" ? o.active : undefined,
  };
}

export function buildUpsertArticlePostBody(
  organizationId: string,
  input: UpsertArticlePostPayload
): UpsertArticlePostPayload {
  const caption = normalizeCaptionForApi(input.caption);
  assertCaptionWithinLimit(caption);
  if (!isPostMediaPathForOrganization(organizationId, input.media_storage_path)) {
    throw new Error(
      "Chemin média invalide : il doit commencer par l’UUID de l’organisation suivi de « / » (bucket organization-article-posts)."
    );
  }
  if (input.media_kind !== "image" && input.media_kind !== "video") {
    throw new Error('media_kind doit être « image » ou « video ».');
  }
  return {
    media_kind: input.media_kind,
    media_storage_path: input.media_storage_path,
    caption,
    active: input.active !== false,
  };
}

export function extractPostsArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "posts" in data) {
    const posts = (data as { posts?: unknown }).posts;
    if (Array.isArray(posts)) return posts;
  }
  return [];
}

function normalizeNullableString(value: unknown): string | null {
  return value === null || typeof value === "string" ? value : null;
}

function normalizeNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeProcessingStatus(value: unknown): ArticlePostProcessingStatus | null {
  if (
    value === "pending" ||
    value === "processing" ||
    value === "ready" ||
    value === "failed"
  ) {
    return value;
  }
  return null;
}

/** Normalise un objet post renvoyé par GET / PUT. */
export function normalizeArticlePost(raw: unknown): OrganizationArticlePost | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const slot = Number(o.slot);
  const id = o.id;
  const media_kind = o.media_kind;
  const path = o.media_storage_path;
  if (typeof id !== "string" || typeof path !== "string") return null;
  if (!isArticlePostSlot(slot)) return null;
  if (media_kind !== "image" && media_kind !== "video") return null;
  const cap = o.caption;
  return {
    id,
    organization_article_id:
      typeof o.organization_article_id === "string" ? o.organization_article_id : "",
    slot,
    media_kind,
    media_storage_path: path,
    original_media_storage_path: normalizeNullableString(o.original_media_storage_path),
    thumbnail_storage_path: normalizeNullableString(o.thumbnail_storage_path),
    caption: normalizeNullableString(cap),
    active: o.active !== false,
    processing_status: normalizeProcessingStatus(o.processing_status),
    processing_error: normalizeNullableString(o.processing_error),
    media_width: normalizeNullableNumber(o.media_width),
    media_height: normalizeNullableNumber(o.media_height),
    media_duration_seconds: normalizeNullableNumber(o.media_duration_seconds),
    media_size_bytes: normalizeNullableNumber(o.media_size_bytes),
    created_at: typeof o.created_at === "string" ? o.created_at : undefined,
    updated_at: typeof o.updated_at === "string" ? o.updated_at : undefined,
  };
}

/**
 * Liste défensive : dédoublonne par slot (dernier gagne), trie par slot (guide : tri par slot).
 */
export function normalizeArticlePostsListPayload(data: unknown): OrganizationArticlePost[] {
  const mapped = extractPostsArray(data)
    .map(normalizeArticlePost)
    .filter((p): p is OrganizationArticlePost => p != null);
  const bySlot = new Map<number, OrganizationArticlePost>();
  for (const p of mapped) {
    bySlot.set(p.slot, p);
  }
  return Array.from(bySlot.values()).sort((a, b) => a.slot - b.slot);
}
