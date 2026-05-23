"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  ShoppingCart,
  X,
  Truck,
} from "lucide-react";
import { loadMemberProfileForSession } from "@/lib/api/member-me";
import { createWalkInSale, listArticles, listCustomerSales } from "@/lib/api/emall-client";
import { getEffectiveOrganizationId } from "@/lib/organization-resolve";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { translate } from "@/lib/i18n";
import { getBusinessCache, setBusinessCache } from "@/lib/realtime/business-cache";
import { subscribeToCustomerSales } from "@/lib/realtime/business-realtime";
import type { OrganizationArticle } from "@/lib/types/article-orders";
import type {
  CustomerSaleOrderDetail,
  CustomerSaleStatus,
  CustomerSaleStatusGroup,
} from "@/lib/types/customer-sales";

export default function SalesPage() {
  const { profile } = useMemberProfile();
  const t = (key: string) => translate(profile?.params?.locale, key);
  const [allOrders, setAllOrders] = useState<CustomerSaleOrderDetail[]>([]);
  const [statusGroup, setStatusGroup] = useState<"all" | CustomerSaleStatusGroup>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgMissing, setOrgMissing] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);
  const [walkInError, setWalkInError] = useState<string | null>(null);
  const [articles, setArticles] = useState<OrganizationArticle[]>([]);
  const [walkInLines, setWalkInLines] = useState<Array<{ article_id: string; quantity: number }>>([
    { article_id: "", quantity: 1 },
  ]);
  const [externalCustomerLabel, setExternalCustomerLabel] = useState("");
  const [walkInNotes, setWalkInNotes] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const loadSales = useCallback(async () => {
    await loadMemberProfileForSession();
    const orgId = getEffectiveOrganizationId();
    setOrganizationId(orgId);
    if (!orgId) {
      setOrgMissing(true);
      setAllOrders([]);
      return;
    }
    setOrgMissing(false);
    const cacheKey = `customer-sales:${orgId}`;
    const cached = getBusinessCache<CustomerSaleOrderDetail[]>(cacheKey);
    if (cached) {
      setAllOrders(cached);
      setLoading(false);
    }
    const data = await listCustomerSales();
    setAllOrders(data);
    setBusinessCache(cacheKey, data);
  }, []);

  useEffect(() => {
    if (!organizationId) return;
    const cacheKey = `customer-sales:${organizationId}`;
    return subscribeToCustomerSales<CustomerSaleOrderDetail["order"]>(organizationId, (payload) => {
      setAllOrders((current) => {
        if (payload.eventType === "DELETE") {
          const oldId = String(payload.old.id ?? "");
          const next = current.filter((item) => item.order.id !== oldId);
          setBusinessCache(cacheKey, next);
          return next;
        }
        const row = payload.new;
        const exists = current.some((item) => item.order.id === row.id);
        const next = exists
          ? current.map((item) => (item.order.id === row.id ? { ...item, order: row } : item))
          : [{ order: row, lines: [] }, ...current];
        setBusinessCache(cacheKey, next);
        return next;
      });
    });
  }, [organizationId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await loadSales();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSales]);

  const orders = useMemo(() => {
    if (statusGroup === "all") return allOrders;
    return allOrders.filter((o) => o.order.status === statusGroup);
  }, [allOrders, statusGroup]);

  const kpis = useMemo(() => {
    const countByStatus = (status: CustomerSaleStatus) =>
      allOrders.filter((o) => o.order.status === status).length;
    return {
      total: allOrders.length,
      inProgress: countByStatus("in_progress"),
      inDelivery: countByStatus("in_delivery"),
      completed: countByStatus("completed"),
    };
  }, [allOrders]);

  const groupFilters: Array<{ value: "all" | CustomerSaleStatusGroup; label: string }> = [
    { value: "all", label: "Toutes" },
    { value: "in_progress", label: "Préparation" },
    { value: "in_delivery", label: "Livraison" },
    { value: "cancelled", label: "Annulées" },
    { value: "completed", label: "Terminées" },
  ];

  const statusBadgeClass: Record<CustomerSaleStatus, string> = {
    pending: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
    in_progress: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/80",
    in_delivery: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/80",
    cancelled: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
    completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
  };
  const statusLabel: Record<CustomerSaleStatus, string> = {
    pending: "Pending",
    in_progress: "In progress",
    in_delivery: "In delivery",
    cancelled: "Cancelled",
    completed: "Completed",
  };
  const fulfillmentLabel = (value: string | undefined) => {
    if (value === "pickup") return "Retrait";
    if (value === "delivery") return "Livraison";
    if (value === "walk_in_offline") return "Comptoir";
    return value ?? "—";
  };
  const parseAmount = (value: unknown): number | null => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const openWalkInModal = useCallback(async () => {
    try {
      setWalkInError(null);
      setIsWalkInOpen(true);
      if (articles.length > 0) return;
      const list = await listArticles(true);
      setArticles(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur";
      setWalkInError(msg);
    }
  }, [articles.length]);

  const addWalkInLine = useCallback(() => {
    setWalkInLines((prev) => [...prev, { article_id: "", quantity: 1 }]);
  }, []);

  const removeWalkInLine = useCallback((index: number) => {
    setWalkInLines((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateWalkInLine = useCallback(
    (index: number, patch: Partial<{ article_id: string; quantity: number }>) => {
      setWalkInLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
    },
    []
  );

  const resetWalkInForm = useCallback(() => {
    setWalkInLines([{ article_id: "", quantity: 1 }]);
    setExternalCustomerLabel("");
    setWalkInNotes("");
    setWalkInError(null);
  }, []);

  const submitWalkInSale = useCallback(async () => {
    try {
      setWalkInError(null);
      const cleanLines = walkInLines.filter((line) => line.article_id && line.quantity > 0);
      if (cleanLines.length === 0) {
        throw new Error("Ajoute au moins un article valide avec une quantité supérieure à 0.");
      }
      const uniqueArticleIds = new Set(cleanLines.map((line) => line.article_id));
      if (uniqueArticleIds.size !== cleanLines.length) {
        throw new Error("Chaque article ne peut être sélectionné qu'une seule fois.");
      }
      setIsSubmittingWalkIn(true);
      await createWalkInSale({
        lines: cleanLines,
        external_customer_label: externalCustomerLabel.trim() || undefined,
        notes: walkInNotes.trim() || undefined,
      });
      setIsWalkInOpen(false);
      resetWalkInForm();
      await loadSales();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur";
      setWalkInError(msg);
    } finally {
      setIsSubmittingWalkIn(false);
    }
  }, [externalCustomerLabel, loadSales, resetWalkInForm, walkInLines, walkInNotes]);

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      <div className="mb-8 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">{t("salesOverview")}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openWalkInModal}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
          >
            <Plus className="h-4 w-4" />
            {t("walkInSale")}
          </button>
          <Link
            href="/dashboard/delivery"
            className="inline-flex items-center gap-2 rounded-full bg-[#3730A3] px-4 py-2 text-sm font-bold text-white hover:bg-[#2f2788]"
          >
            <Truck className="h-4 w-4" />
            {t("delivery")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">{t("orders")}</span>
            <ShoppingCart className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{kpis.total}</p>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-800/80">{t("inProgress")}</span>
            <Clock3 className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-extrabold text-indigo-900">{kpis.inProgress}</p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-800/80">{t("inDelivery")}</span>
            <Truck className="h-4 w-4 text-sky-600" />
          </div>
          <p className="text-3xl font-extrabold text-sky-900">{kpis.inDelivery}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800/80">{t("completed")}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-900">{kpis.completed}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {groupFilters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusGroup(f.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              statusGroup === f.value
                ? "bg-[#3730A3] text-white shadow-md shadow-indigo-900/15"
                : "border border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/50"
            }`}
          >
            {f.value === "all" ? t("all") : f.value === "in_progress" ? t("inProgress") : f.value === "in_delivery" ? t("inDelivery") : f.value === "cancelled" ? t("cancelled") : t("completed")}
          </button>
        ))}
      </div>

      {orgMissing && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>L’organisation courante est introuvable. Recharge le profil membre pour récupérer l’`organization_id`.</p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <span className="text-sm font-medium">{t("loadingSales")}</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="text-lg font-semibold text-gray-900">{t("noSales")}</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Aucun résultat pour ce filtre. Les commandes customer apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-gray-500">
                  <th className="px-6 py-4 font-semibold">{t("status")}</th>
                  <th className="px-6 py-4 font-semibold">{t("orders")}</th>
                  <th className="px-6 py-4 font-semibold">{t("mode")}</th>
                  <th className="px-6 py-4 font-semibold">{t("amount")}</th>
                  <th className="px-6 py-4 font-semibold">{t("createdAt")}</th>
                  <th className="px-6 py-4 text-right font-semibold">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(({ order, lines }) => (
                  <tr
                    key={order.id}
                    className="group border-b border-gray-50 transition-colors hover:bg-indigo-50/30 last:border-0"
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass[order.status]}`}
                      >
                        {statusLabel[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      <div className="max-w-[34ch] truncate font-medium" title={order.id}>
                        {order.id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.total_lines ?? lines.length} ligne(s) • {order.total_items ?? "—"} article(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {fulfillmentLabel(order.fulfillment_type ?? order.mode)}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {parseAmount(order.subtotal_amount ?? order.total_amount) == null
                        ? "—"
                        : new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: order.currency ?? "XOF",
                          }).format(parseAmount(order.subtotal_amount ?? order.total_amount) ?? 0)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-500 sm:text-sm">
                      {new Date(order.created_at).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/sales/${order.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 group-hover:underline"
                      >
                        {t("manageSale")}
                        <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isWalkInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 sm:p-6">
          <div className="flex w-full max-w-2xl max-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Nouvelle vente comptoir</h2>
              <button
                type="button"
                onClick={() => {
                  setIsWalkInOpen(false);
                  resetWalkInForm();
                }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {walkInLines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 items-end gap-3">
                  <div className="col-span-7">
                    <label className="mb-1 block text-xs font-semibold text-gray-500">Article</label>
                    <select
                      value={line.article_id}
                      onChange={(e) => updateWalkInLine(index, { article_id: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    >
                      <option value="">Sélectionner un article</option>
                      {articles.map((article) => {
                        const selectedElsewhere = walkInLines.some(
                          (otherLine, otherIndex) =>
                            otherIndex !== index && otherLine.article_id === article.id
                        );
                        return (
                          <option key={article.id} value={article.id} disabled={selectedElsewhere}>
                          {article.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="mb-1 block text-xs font-semibold text-gray-500">Quantité</label>
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateWalkInLine(index, {
                          quantity: Math.max(1, Number(e.target.value || 1)),
                        })
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <button
                      type="button"
                      onClick={() => removeWalkInLine(index)}
                      disabled={walkInLines.length === 1}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addWalkInLine}
                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
              >
                <Plus className="h-4 w-4" />
                Ajouter une ligne
              </button>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Nom client (optionnel)</label>
                  <input
                    type="text"
                    value={externalCustomerLabel}
                    onChange={(e) => setExternalCustomerLabel(e.target.value)}
                    placeholder="Client comptoir"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Note (optionnel)</label>
                  <input
                    type="text"
                    value={walkInNotes}
                    onChange={(e) => setWalkInNotes(e.target.value)}
                    placeholder="Paiement cash"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {walkInError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {walkInError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setIsWalkInOpen(false);
                  resetWalkInForm();
                }}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submitWalkInSale}
                disabled={isSubmittingWalkIn}
                className="inline-flex items-center gap-2 rounded-full bg-[#3730A3] px-4 py-2 text-sm font-bold text-white hover:bg-[#2f2788] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingWalkIn ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Valider la vente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
