"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Loader2, Info, Package } from "lucide-react";
import { createArticleOrder, listArticles } from "@/lib/api/emall-client";
import { getPrimaryMembership } from "@/lib/api/member-me";
import {
  AdminGate,
  SalesOrganizationGate,
} from "@/components/dashboard/dashboard-access-provider";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { getEffectiveOrganizationId } from "@/lib/organization-resolve";
import type { OrganizationArticle } from "@/lib/types/article-orders";
import {
  API_CURRENCY_OPTIONS,
  DEFAULT_PURCHASE_CURRENCY,
  formatMoney,
  normalizeApiCurrency,
  type ApiCurrencyCode,
} from "@/lib/currencies";

type LineDraft = { article_id: string; quantity_ordered: number; total_price: string };

export default function NewOrderPage() {
  return (
    <SalesOrganizationGate description="Les commandes fournisseur sont disponibles uniquement pour les organisations de vente.">
      <AdminGate description="Seul un administrateur peut creer une commande fournisseur.">
        <NewOrderContent />
      </AdminGate>
    </SalesOrganizationGate>
  );
}

function NewOrderContent() {
  const router = useRouter();
  const { profile } = useMemberProfile();
  const [articles, setArticles] = useState<OrganizationArticle[]>([]);
  const [note, setNote] = useState("");
  const [currency, setCurrency] = useState<ApiCurrencyCode | "">("");
  const [defaultPurchaseCurrency, setDefaultPurchaseCurrency] =
    useState<ApiCurrencyCode>(DEFAULT_PURCHASE_CURRENCY);
  const [lines, setLines] = useState<LineDraft[]>([
    { article_id: "", quantity_ordered: 1, total_price: "" },
  ]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const organizationId = getEffectiveOrganizationId();
        const org = profile ? getPrimaryMembership(profile)?.organization : undefined;
        const resolvedDefaultPurchaseCurrency = normalizeApiCurrency(
          org?.default_currencies?.purchase,
          DEFAULT_PURCHASE_CURRENCY
        );
        if (!cancelled) {
          setDefaultPurchaseCurrency(resolvedDefaultPurchaseCurrency);
        }
        if (!organizationId) {
          if (!cancelled) setLoading(false);
          return;
        }
        const list = await listArticles(true);
        if (!cancelled) setArticles(list);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Impossible de charger les articles");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const addLine = () => {
    setLines((prev) => [...prev, { article_id: "", quantity_ordered: 1, total_price: "" }]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const parseNonNegativeAmount = (raw: string) => {
    const amount = Number.parseFloat(raw.replace(/\s/g, "").replace(",", "."));
    return Number.isNaN(amount) || amount < 0 ? NaN : amount;
  };

  const selectedCurrency = currency || defaultPurchaseCurrency;
  const orderTotal = lines.reduce((sum, line) => {
    const amount = parseNonNegativeAmount(line.total_price);
    return Number.isNaN(amount) ? sum : sum + amount;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!getEffectiveOrganizationId()) {
      setError("ID d’organisation manquant.");
      return;
    }
    const cleaned = lines
      .filter((l) => l.article_id)
      .map((l) => ({
        article_id: l.article_id,
        quantity_ordered: Math.max(1, Math.floor(Number(l.quantity_ordered)) || 1),
        total_price: parseNonNegativeAmount(l.total_price),
      }));
    if (cleaned.length === 0) {
      setError("Ajoutez au moins une ligne avec un article sélectionné.");
      return;
    }
    if (cleaned.some((l) => Number.isNaN(l.total_price))) {
      setError("Indiquez un prix total fournisseur valide pour chaque ligne.");
      return;
    }
    const ids = new Set(cleaned.map((l) => l.article_id));
    if (ids.size !== cleaned.length) {
      setError("Supprimez les doublons : un article ne peut apparaître qu’une fois.");
      return;
    }
    setSubmitting(true);
    try {
      const order = await createArticleOrder({
        note: note.trim() || null,
        ...(currency ? { currency } : {}),
        lines: cleaned,
      });
      router.push(`/dashboard/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la création");
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && !getEffectiveOrganizationId()) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm">
          ID d’organisation introuvable. Connectez-vous en tant que membre d’une organisation (voir profil).
        </p>
        <Link href="/dashboard/orders" className="inline-block mt-4 text-indigo-600 font-semibold">
          ← Retour aux commandes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 mb-8 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la liste
      </Link>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Nouvelle commande</h1>
          </div>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Le stock du catalogue n’est pas modifié tant que vous n’avez pas validé une{" "}
            <strong className="text-gray-700">réception</strong> sur la fiche commande.
          </p>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-3 text-gray-500 py-16 rounded-[24px] border border-dashed border-gray-200 bg-white justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
              <span className="font-medium">Chargement du catalogue…</span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-[24px] border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8"
            >
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Note (optionnel)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex. Fournisseur ABC — BL 2026-042"
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label htmlFor="order-currency" className="block text-sm font-bold text-gray-900 mb-2">
                    Devise fournisseur
                  </label>
                  <select
                    id="order-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as ApiCurrencyCode | "")}
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                  >
                    <option value="">
                      Defaut organisation ({defaultPurchaseCurrency.toUpperCase()})
                    </option>
                    {API_CURRENCY_OPTIONS.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
                    Total commande
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-indigo-950">
                    {formatMoney(orderTotal, selectedCurrency)}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Lignes de commande</h2>
                  <button
                    type="button"
                    onClick={addLine}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une ligne
                  </button>
                </div>
                <div className="space-y-4">
                  {lines.map((line, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-indigo-50/30 p-5 sm:grid-cols-[minmax(0,1fr)_9rem_11rem_auto] sm:items-end"
                    >
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                          Article
                        </label>
                        <select
                          value={line.article_id}
                          onChange={(e) => updateLine(index, { article_id: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                        >
                          <option value="">Sélectionner un article…</option>
                          {articles.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                              {a.stock_status ? ` (${a.stock_status})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full sm:w-36">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                          Quantité
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity_ordered}
                          onChange={(e) =>
                            updateLine(index, { quantity_ordered: Number(e.target.value) || 1 })
                          }
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm tabular-nums"
                        />
                      </div>
                      <div className="w-full">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                          Prix total
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={line.total_price}
                          onChange={(e) => updateLine(index, { total_price: e.target.value })}
                          placeholder="ex. 450"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm tabular-nums"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        disabled={lines.length <= 1}
                        className="p-3.5 rounded-xl border border-gray-200 bg-white text-gray-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 disabled:opacity-40 transition"
                        aria-label="Supprimer la ligne"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || articles.length === 0}
                className="w-full sm:w-auto px-10 py-3.5 bg-[#3730A3] hover:bg-[#2e2889] disabled:bg-indigo-300 text-white font-bold rounded-full shadow-lg shadow-indigo-900/10 transition"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Création…
                  </span>
                ) : (
                  "Créer la commande"
                )}
              </button>
            </form>
          )}
        </div>

        <aside className="lg:sticky lg:top-8 space-y-4">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Bon à savoir</p>
                <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                  Une fois la commande créée, ouvrez sa fiche pour saisir les quantités réellement reçues. En cas
                  d’écart avec la commande, un motif sera demandé.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
              <Package className="w-4 h-4 text-indigo-500" />
              Catalogue (aperçu)
            </div>
            <ul className="space-y-2 text-xs text-gray-600">
              {articles.slice(0, 5).map((a) => (
                <li key={a.id} className="flex justify-between gap-2 border-b border-gray-50 pb-2 last:border-0">
                  <span className="truncate font-medium text-gray-800">{a.name}</span>
                  <span className="text-gray-400 shrink-0">{a.stock_quantity ?? "—"} u.</span>
                </li>
              ))}
              {articles.length > 5 && (
                <li className="text-indigo-600 font-medium pt-1">+ {articles.length - 5} autres…</li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
