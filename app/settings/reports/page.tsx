"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bot,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  getFinancialSummary,
  getPerformanceAIContext,
  getSalesStatusSummary,
  getTopProductsSummary,
  getTrendingProductsSummary,
  runPerformanceAgent,
  type AIContextResponse,
  type FinancialPeriod,
  type FinancialSummary,
  type PerformanceAgentResponse,
  type PerformanceAgentTask,
  type PerformancePeriod,
  type SalesStatusSummary,
  type TopProductsSummary,
  type TrendingProductsSummary,
} from "@/lib/api/emall-client";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { getPrimaryMembership } from "@/lib/api/member-me";
import { formatMoney } from "@/lib/currencies";
import { useOptionalDashboardAccess } from "@/components/dashboard/dashboard-access-provider";

const FINANCIAL_PERIODS: Array<{ value: FinancialPeriod; label: string }> = [
  { value: "month", label: "Mois" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
  { value: "year", label: "Annee" },
];

const PRODUCT_PERIODS: Array<{ value: PerformancePeriod; label: string }> = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
  { value: "year", label: "Annee" },
];

const AGENT_TASKS: Array<{ value: PerformanceAgentTask; label: string }> = [
  { value: "executive_summary", label: "Resume executif" },
  { value: "monthly_report", label: "Rapport mensuel" },
  { value: "financial_diagnosis", label: "Diagnostic financier" },
  { value: "trend_analysis", label: "Analyse tendances" },
  { value: "stock_recommendations", label: "Actions stock" },
  { value: "sales_actions", label: "Actions commerciales" },
];

function moneyList(values: Array<{ currency: string; amount: number }> | undefined) {
  if (!values?.length) return "-";
  return values.map((item) => formatMoney(item.amount, item.currency)).join(" · ");
}

function numberValue(value: number | string | null | undefined, fallback = 0) {
  if (value == null || value === "") return fallback;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function percentLabel(value: number | string | null | undefined) {
  return numberValue(value).toFixed(1);
}

export default function ReportsSettingsPage() {
  const { profile, loading: profileLoading } = useMemberProfile();
  const dashboardAccess = useOptionalDashboardAccess();
  const primary = profile ? getPrimaryMembership(profile) : undefined;
  const isSalesOrg = primary?.organization?.org_type === "sales";
  const [period, setPeriod] = useState<FinancialPeriod>("month");
  const [productPeriod, setProductPeriod] = useState<PerformancePeriod>("30d");
  const [financial, setFinancial] = useState<FinancialSummary | null>(null);
  const [salesStatus, setSalesStatus] = useState<SalesStatusSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductsSummary | null>(null);
  const [trendingProducts, setTrendingProducts] = useState<TrendingProductsSummary | null>(null);
  const [aiContext, setAiContext] = useState<AIContextResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentTask, setAgentTask] = useState<PerformanceAgentTask>("monthly_report");
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [agentResult, setAgentResult] = useState<PerformanceAgentResponse | null>(null);
  const entitlements = dashboardAccess?.subscriptionEntitlements ?? null;
  const entitlementsLoading = dashboardAccess?.subscriptionLoading ?? false;
  const aiAgentAllowed =
    !entitlements || (entitlements.is_active && entitlements.features?.ai_performance_agent === true);
  const reportsAllowed =
    !entitlements || (entitlements.is_active && entitlements.features?.advanced_reports !== false);

  async function loadReports() {
    if (!isSalesOrg) return;
    setLoading(true);
    setError(null);
    try {
      const [financialData, statusData, topData, trendingData, contextData] =
        await Promise.all([
          getFinancialSummary(period),
          getSalesStatusSummary(period),
          getTopProductsSummary(productPeriod, 20),
          getTrendingProductsSummary(productPeriod, 20),
          aiAgentAllowed ? getPerformanceAIContext(period) : Promise.resolve(null),
        ]);
      setFinancial(financialData);
      setSalesStatus(statusData);
      setTopProducts(topData);
      setTrendingProducts(trendingData);
      setAiContext(contextData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rapports indisponibles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (profileLoading) return;
    void loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoading, isSalesOrg, period, productPeriod, aiAgentAllowed]);

  const topProductRows = useMemo(() => topProducts?.items.slice(0, 8) ?? [], [topProducts]);
  const trendingRows = useMemo(
    () => trendingProducts?.items.slice(0, 8) ?? [],
    [trendingProducts]
  );

  async function runAgent() {
    if (!aiAgentAllowed) {
      setAgentError("L'agent IA Performance n'est pas inclus dans votre abonnement actuel.");
      return;
    }
    setAgentLoading(true);
    setAgentError(null);
    setAgentResult(null);
    try {
      setAgentResult(
        await runPerformanceAgent({
          task: agentTask,
          period,
          max_tokens: 1200,
        })
      );
    } catch (e) {
      setAgentError(e instanceof Error ? e.message : "Generation IA impossible.");
    } finally {
      setAgentLoading(false);
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement du profil...
      </div>
    );
  }

  if (!isSalesOrg) {
    return (
      <div className="rounded-[8px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        Les rapports Performance disponibles ici concernent les organisations de vente.
      </div>
    );
  }

  if (!reportsAllowed && !entitlementsLoading) {
    return (
      <div className="rounded-[8px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        Les rapports avances ne sont pas inclus dans l'abonnement actuel.
      </div>
    );
  }

  return (
    <div className="pb-12 text-gray-900">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Rapports</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
            Rapports financiers, ventes, produits, tendances customer et contexte IA.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadReports()}
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualiser
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value as FinancialPeriod)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold"
        >
          {FINANCIAL_PERIODS.map((item) => (
            <option key={item.value} value={item.value}>
              Finance / ventes : {item.label}
            </option>
          ))}
        </select>
        <select
          value={productPeriod}
          onChange={(event) => setProductPeriod(event.target.value as PerformancePeriod)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold"
        >
          {PRODUCT_PERIODS.map((item) => (
            <option key={item.value} value={item.value}>
              Produits : {item.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-indigo-700" />
            <h2 className="text-lg font-extrabold">Financier</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <p><span className="font-semibold">Revenu :</span> {moneyList(financial?.revenue)}</p>
            <p><span className="font-semibold">Cout fournisseur :</span> {moneyList(financial?.supplier_cost)}</p>
            <p><span className="font-semibold">Marge estimee :</span> {moneyList(financial?.gross_margin_estimate)}</p>
            <p><span className="font-semibold">Panier moyen :</span> {moneyList(financial?.average_order_value)}</p>
          </div>
          {financial?.notes?.length ? (
            <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900">
              {financial.notes.join(" ")}
            </div>
          ) : null}
        </section>

        <section className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-indigo-700" />
            <h2 className="text-lg font-extrabold">Etat des ventes</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <p><span className="font-semibold">Total</span><br />{salesStatus?.total_orders ?? 0}</p>
            <p><span className="font-semibold">Pipeline</span><br />{salesStatus?.pipeline_orders ?? 0}</p>
            <p><span className="font-semibold">Terminees</span><br />{salesStatus?.completed_orders ?? 0}</p>
            <p><span className="font-semibold">Annulees</span><br />{salesStatus?.cancelled_orders ?? 0}</p>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Taux d'annulation : {percentLabel(salesStatus?.cancellation_rate_percent)}%
          </p>
        </section>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-extrabold">Top produits vendus</h2>
          <div className="space-y-3">
            {topProductRows.map((product) => (
              <div key={product.article_id} className="rounded-2xl bg-gray-50 px-4 py-3">
                <p className="font-bold text-gray-900">{product.name ?? "Produit"}</p>
                <p className="text-xs text-gray-500">
                  {product.quantity_sold} vendu(s) · {moneyList(product.revenue)}
                </p>
              </div>
            ))}
            {!topProductRows.length && <p className="text-sm text-gray-500">Aucun produit.</p>}
          </div>
        </section>

        <section className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-extrabold">Produits tendance</h2>
          <div className="space-y-3">
            {trendingRows.map((product) => (
              <div key={product.article_id} className="rounded-2xl bg-gray-50 px-4 py-3">
                <p className="font-bold text-gray-900">{product.name ?? "Produit"}</p>
                <p className="text-xs text-gray-500">
                  Score {product.trend_score} · disponible {product.available_quantity}
                </p>
              </div>
            ))}
            {!trendingRows.length && <p className="text-sm text-gray-500">Aucune tendance.</p>}
          </div>
        </section>
      </div>

      {entitlementsLoading ? (
        <section className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verification des droits IA...
          </div>
        </section>
      ) : !aiAgentAllowed ? (
        <section className="rounded-[8px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          L'agent IA Performance n'est pas inclus dans le plan actuel. Les rapports
          chiffres restent disponibles, mais la generation assistee est masquee.
        </section>
      ) : (
      <section className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Bot className="mt-0.5 h-5 w-5 text-indigo-700" />
            <div>
              <h2 className="text-lg font-extrabold">Rapport IA</h2>
              <p className="text-sm text-gray-500">
                Le backend fournit le contexte et route la demande vers le meilleur provider disponible.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={agentTask}
              onChange={(event) => setAgentTask(event.target.value as PerformanceAgentTask)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold"
            >
              {AGENT_TASKS.map((task) => (
                <option key={task.value} value={task.value}>
                  {task.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void runAgent()}
              disabled={agentLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#3730A3] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {agentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generer
            </button>
          </div>
        </div>

        {aiContext?.anomalies?.length ? (
          <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900">
            {aiContext.anomalies.join(" ")}
          </div>
        ) : null}
        {agentError ? (
          <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {agentError}
          </div>
        ) : null}
        {agentResult ? (
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
              {agentResult.provider} · {agentResult.model}
              {agentResult.fallback_used ? " · fallback utilise" : ""}
            </p>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {agentResult.output}
            </pre>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Selectionnez un type de rapport puis lancez la generation.
          </p>
        )}
      </section>
      )}
    </div>
  );
}
