"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Loader2,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Truck,
  UserPlus,
} from "lucide-react";
import { useDashboardAccess } from "@/components/dashboard/dashboard-access-provider";
import {
  getPerformanceDashboardSummary,
  type PerformanceDashboardSummary,
} from "@/lib/api/emall-client";
import { formatMoney } from "@/lib/currencies";
import { getBusinessCache, setBusinessCache } from "@/lib/realtime/business-cache";

const DASHBOARD_PERIOD = "month";
const DASHBOARD_LIMIT = 10;
const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000;

const dashboardSummaryCacheKey = (organizationId: string) =>
  `dashboard:summary:${organizationId}:${DASHBOARD_PERIOD}:${DASHBOARD_LIMIT}`;

function firstMoney(
  values: Array<{ currency: string; amount?: number | string; current?: number | string }> | undefined
) {
  const first = values?.[0];
  if (!first) return "-";
  return formatMoney(first.amount ?? first.current, first.currency);
}

function variationLabel(value: number | string | null | undefined) {
  if (value == null) return "-";
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return "-";
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${numeric.toFixed(1)}%`;
}

export default function DashboardPage() {
  const {
    isAdmin,
    isDeliveryOrganization,
    isSalesOrganization,
    organization,
    memberRole,
  } = useDashboardAccess();
  const [summary, setSummary] = useState<PerformanceDashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async (options?: { force?: boolean }) => {
    if (!isSalesOrganization) return;
    const organizationId = organization?.id;
    if (!organizationId) return;

    const cacheKey = dashboardSummaryCacheKey(organizationId);
    const cached = getBusinessCache<PerformanceDashboardSummary>(cacheKey);
    if (cached && !options?.force) {
      setSummary(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setError(null);
    try {
      const next = await getPerformanceDashboardSummary(DASHBOARD_PERIOD, DASHBOARD_LIMIT);
      setSummary(next);
      setBusinessCache(cacheKey, next, { ttlMs: DASHBOARD_CACHE_TTL_MS });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dashboard indisponible.");
    } finally {
      setLoading(false);
    }
  }, [isSalesOrganization, organization?.id]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const monthly = summary?.monthly_summary;
  const inventory = summary?.inventory_summary;
  const salesStatus = summary?.sales_status;
  const topProducts = summary?.top_products?.items ?? [];
  const trendingProducts = summary?.trending_products?.items ?? [];
  const weeklyProducts = summary?.weekly_sales?.by_product ?? [];

  const stockWatchCount = useMemo(
    () =>
      (inventory?.alerts?.active_products_low_stock ??
        monthly?.catalog?.low_stock_products ??
        0) +
      (inventory?.alerts?.active_products_out_of_stock ??
        monthly?.catalog?.out_of_stock_products ??
        0),
    [inventory, monthly]
  );

  if (isDeliveryOrganization) {
    return (
      <div className="mx-auto max-w-[1200px] pb-12">
        <div className="mb-8">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-700">
            Espace livraison
          </div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900">
            {organization?.name ?? "Organisation livraison"}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-gray-500">
            Suivez les missions assignees, publiez les positions GPS et gardez le lien avec
            les equipes via la messagerie.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Link
            href="/dashboard/delivery"
            className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm transition hover:border-indigo-100 hover:shadow-md"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <Truck className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900">Missions livraison</h2>
            <p className="mt-2 text-sm text-gray-500">
              Livraisons assignees, QR de validation et suivi GPS.
            </p>
          </Link>

          <Link
            href="/dashboard/messages"
            className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm transition hover:border-indigo-100 hover:shadow-md"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900">Messages</h2>
            <p className="mt-2 text-sm text-gray-500">
              Echanges avec les marchands et coordination operationnelle.
            </p>
          </Link>

          {isAdmin ? (
            <Link
              href="/dashboard/team"
              className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm transition hover:border-indigo-100 hover:shadow-md"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <UserPlus className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-extrabold text-gray-900">Equipe</h2>
              <p className="mt-2 text-sm text-gray-500">
                Invitez et organisez les livreurs de votre structure.
              </p>
            </Link>
          ) : (
            <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-gray-500">
                <Package className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-extrabold text-gray-900">Role</h2>
              <p className="mt-2 text-sm text-gray-500">
                {memberRole === "delivery_management"
                  ? "Vous etes configure pour les operations de livraison."
                  : "Votre role sera utilise pour afficher les bonnes missions."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] pb-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-700">
            Performance
          </div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900">
            Dashboard vendeur
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-gray-500">
            Resume mensuel, ventes, stock et produits forts depuis l'endpoint Performance.
          </p>
          {summary?.generated_at ? (
            <p className="mt-1 text-xs text-gray-400">
              Mis a jour : {new Date(summary.generated_at).toLocaleString("fr-FR")}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void loadSummary({ force: true })}
          disabled={loading || !isSalesOrganization}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualiser
        </button>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <Banknote className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              {variationLabel(monthly?.sales?.revenue?.[0]?.variation_percent)}
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500">Revenu mensuel</p>
          <p className="mt-1 text-2xl font-black text-gray-900">
            {firstMoney(monthly?.sales?.revenue)}
          </p>
        </div>

        <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-700">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              {variationLabel(monthly?.sales?.count?.variation_percent)}
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-500">Ventes terminees</p>
          <p className="mt-1 text-2xl font-black text-gray-900">
            {monthly?.sales?.count?.current ?? salesStatus?.completed_orders ?? 0}
          </p>
        </div>

        <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Package className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500">Produits actifs</p>
          <p className="mt-1 text-2xl font-black text-gray-900">
            {inventory?.products?.active_products ?? monthly?.catalog?.active_products ?? 0}
          </p>
        </div>

        <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-gray-500">Stock a surveiller</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{stockWatchCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Ventes semaine courante</h2>
              <p className="text-sm text-gray-500">Produits tries par quantite vendue.</p>
            </div>
            <Link href="/settings/reports" className="text-xs font-bold text-indigo-700 hover:text-indigo-900">
              Rapports
            </Link>
          </div>
          <div className="space-y-3">
            {weeklyProducts.slice(0, 8).map((product) => (
              <div
                key={product.article_id}
                className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">{product.name ?? "Produit"}</p>
                  <p className="text-xs text-gray-500">
                    {product.quantity_sold} vendu(s) · {product.sales_count} vente(s)
                  </p>
                </div>
                <p className="shrink-0 text-sm font-extrabold text-gray-900">
                  {firstMoney(product.revenue)}
                </p>
              </div>
            ))}
            {!weeklyProducts.length && (
              <p className="rounded-2xl bg-gray-50 px-4 py-6 text-sm text-gray-500">
                Aucune vente terminee cette semaine.
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
              Top produits
            </h2>
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((product) => (
                <div key={product.article_id} className="rounded-2xl bg-gray-50 px-4 py-3">
                  <p className="truncate text-sm font-bold text-gray-900">{product.name ?? "Produit"}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {product.quantity_sold} vendu(s) · {firstMoney(product.revenue)}
                  </p>
                </div>
              ))}
              {!topProducts.length && <p className="text-sm text-gray-500">Aucun top produit.</p>}
            </div>
          </section>

          <section className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
              Tendances customer
            </h2>
            <div className="space-y-3">
              {trendingProducts.slice(0, 4).map((product) => (
                <div key={product.article_id} className="rounded-2xl bg-gray-50 px-4 py-3">
                  <p className="truncate text-sm font-bold text-gray-900">{product.name ?? "Produit"}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Score {product.trend_score} · stock {product.available_quantity}
                  </p>
                </div>
              ))}
              {!trendingProducts.length && <p className="text-sm text-gray-500">Aucune tendance.</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
