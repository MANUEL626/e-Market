"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Film, ImageIcon, Loader2, Megaphone, Trash2 } from "lucide-react";
import {
  deleteArticlePost,
  listArticlePosts,
  upsertArticlePost,
} from "@/lib/api/emall-client";
import type { OrganizationArticlePost } from "@/lib/types/article-posts";
import { ARTICLE_POST_CAPTION_MAX, assertCaptionWithinLimit } from "@/lib/article-posts/utils";
import {
  getAllPostSlots,
  inferArticlePostMediaKind,
} from "@/lib/types/article-posts";
import { uploadOrganizationArticlePostMedia } from "@/lib/supabase/upload-organization-article-post";
import {
  getOrganizationArticlePostSignedUrl,
  removeOrganizationArticlePostFromStorage,
} from "@/lib/supabase/organization-article-post-url";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { translate } from "@/lib/i18n";
import { getBusinessCache, setBusinessCache } from "@/lib/realtime/business-cache";
import { subscribeToArticlePosts } from "@/lib/realtime/business-realtime";

const postsCacheKey = (articleId: string) => `article-posts:${articleId}`;

type ArticlePostsEditorProps = {
  articleId: string;
  orgId: string;
  articleActive: boolean;
};

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/x-m4v"]);
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;

function isVideoProcessing(post: OrganizationArticlePost): boolean {
  return (
    post.media_kind === "video" &&
    (post.processing_status === "pending" || post.processing_status === "processing")
  );
}

export function ArticlePostsEditor({
  articleId,
  orgId,
  articleActive,
}: ArticlePostsEditorProps) {
  const { profile } = useMemberProfile();
  const t = (key: string) => translate(profile?.params?.locale, key);
  const [posts, setPosts] = useState<OrganizationArticlePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoadError(null);
    try {
      const list = await listArticlePosts(articleId);
      setPosts(list);
      setBusinessCache(postsCacheKey(articleId), list);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Impossible de charger les posts.");
      setPosts([]);
    }
  }, [articleId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = getBusinessCache<OrganizationArticlePost[]>(postsCacheKey(articleId));
      if (cached) {
        setPosts(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }
      setLoadError(null);
      try {
        const list = await listArticlePosts(articleId);
        if (cancelled) return;
        setPosts(list);
        setBusinessCache(postsCacheKey(articleId), list);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Impossible de charger les posts.");
          setPosts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  useEffect(() => {
    return subscribeToArticlePosts<OrganizationArticlePost>(articleId, (payload) => {
      setPosts((current) => {
        let next = current;
        if (payload.eventType === "DELETE") {
          const oldId = String(payload.old.id ?? "");
          const oldSlot = Number(payload.old.slot ?? 0);
          next = current.filter((post) =>
            oldId ? post.id !== oldId : post.slot !== oldSlot
          );
        } else {
          const incoming = payload.new as OrganizationArticlePost;
          const exists = current.some((post) => post.id === incoming.id || post.slot === incoming.slot);
          next = exists
            ? current.map((post) =>
                post.id === incoming.id || post.slot === incoming.slot ? incoming : post
              )
            : [...current, incoming];
          next = next.sort((a, b) => a.slot - b.slot);
        }
        setBusinessCache(postsCacheKey(articleId), next);
        return next;
      });
    });
  }, [articleId]);

  const postBySlot = useMemo(() => {
    const m = new Map<number, OrganizationArticlePost>();
    posts.forEach((p) => m.set(p.slot, p));
    return m;
  }, [posts]);

  const visibleSlots = useMemo(() => getAllPostSlots(), []);

  useEffect(() => {
    if (!posts.some(isVideoProcessing)) return;
    const interval = window.setInterval(() => {
      void refresh();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [posts, refresh]);

  if (loading) {
    return (
      <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
          {t("loadingPosts")}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-rose-800">
        <p>{loadError}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-2 text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline"
        >
          {t("refresh")}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="shrink-0 rounded-xl bg-indigo-50 p-2 text-indigo-700">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t("postsShowcase")}</h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Optionnel — jusqu’à trois médias pour mettre en avant ce produit. Un article{" "}
              <span className="font-semibold text-gray-700">actif</span> est requis pour la vitrine
              clients.
              {!articleActive && (
                <span className="font-medium text-amber-700">
                  {" "}
                  Ici l’article est inactif : les visiteurs ne verront pas ces posts.
                </span>
              )}
            </p>
            <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3 text-xs text-gray-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
              <span className="font-medium text-gray-700">
                {posts.length} / 3 {t("postsShowcase")}
              </span>
              <span className="hidden text-gray-300 sm:inline">·</span>
              <span className="text-gray-500">
                Les trois emplacements sont visibles pour remplir les slots 1 à 3.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {visibleSlots.map((slot) => (
          <PostSlotCard
            key={slot}
            slot={slot}
            orgId={orgId}
            articleId={articleId}
            initialPost={postBySlot.get(slot) ?? null}
            onSaved={(updated) => {
              setPosts((prev) => {
                const rest = prev.filter((p) => p.slot !== slot);
                const next = [...rest, updated].sort((a, b) => a.slot - b.slot);
                setBusinessCache(postsCacheKey(articleId), next);
                return next;
              });
            }}
            onDeleted={() => {
              setPosts((prev) => {
                const next = prev.filter((p) => p.slot !== slot);
                setBusinessCache(postsCacheKey(articleId), next);
                return next;
              });
            }}
            onRefreshList={refresh}
          />
        ))}
      </div>
    </div>
  );
}

type PostSlotCardProps = {
  slot: number;
  orgId: string;
  articleId: string;
  initialPost: OrganizationArticlePost | null;
  onSaved: (post: OrganizationArticlePost) => void;
  onDeleted: () => void;
  onRefreshList: () => Promise<void>;
};

function PostSlotCard({
  slot,
  orgId,
  articleId,
  initialPost,
  onSaved,
  onDeleted,
  onRefreshList,
}: PostSlotCardProps) {
  const [caption, setCaption] = useState(initialPost?.caption ?? "");
  const [active, setActive] = useState(initialPost?.active ?? true);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [blobPreview, setBlobPreview] = useState<string | null>(null);
  const [remoteSignedUrl, setRemoteSignedUrl] = useState<string | null>(null);
  const [thumbnailSignedUrl, setThumbnailSignedUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCaption(initialPost?.caption ?? "");
    setActive(initialPost?.active ?? true);
    setError(null);
    setPendingFile(null);
    setBlobPreview(null);
  }, [initialPost?.id, initialPost?.updated_at, initialPost?.media_storage_path]);

  useEffect(() => {
    return () => {
      if (blobPreview) URL.revokeObjectURL(blobPreview);
    };
  }, [blobPreview]);

  useEffect(() => {
    let cancelled = false;
    const path = initialPost?.media_storage_path;
    if (!path) {
      setRemoteSignedUrl(null);
      return;
    }
    getOrganizationArticlePostSignedUrl(path).then((url) => {
      if (!cancelled) setRemoteSignedUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [initialPost?.media_storage_path]);

  useEffect(() => {
    let cancelled = false;
    const path = initialPost?.thumbnail_storage_path;
    if (!path) {
      setThumbnailSignedUrl(null);
      return;
    }
    getOrganizationArticlePostSignedUrl(path).then((url) => {
      if (!cancelled) setThumbnailSignedUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [initialPost?.thumbnail_storage_path]);

  const showVideo =
    pendingFile != null
      ? pendingFile.type.startsWith("video/")
      : initialPost?.media_kind === "video";

  const processingStatus =
    initialPost?.processing_status ?? (initialPost?.media_kind === "video" ? "ready" : "ready");
  const videoIsProcessing =
    initialPost?.media_kind === "video" &&
    (processingStatus === "pending" || processingStatus === "processing");
  const videoHasFailed = initialPost?.media_kind === "video" && processingStatus === "failed";
  const videoFailureMessage =
    initialPost?.processing_error?.trim() ||
    "La vidéo n'a pas pu être préparée. Remplacez-la par un autre fichier.";
  const displayUrl = pendingFile
    ? blobPreview
    : videoIsProcessing
      ? thumbnailSignedUrl
      : videoHasFailed
        ? thumbnailSignedUrl
        : remoteSignedUrl;

  const pickFile = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    const isImage = f.type.startsWith("image/");
    const isVideo = f.type.startsWith("video/");
    if (isImage && !IMAGE_TYPES.has(f.type)) {
      setError("Format image non accepté. Utilisez JPG, PNG ou WebP.");
      return;
    }
    if (isVideo && !VIDEO_TYPES.has(f.type)) {
      setError("Format vidéo non accepté. Utilisez MP4, MOV ou M4V.");
      return;
    }
    if (!isImage && !isVideo) {
      setError("Choisissez une image ou une vidéo.");
      return;
    }
    if (isImage && f.size > IMAGE_MAX_BYTES) {
      setError("Image trop lourde : maximum 10 MB.");
      return;
    }
    if (isVideo && f.size > VIDEO_MAX_BYTES) {
      setError("Vidéo trop lourde : maximum 100 MB.");
      return;
    }
    setError(null);
    if (blobPreview) URL.revokeObjectURL(blobPreview);
    setPendingFile(f);
    setBlobPreview(URL.createObjectURL(f));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function handleSave() {
    setError(null);
    const trimmed = caption.trim();
    try {
      assertCaptionWithinLimit(trimmed.length > 0 ? trimmed : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Légende invalide.");
      return;
    }

    if (!initialPost && !pendingFile) {
      setError("Sélectionnez un fichier image ou vidéo.");
      return;
    }

    setBusy(true);
    try {
      if (pendingFile) {
        const media_kind = inferArticlePostMediaKind(pendingFile);
        const media_storage_path = await uploadOrganizationArticlePostMedia(
          orgId,
          articleId,
          slot,
          pendingFile
        );
        const saved = await upsertArticlePost(articleId, slot, {
          media_kind,
          media_storage_path,
          caption: trimmed || null,
          active,
        });
        if (blobPreview) URL.revokeObjectURL(blobPreview);
        setPendingFile(null);
        setBlobPreview(null);
        onSaved(saved);
        return;
      }

      if (!initialPost) return;

      const saved = await upsertArticlePost(articleId, slot, {
        media_kind: initialPost.media_kind,
        media_storage_path: initialPost.media_storage_path,
        caption: trimmed || null,
        active,
      });
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!initialPost) {
      if (blobPreview) URL.revokeObjectURL(blobPreview);
      setPendingFile(null);
      setBlobPreview(null);
      setCaption("");
      setActive(true);
      return;
    }
    setError(null);
    setBusy(true);
    const pathsToRemove = [
      initialPost.media_storage_path,
      initialPost.original_media_storage_path,
      initialPost.thumbnail_storage_path,
    ].filter((path): path is string => Boolean(path));
    try {
      await deleteArticlePost(articleId, slot);
      for (const pathToRemove of Array.from(new Set(pathsToRemove))) {
        try {
          await removeOrganizationArticlePostFromStorage(pathToRemove);
        } catch {
          /* optionnel côté Storage */
        }
      }
      if (blobPreview) URL.revokeObjectURL(blobPreview);
      setPendingFile(null);
      setBlobPreview(null);
      setCaption("");
      setActive(true);
      onDeleted();
      await onRefreshList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
    } finally {
      setBusy(false);
    }
  }

  const hasContent = Boolean(initialPost || pendingFile);

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">
          Emplacement {slot}
        </span>
        {initialPost && !initialPost.active && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            Masqué côté clients
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-200 sm:aspect-[4/3] sm:w-[200px]">
          {displayUrl ? (
            showVideo && !videoIsProcessing && !videoHasFailed ? (
              <video
                src={displayUrl}
                className="h-full w-full object-cover"
                controls
                muted
                playsInline
              />
            ) : !videoHasFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-rose-700">
                <Film className="h-8 w-8 opacity-70" />
                <span className="text-[11px] font-semibold">Vidéo indisponible</span>
              </div>
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-gray-400">
              <ImageIcon className="h-8 w-8 opacity-60" />
              <span className="text-[11px] font-medium">Aucun média</span>
            </div>
          )}
          {videoIsProcessing && (
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gray-950/75 px-3 py-2 text-[11px] font-semibold text-white">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Vidéo en préparation mobile
            </div>
          )}
          {videoHasFailed && (
            <div className="absolute inset-x-0 bottom-0 bg-rose-700/90 px-3 py-2 text-[11px] font-semibold text-white">
              Traitement vidéo échoué
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/x-m4v"
            className="hidden"
            onChange={(e) => pickFile(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Film className="h-3.5 w-3.5" />
            {hasContent ? "Remplacer le média" : "Choisir image ou vidéo"}
          </button>

          <div>
            <label
              htmlFor={`post-slot-${slot}-caption`}
              className="mb-1 block text-[11px] font-semibold text-gray-500"
            >
              Légende (optionnel)
            </label>
            <textarea
              id={`post-slot-${slot}-caption`}
              rows={3}
              maxLength={ARTICLE_POST_CAPTION_MAX}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ex. Nouveauté, promo limitée…"
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <p className="mt-1 text-[10px] text-gray-400">
              {caption.length}/{ARTICLE_POST_CAPTION_MAX}
            </p>
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Visible sur la vitrine clients</span>
          </label>

          {videoIsProcessing && (
            <p className="text-xs font-medium text-amber-700">
              Votre vidéo est en cours de préparation pour mobile.
            </p>
          )}
          {videoHasFailed && (
            <p className="text-xs font-medium text-rose-700">
              {videoFailureMessage}
            </p>
          )}

          {error && (
            <p className="text-sm text-rose-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={busy || (!initialPost && !pendingFile)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3730A3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2e2889] disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {initialPost ? "Mettre à jour" : "Publier"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy || (!initialPost && !pendingFile)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-rose-200 hover:text-rose-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {initialPost ? "Supprimer" : "Effacer le brouillon"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
