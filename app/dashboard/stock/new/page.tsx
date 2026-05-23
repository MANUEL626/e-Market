"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { createArticle } from "@/lib/api/emall-client";
import { getStoredOrganizationId } from "@/lib/organization-storage";
import { loadMemberProfileForSession } from "@/lib/api/member-me";
import { isAdminProfile } from "@/lib/authz";
import { AdminRequired } from "@/components/dashboard/admin-required";
import { uploadOrganizationArticleImage } from "@/lib/supabase/upload-organization-article-image";
import type { ArticleCategory, WholesalePriceTier } from "@/lib/types/article-orders";
import { ARTICLE_CATEGORY_OPTIONS } from "@/lib/dashboard/article-categories";
import {
  newWholesaleRow,
  parseWholesaleRowsToTiers,
  type WholesaleFormRow,
} from "@/lib/dashboard/article-wholesale-form";
import { validateContiguousWholesaleTiers } from "@/lib/validation/wholesale-tiers";

type LocalArticleImage = {
  id: string;
  file: File;
  preview: string;
};

export default function NewProductPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ArticleCategory>("other");
  const [description, setDescription] = useState("");
  const [unitSalePrice, setUnitSalePrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [alertQuantity, setAlertQuantity] = useState("0");
  const [active, setActive] = useState(true);
  /** Ordre = priorité : index 0 = image principale (obligatoire hors mock). */
  const [articleImages, setArticleImages] = useState<LocalArticleImage[]>([]);
  const articleImagesRef = useRef<LocalArticleImage[]>([]);
  articleImagesRef.current = articleImages;
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Une ligne vide par défaut pour rendre les paliers visibles (optionnel à remplir). */
  const [wholesaleRows, setWholesaleRows] = useState<WholesaleFormRow[]>([newWholesaleRow()]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await loadMemberProfileForSession();
        const allowed = isAdminProfile(profile);
        const id = getStoredOrganizationId();
        if (!cancelled) {
          setIsAdmin(allowed);
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
    return () => {
      articleImagesRef.current.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, []);

  const appendArticleImages = useCallback((fileList: FileList | null) => {
    if (!fileList?.length) return;
    const accepted = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!accepted.length) return;
    setArticleImages((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }, []);

  const removeArticleImage = useCallback((id: string) => {
    setArticleImages((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const promoteToPrimary = useCallback((id: string) => {
    setArticleImages((prev) => {
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
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Indiquez un nom d’article.");
      return;
    }
    if (!orgId) {
      setError("Organisation introuvable. Reconnectez-vous ou rechargez la page.");
      return;
    }
    if (articleImages.length === 0) {
      setError("Ajoutez au moins une image (la première sert d’image principale).");
      return;
    }

    const price = parseNonNegativeNumber(unitSalePrice, NaN);
    if (Number.isNaN(price)) {
      setError("Prix de vente invalide.");
      return;
    }

    const stock = parseIntNonNegative(stockQuantity, 0);
    const alert = parseIntNonNegative(alertQuantity, 0);

    let wholesale_prices: WholesalePriceTier[] | undefined;
    try {
      const raw = parseWholesaleRowsToTiers(wholesaleRows);
      wholesale_prices = raw
        ? validateContiguousWholesaleTiers(raw)
        : undefined;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Paliers invalides.");
      return;
    }

    setSubmitting(true);
    try {
      let primaryPath: string;
      const additionalPaths: string[] = [];

      const [first, ...rest] = articleImages;
      primaryPath = await uploadOrganizationArticleImage(orgId, first.file);
      for (const item of rest) {
        additionalPaths.push(await uploadOrganizationArticleImage(orgId, item.file));
      }

      const created = await createArticle({
        name: trimmedName,
        category,
        unit_sale_price: price,
        ...(wholesale_prices ? { wholesale_prices } : {}),
        stock_quantity: stock,
        alert_quantity: alert,
        description: description.trim() || null,
        primary_image_storage_path: primaryPath,
        additional_image_storage_paths: additionalPaths,
        active,
      });

      router.push(`/dashboard/stock/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  if (accessLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Verification des droits...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AdminRequired description="Seul un administrateur peut ajouter un article au stock." />
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
            <span className="text-gray-900 font-medium">Nouvel article</span>
          </nav>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Ajouter un article
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-xl">
            Création via l’API e-Mall : image(s) dans Supabase Storage (
            <code className="text-xs bg-gray-100 px-1 rounded">organization-articles</code>
            ), puis <code className="text-xs bg-gray-100 px-1 rounded">POST …/articles</code>.
          </p>
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
            form="new-article-form"
            disabled={submitting || !orgId}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#3730A3] hover:bg-[#2e2889] disabled:opacity-60 text-white text-sm font-semibold rounded-full transition shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              "Enregistrer l’article"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {!orgId && (
        <p className="mb-6 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
          Chargement de l’organisation… Si le message persiste, ouvrez une session membre et
          rechargez le tableau de bord.
        </p>
      )}

      <form id="new-article-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Informations</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="article-name" className="block text-sm text-gray-700 mb-2">
                    Nom de l’article <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="article-name"
                    type="text"
                    required
                    maxLength={500}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex. Casque audio"
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
                <div>
                  <label htmlFor="article-desc" className="block text-sm text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="article-desc"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Détails, caractéristiques…"
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between gap-4 mb-2">
                <h2 className="text-lg font-bold text-gray-900">Médias</h2>
                <span className="text-xs text-gray-400 hidden sm:inline">
                  Plusieurs fichiers possibles ·{" "}
                  <span className="text-rose-600 font-semibold">1 image min.</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-6">
                La <strong>première</strong> vignette est l’image principale (
                <code className="bg-gray-100 px-1 rounded text-[11px]">primary_image_storage_path</code>
                ). Les suivantes sont des images additionnelles. Chemin Storage :{" "}
                <strong>{orgId ?? "…"}</strong>/fichier.
              </p>

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                id="article-gallery-input"
                onChange={(e) => appendArticleImages(e.target.files)}
              />

              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                {articleImages.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative shrink-0 w-[120px] h-[120px] rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm snap-start group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- aperçu blob local */}
                    <img
                      src={item.preview}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#3730A3] text-white text-[10px] font-bold uppercase tracking-wide shadow">
                        Principale
                      </span>
                    )}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => promoteToPrimary(item.id)}
                        className="absolute bottom-2 left-2 right-2 py-1 rounded-md bg-white/95 text-[9px] font-bold text-indigo-700 shadow border border-indigo-100 hover:bg-indigo-50 leading-tight"
                        title={item.file.name}
                      >
                        Couverture
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeArticleImage(item.id)}
                      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-black/55 text-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 opacity-100 transition hover:bg-black/75"
                      aria-label={`Retirer ${item.file.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <label
                  htmlFor="article-gallery-input"
                  className="shrink-0 flex flex-col items-center justify-center gap-2 w-[120px] h-[120px] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:border-indigo-200 hover:text-indigo-600 cursor-pointer transition snap-start"
                >
                  <ImageIcon className="w-7 h-7" />
                  <span className="text-xs font-semibold">Ajouter</span>
                </label>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Stock</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="stock-qty" className="block text-sm text-gray-700 mb-2">
                    Quantité en stock
                  </label>
                  <input
                    id="stock-qty"
                    type="number"
                    min={0}
                    step={1}
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
                <div>
                  <label htmlFor="alert-qty" className="block text-sm text-gray-700 mb-2">
                    Seuil d’alerte (stock bas)
                  </label>
                  <input
                    id="alert-qty"
                    type="number"
                    min={0}
                    step={1}
                    value={alertQuantity}
                    onChange={(e) => setAlertQuantity(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Le statut <code className="bg-gray-100 px-1 rounded">stock_status</code> est calculé
                côté API (in_stock / low_stock / out_of_stock).
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Prix &amp; catégorie</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="unit-price" className="block text-sm text-gray-700 mb-2">
                    Prix de vente unitaire <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="unit-price"
                    type="text"
                    inputMode="decimal"
                    required
                    value={unitSalePrice}
                    onChange={(e) => setUnitSalePrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm font-semibold focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        Prix de vente en lot (gros)
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Optionnel. Le premier palier commence à <strong>1</strong> ; chaque palier se termine juste avant le
                        suivant (ex. 1–15 puis 16–25). Pas de trou ni de chevauchement. Avec <strong>plusieurs</strong>{" "}
                        paliers, seul le <strong>dernier</strong> peut avoir une quantité max. vide (sans plafond).
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
                          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Qté min. <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={row.minQty}
                            onChange={(e) => updateWholesaleRow(row.id, { minQty: e.target.value })}
                            placeholder="ex. 10"
                            className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Qté max.
                          </label>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={row.maxQty}
                            onChange={(e) => updateWholesaleRow(row.id, { maxQty: e.target.value })}
                            placeholder="vide = sans plafond"
                            className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Prix unitaire <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={row.unitPrice}
                            onChange={(e) => updateWholesaleRow(row.id, { unitPrice: e.target.value })}
                            placeholder="ex. 9,50"
                            className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex justify-end sm:justify-center pb-0.5">
                          <button
                            type="button"
                            onClick={() => removeWholesaleRow(row.id)}
                            title={
                              wholesaleRows.length <= 1
                                ? "Effacer la ligne"
                                : "Supprimer ce palier"
                            }
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-3">
                    Laissez une ligne entièrement vide pour ne pas l’envoyer. Avec un seul palier, la quantité max. est
                    optionnelle ; à partir de deux paliers, seul le dernier peut être sans max. (illimité).
                  </p>
                </div>

                <div>
                  <label htmlFor="article-category" className="block text-sm text-gray-700 mb-2">
                    Catégorie <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="article-category"
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
                  <span className="text-sm text-gray-700">Article actif (visible dans le catalogue)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
