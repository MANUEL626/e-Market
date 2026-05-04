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
  getVisiblePostSlots,
  inferArticlePostMediaKind,
} from "@/lib/types/article-posts";
import { uploadOrganizationArticlePostMedia } from "@/lib/supabase/upload-organization-article-post";
import {
  getOrganizationArticlePostSignedUrl,
  removeOrganizationArticlePostFromStorage,
} from "@/lib/supabase/organization-article-post-url";

type ArticlePostsEditorProps = {
  articleId: string;
  orgId: string;
  articleActive: boolean;
};

export function ArticlePostsEditor({
  articleId,
  orgId,
  articleActive,
}: ArticlePostsEditorProps) {
  const [posts, setPosts] = useState<OrganizationArticlePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  /**
   * false = pas à pas (un emplacement vide à la fois après le dernier rempli).
   * true = afficher toujours les 3 blocs pour remplir dans l’ordre qu’on veut.
   */
  const [showAllSlots, setShowAllSlots] = useState(false);

  const refresh = useCallback(async () => {
    setLoadError(null);
    try {
      const list = await listArticlePosts(articleId);
      setPosts(list);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Impossible de charger les posts.");
      setPosts([]);
    }
  }, [articleId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const list = await listArticlePosts(articleId);
        if (cancelled) return;
        setPosts(list);
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

  const postBySlot = useMemo(() => {
    const m = new Map<number, OrganizationArticlePost>();
    posts.forEach((p) => m.set(p.slot, p));
    return m;
  }, [posts]);

  const incrementalSlots = useMemo(() => getVisiblePostSlots(posts), [posts]);
  const visibleSlots = useMemo(() => {
    if (showAllSlots) return getAllPostSlots();
    return incrementalSlots;
  }, [showAllSlots, incrementalSlots]);

  if (loading) {
    return (
      <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
          Chargement des posts…
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
          Réessayer
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
            <h2 className="text-lg font-bold text-gray-900">Posts vitrine</h2>
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
                {posts.length} sur 3 post{posts.length !== 1 ? "s" : ""} en ligne
              </span>
              <span className="hidden text-gray-300 sm:inline">·</span>
              {!showAllSlots ? (
                <>
                  <span className="text-gray-500 max-w-[520px]">
                    Mode progressif : seul l’emplacement 1 est proposé au départ ; le suivant s’affiche après
                    publication (vous pouvez aussi tout afficher).
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAllSlots(true)}
                    className="shrink-0 font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    Afficher les 3 emplacements
                  </button>
                </>
              ) : (
                <>
                  <span className="text-gray-500">
                    Les trois emplacements sont visibles — vous pouvez remplir n’importe quel slot (1 à 3).
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAllSlots(false)}
                    className="shrink-0 font-semibold text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    Mode progressif
                  </button>
                </>
              )}
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
                return [...rest, updated].sort((a, b) => a.slot - b.slot);
              });
            }}
            onDeleted={() => {
              setPosts((prev) => prev.filter((p) => p.slot !== slot));
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

  const showVideo =
    pendingFile != null
      ? pendingFile.type.startsWith("video/")
      : initialPost?.media_kind === "video";

  const displayUrl = pendingFile ? blobPreview : remoteSignedUrl;

  const pickFile = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    const isImage = f.type.startsWith("image/");
    const isVideo = f.type.startsWith("video/");
    if (!isImage && !isVideo) {
      setError("Choisissez une image ou une vidéo.");
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
        const oldPath = initialPost?.media_storage_path;
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
        if (oldPath && oldPath !== media_storage_path) {
          try {
            await removeOrganizationArticlePostFromStorage(oldPath);
          } catch {
            /* fichier précédent peut déjà être absent */
          }
        }
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
    const pathToRemove = initialPost.media_storage_path;
    try {
      await deleteArticlePost(articleId, slot);
      try {
        await removeOrganizationArticlePostFromStorage(pathToRemove);
      } catch {
        /* optionnel côté Storage */
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
            showVideo ? (
              <video
                src={displayUrl}
                className="h-full w-full object-cover"
                controls
                muted
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayUrl} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-gray-400">
              <ImageIcon className="h-8 w-8 opacity-60" />
              <span className="text-[11px] font-medium">Aucun média</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            id={`post-slot-${slot}-file`}
            onChange={(e) => pickFile(e.target.files)}
          />
          <label
            htmlFor={`post-slot-${slot}-file`}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            <Film className="h-3.5 w-3.5" />
            {hasContent ? "Remplacer le média" : "Choisir image ou vidéo"}
          </label>

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
