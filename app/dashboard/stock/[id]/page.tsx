"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { getArticle, updateArticle } from "@/lib/api/emall-client";
import { ARTICLE_CATEGORY_OPTIONS } from "@/lib/dashboard/article-categories";
import {
  newWholesaleRow,
  parseWholesaleRowsToTiers,
  wholesaleTiersToRows,
  type WholesaleFormRow,
} from "@/lib/dashboard/article-wholesale-form";
import { getStoredOrganizationId } from "@/lib/organization-storage";
import { loadMemberProfileForSession } from "@/lib/api/member-me";
import { isAdminProfile } from "@/lib/authz";
import { AdminRequired } from "@/components/dashboard/admin-required";
import { uploadOrganizationArticleImage } from "@/lib/supabase/upload-organization-article-image";
import { getOrganizationArticleSignedUrl } from "@/lib/supabase/organization-article-image-url";
import type { ArticleCategory, WholesalePriceTier } from "@/lib/types/article-orders";
import { validateContiguousWholesaleTiers } from "@/lib/validation/wholesale-tiers";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { translate } from "@/lib/i18n";

type GalleryRemote = {
  id: string;
  type: "remote";
  path: string;
  displayUrl: string | null;
};
type GalleryLocal = {
  id: string;
  type: "local";
  file: File;
  preview: string;
};
type GalleryItem = GalleryRemote | GalleryLocal;

export default function ProductInfoEditPage() {
  const { profile } = useMemberProfile();
  const t = (key: string) => translate(profile?.params?.locale, key);
  const params = useParams();
  const router = useRouter();
  const articleId = typeof params.id === "string" ? params.id : "";

  const [orgId, setOrgId] = useState<string | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ArticleCategory>("other");
  const [description, setDescription] = useState("");
  const [unitSalePrice, setUnitSalePrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [alertQuantity, setAlertQuantity] = useState("0");
  const [active, setActive] = useState(true);
  const [wholesaleRows, setWholesaleRows] = useState<WholesaleFormRow[]>([newWholesaleRow()]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const galleryRef = useRef<GalleryItem[]>([]);
  galleryRef.current = gallery;

  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      galleryRef.current.forEach((item) => {
        if (item.type === "local") URL.revokeObjectURL(item.preview);
      });
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await loadMemberProfileForSession();
        const id = getStoredOrganizationId();
        if (!cancelled) {
          setIsAdmin(isAdminProfile(profile));
          setOrgId(id);
          setAccessLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setAccessLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!articleId || accessLoading || !isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const a = await getArticle(articleId);
        if (cancelled) return;
        setName(a.name ?? "");
        setCategory((a.category as ArticleCategory) ?? "other");
        setDescription(a.description ?? "");
        setUnitSalePrice(
          a.unit_sale_price != null && !Number.isNaN(a.unit_sale_price)
            ? String(a.unit_sale_price)
            : ""
        );
        setStockQuantity(String(a.stock_quantity ?? 0));
        setAlertQuantity(String(a.alert_quantity ?? 0));
        setActive(a.active !== false);
        setWholesaleRows(wholesaleTiersToRows(a.wholesale_prices));

        const paths = [
          a.primary_image_storage_path,
          ...((a.additional_image_storage_paths as string[] | null) ?? []),
        ].filter((p): p is string => Boolean(p));

        if (!paths.length) {
          setGallery([]);
        } else {
          const urls = await Promise.all(
            paths.map((p) => getOrganizationArticleSignedUrl(p))
          );
          if (cancelled) return;
          setGallery(
            paths.map((path, i) => ({
              id: crypto.randomUUID(),
              type: "remote" as const,
              path,
              displayUrl: urls[i] ?? null,
            }))
          );
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Article introuvable");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessLoading, articleId, isAdmin]);

  const appendLocals = useCallback((fileList: FileList | null) => {
    if (!fileList?.length) return;
    const accepted = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!accepted.length) return;
    setGallery((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        id: crypto.randomUUID(),
        type: "local" as const,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }, []);

  const removeGalleryItem = useCallback((id: string) => {
    setGallery((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item?.type === "local") URL.revokeObjectURL(item.preview);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const promoteGalleryItem = useCallback((id: string) => {
    setGallery((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      return [item, ...next];
    });
  }, []);

  const parseNonNegativeNumber = (raw: string, fallback: number) => {
    const n = Number.parseFloat(String(raw).replace(",", "."));
    if (Number.isNaN(n) || n < 0) return fallback;
    return n;
  };

  const parseIntNonNegative = (raw: string, fallback: number) => {
    const n = Number.parseInt(String(raw).replace(/\s/g, ""), 10);
    if (Number.isNaN(n) || n < 0) return fallback;
    return n;
  };

  function addWholesaleRow() {
    setWholesaleRows((r) => [...r, newWholesaleRow()]);
  }

  function removeWholesaleRow(id: string) {
    setWholesaleRows((r) => {
      if (r.length <= 1) return [newWholesaleRow()];
      return r.filter((x) => x.id !== id);
    });
  }

  function updateWholesaleRow(id: string, patch: Partial<Omit<WholesaleFormRow, "id">>) {
    setWholesaleRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setSaveError("Indiquez un nom d’article.");
      return;
    }
    if (!orgId) {
      setSaveError("Organisation introuvable.");
      return;
    }
    if (gallery.length === 0) {
      setSaveError("Ajoutez au moins une image (la première est la couverture).");
      return;
    }

    const price = parseNonNegativeNumber(unitSalePrice, NaN);
    if (Number.isNaN(price)) {
      setSaveError("Prix de vente invalide.");
      return;
    }
    const stock = parseIntNonNegative(stockQuantity, 0);
    const alert = parseIntNonNegative(alertQuantity, 0);

    let wholesale_prices: WholesalePriceTier[] | null;
    try {
      const raw = parseWholesaleRowsToTiers(wholesaleRows);
      wholesale_prices = raw ? validateContiguousWholesaleTiers(raw) : null;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Paliers invalides.");
      return;
    }

    setSubmitting(true);
    try {
      const pathsOrdered: string[] = [];
      for (const item of gallery) {
        if (item.type === "remote") {
          pathsOrdered.push(item.path);
        } else {
          pathsOrdered.push(await uploadOrganizationArticleImage(orgId, item.file));
        }
      }

      await updateArticle(articleId, {
        name: trimmedName,
        category,
        unit_sale_price: price,
        wholesale_prices,
        stock_quantity: stock,
        alert_quantity: alert,
        description: description.trim() || null,
        primary_image_storage_path: pathsOrdered[0],
        additional_image_storage_paths: pathsOrdered.slice(1),
        active,
      });

      router.refresh();
      router.push("/dashboard/stock");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!articleId) {
    return (
      <div className="max-w-[1200px] mx-auto pb-12 text-rose-600 text-sm">
        Identifiant d’article manquant.
      </div>
    );
  }

  if (accessLoading) {
    return (
      <div className="max-w-[1200px] mx-auto pb-12 flex items-center justify-center gap-2 text-gray-500 py-24">
        <Loader2 className="w-6 h-6 animate-spin" />
        Verification des droits...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AdminRequired description="Seul un administrateur peut modifier un article du stock." />
    );
  }

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto pb-12 flex items-center justify-center gap-2 text-gray-500 py-24">
        <Loader2 className="w-6 h-6 animate-spin" />
        Chargement de l’article…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-[1200px] mx-auto pb-12 space-y-4">
        <p className="text-rose-600 text-sm">{loadError}</p>
        <Link
          href="/dashboard/stock"
          className="inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← Retour au stock
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/stock" className="hover:text-gray-900 transition">
              Stock
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium truncate max-w-[240px]">{name}</span>
          </nav>
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{name}</h1>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full ${
                active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {active ? "Actif" : "Inactif"}
            </span>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-2">{articleId}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/stock"
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-full transition shadow-sm"
          >
            Annuler
          </Link>
          <button
            type="submit"
            form="edit-article-form"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#3730A3] hover:bg-[#2e2889] disabled:opacity-60 text-white text-sm font-semibold rounded-full transition shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              "Enregistrer"
            )}
          </button>
        </div>
      </div>

      {saveError && (
        <div
          className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {saveError}
        </div>
      )}

      <form id="edit-article-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Informations</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="edit-name" className="block text-sm text-gray-700 mb-2">
                    Nom <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="edit-name"
                    required
                    maxLength={500}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
                <div>
                  <label htmlFor="edit-desc" className="block text-sm text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="edit-desc"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Médias</h2>
              <p className="text-xs text-gray-500 mb-6">
                Première image = couverture. Vous pouvez conserver les fichiers déjà en ligne, en ajouter
                de nouveaux ou réordonner.
              </p>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                id="edit-gallery-input"
                onChange={(e) => appendLocals(e.target.files)}
              />
              <div className="flex gap-4 overflow-x-auto pb-2">
                {gallery.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative shrink-0 w-[120px] h-[120px] rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm group"
                  >
                    {item.type === "local" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.preview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : item.displayUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.displayUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500 p-2 text-center bg-gray-200">
                        Aperçu indisponible
                      </div>
                    )}
                    {index === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#3730A3] text-white text-[10px] font-bold uppercase shadow">
                        Principale
                      </span>
                    )}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => promoteGalleryItem(item.id)}
                        className="absolute bottom-2 left-2 right-2 py-1 rounded-md bg-white/95 text-[9px] font-bold text-indigo-700 shadow border border-indigo-100"
                      >
                        Couverture
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(item.id)}
                      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-black/55 text-white sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition"
                      aria-label="Retirer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <label
                  htmlFor="edit-gallery-input"
                  className="shrink-0 flex flex-col items-center justify-center gap-2 w-[120px] h-[120px] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 hover:border-indigo-200 hover:text-indigo-600 cursor-pointer"
                >
                  <ImageIcon className="w-7 h-7" />
                  <span className="text-xs font-semibold">Ajouter</span>
                </label>
              </div>
            </div>

            <div className="rounded-[24px] border border-dashed border-indigo-200 bg-indigo-50/40 p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 rounded-xl bg-white p-2 text-indigo-700 shadow-sm">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{t("postsShowcase")}</h2>
                    <p className="mt-1 text-xs text-gray-600">
                      Gérez les contenus promotionnels (jusqu’à 3 par article) sur une page dédiée pour une
                      vue d’ensemble de tous les articles.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/stock/posts/${articleId}`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#3730A3] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2e2889]"
                >
                  <Megaphone className="h-4 w-4" />
                  Ouvrir l’éditeur de posts
                </Link>
              </div>
              <p className="mt-4 text-[11px] text-gray-500">
                <Link href="/dashboard/stock/posts" className="font-semibold text-indigo-700 hover:underline">
                  Voir tous les articles
                </Link>{" "}
                — compteurs et accès rapide par produit.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Stock</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="edit-stock" className="block text-sm text-gray-700 mb-2">
                    Quantité
                  </label>
                  <input
                    id="edit-stock"
                    type="number"
                    min={0}
                    step={1}
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
                <div>
                  <label htmlFor="edit-alert" className="block text-sm text-gray-700 mb-2">
                    Seuil d’alerte
                  </label>
                  <input
                    id="edit-alert"
                    type="number"
                    min={0}
                    step={1}
                    value={alertQuantity}
                    onChange={(e) => setAlertQuantity(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Prix &amp; catégorie</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="edit-price" className="block text-sm text-gray-700 mb-2">
                    Prix unitaire <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="edit-price"
                    type="text"
                    inputMode="decimal"
                    required
                    value={unitSalePrice}
                    onChange={(e) => setUnitSalePrice(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm font-semibold focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
                <div>
                  <label htmlFor="edit-cat" className="block text-sm text-gray-700 mb-2">
                    Catégorie <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="edit-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ArticleCategory)}
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                  >
                    {ARTICLE_CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Article actif</span>
                </label>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Prix de vente en lot</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Premier palier à 1, enchaînement sans trou ; dernier sans max. si plusieurs paliers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addWholesaleRow}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Palier
                </button>
              </div>
              <div className="space-y-3">
                {wholesaleRows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end p-3 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1.5">
                        Qté min.
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={row.minQty}
                        onChange={(e) => updateWholesaleRow(row.id, { minQty: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1.5">
                        Qté max.
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={row.maxQty}
                        onChange={(e) => updateWholesaleRow(row.id, { maxQty: e.target.value })}
                        placeholder="vide = sans plafond"
                        className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1.5">
                        Prix unit.
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.unitPrice}
                        onChange={(e) => updateWholesaleRow(row.id, { unitPrice: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeWholesaleRow(row.id)}
                      className="p-2 text-gray-400 hover:text-rose-600 rounded-lg justify-self-end"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
