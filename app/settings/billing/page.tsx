"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  getOrganizationSubscription,
  getOrganizationSubscriptionEntitlements,
  listOrganizationSubscriptionPlans,
  updateOrganizationSubscription,
  type OrganizationSubscription,
  type OrganizationSubscriptionEntitlements,
  type OrganizationSubscriptionPlan,
  type OrganizationSubscriptionPlanCode,
} from "@/lib/api/emall-client";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { getPrimaryMembership } from "@/lib/api/member-me";
import { isAdminMembership } from "@/lib/authz";
import { useOptionalDashboardAccess } from "@/components/dashboard/dashboard-access-provider";

const FEATURE_LABELS: Record<string, string> = {
  pickup_delivery: "Pickup et livraison",
  delivery_assignment: "Assignation livreur",
  advanced_reports: "Rapports avances",
  ai_performance_agent: "Agent IA Performance",
  realtime_gps: "Suivi GPS temps reel",
  advanced_roles_permissions: "Roles et permissions avances",
  team_customer_messaging: "Messagerie equipe/client",
};

const LIMIT_LABELS: Record<string, string> = {
  active_articles: "Articles actifs",
  team_members: "Membres equipe",
  monthly_walk_in_sales: "Ventes comptoir mensuelles",
  monthly_ai_requests: "Requetes IA mensuelles",
};

function planLabel(code: string | null | undefined) {
  if (!code) return "Plan";
  return code.charAt(0).toUpperCase() + code.slice(1);
}

function valueLabel(value: unknown) {
  if (value === null) return "Illimite";
  if (value === true) return "Inclus";
  if (value === false) return "Non inclus";
  if (value == null || value === "") return "-";
  return String(value);
}

function statusLabel(status: string | undefined) {
  switch (status) {
    case "active":
      return "Actif";
    case "trialing":
      return "Essai";
    case "past_due":
      return "Paiement en retard";
    case "canceled":
      return "Annule";
    case "expired":
      return "Expire";
    case "suspended":
      return "Suspendu";
    default:
      return status ?? "-";
  }
}

function usagePercent(usage: unknown, limit: unknown) {
  if (limit == null || typeof limit === "boolean") return 0;
  const numericLimit = Number(limit);
  const numericUsage = Number(usage ?? 0);
  if (!Number.isFinite(numericLimit) || numericLimit <= 0) return 0;
  if (!Number.isFinite(numericUsage)) return 0;
  return Math.min(100, Math.max(0, Math.round((numericUsage / numericLimit) * 100)));
}

export default function BillingSettingsPage() {
  const { profile, loading: profileLoading } = useMemberProfile();
  const dashboardAccess = useOptionalDashboardAccess();
  const primary = profile ? getPrimaryMembership(profile) : undefined;
  const organizationId = primary?.organization_id ?? null;
  const canManage = isAdminMembership(primary);
  const sharedEntitlements = dashboardAccess?.subscriptionEntitlements ?? null;
  const hasSharedAccess = Boolean(dashboardAccess);

  const [plans, setPlans] = useState<OrganizationSubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null);
  const [entitlements, setEntitlements] =
    useState<OrganizationSubscriptionEntitlements | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState<OrganizationSubscriptionPlanCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.sort_order - b.sort_order),
    [plans]
  );

  useEffect(() => {
    if (sharedEntitlements) {
      setEntitlements(sharedEntitlements);
    }
  }, [sharedEntitlements]);

  const load = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [plansData, subscriptionData, entitlementData] = await Promise.all([
        listOrganizationSubscriptionPlans(),
        getOrganizationSubscription(organizationId),
        hasSharedAccess
          ? Promise.resolve(null)
          : getOrganizationSubscriptionEntitlements(organizationId),
      ]);
      setPlans(plansData);
      setSubscription(subscriptionData);
      if (entitlementData) {
        setEntitlements(entitlementData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger l'abonnement.");
    } finally {
      setLoading(false);
    }
  }, [hasSharedAccess, organizationId]);

  useEffect(() => {
    if (profileLoading) return;
    void load();
  }, [profileLoading, load]);

  async function changePlan(plan: OrganizationSubscriptionPlanCode) {
    if (!organizationId || !canManage) return;
    setSavingPlan(plan);
    setError(null);
    setNotice(null);
    try {
      await updateOrganizationSubscription(organizationId, {
        plan,
        status: "active",
        source: "manual",
      });
      setNotice("Abonnement mis a jour.");
      await dashboardAccess?.refreshSubscription();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise a jour impossible.");
    } finally {
      setSavingPlan(null);
    }
  }

  if (profileLoading || loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement de l'abonnement...
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div className="rounded-[8px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        Aucune organisation active n'a ete trouvee pour ce compte.
      </div>
    );
  }

  return (
    <div className="pb-12 text-gray-900">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Abonnement</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
            Consultez le plan actif, les droits disponibles et les limites appliquees a
            l'organisation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void dashboardAccess?.refreshSubscription();
            void load();
          }}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {error ? (
        <div className="mb-6 flex items-start gap-3 rounded-[8px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="mb-6 flex items-start gap-3 rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {notice}
        </div>
      ) : null}

      <section className="mb-8 rounded-[8px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-indigo-700">
              Plan actuel
            </p>
            <h2 className="text-3xl font-black text-gray-900">
              {subscription?.plan_details?.name ?? planLabel(entitlements?.plan ?? subscription?.plan)}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Statut :{" "}
              <span className="font-bold text-gray-900">
                {statusLabel(entitlements?.status ?? subscription?.status)}
              </span>
            </p>
          </div>
          <div className="rounded-[8px] border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <div className="mb-2 flex items-center gap-2 font-bold text-gray-900">
              <CreditCard className="h-4 w-4 text-indigo-700" />
              Paiement Stripe
            </div>
            Stripe sera branche via Checkout/Customer Portal. Cette page utilise deja
            l'abonnement interne expose par l'API.
          </div>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {sortedPlans.map((plan) => {
          const current = entitlements?.plan === plan.code || subscription?.plan === plan.code;
          return (
            <section
              key={plan.code}
              className={`rounded-[8px] border bg-white p-6 shadow-sm ${
                current ? "border-indigo-200 ring-2 ring-indigo-50" : "border-gray-100"
              }`}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900">{plan.name}</h3>
                  {plan.description ? (
                    <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                  ) : null}
                </div>
                {current ? (
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-indigo-700">
                    Actuel
                  </span>
                ) : null}
              </div>

              <div className="mb-5 space-y-2">
                {Object.entries(plan.features ?? {}).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <CheckCircle2
                      className={`h-4 w-4 shrink-0 ${
                        value === true ? "text-emerald-600" : "text-gray-300"
                      }`}
                    />
                    <span className={value === true ? "text-gray-800" : "text-gray-400"}>
                      {FEATURE_LABELS[key] ?? key}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mb-6 space-y-2 rounded-[8px] bg-gray-50 p-4">
                {Object.entries(plan.limits ?? {}).map(([key, value]) => (
                  <p key={key} className="flex justify-between gap-3 text-xs text-gray-600">
                    <span>{LIMIT_LABELS[key] ?? key}</span>
                    <span className="font-bold text-gray-900">{valueLabel(value)}</span>
                  </p>
                ))}
              </div>

              <button
                type="button"
                disabled={!canManage || current || savingPlan === plan.code}
                onClick={() => void changePlan(plan.code)}
                className="w-full rounded-full bg-[#3730A3] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#2e2889] disabled:bg-gray-200 disabled:text-gray-500"
              >
                {savingPlan === plan.code
                  ? "Mise a jour..."
                  : current
                    ? "Plan actif"
                    : canManage
                      ? "Activer ce plan"
                      : "Reserve admin"}
              </button>
            </section>
          );
        })}
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[8px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-indigo-700" />
            <h2 className="text-lg font-extrabold">Droits effectifs</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(entitlements?.features ?? {}).map(([key, value]) => (
              <p key={key} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-gray-600">{FEATURE_LABELS[key] ?? key}</span>
                <span className={value === true ? "font-bold text-emerald-700" : "font-bold text-gray-400"}>
                  {valueLabel(value)}
                </span>
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-extrabold">Utilisation</h2>
          <div className="space-y-5">
            {Object.entries(entitlements?.limits ?? {}).map(([key, limit]) => {
              const usage = entitlements?.usage?.[key] ?? 0;
              const exceeded = entitlements?.exceeded_limits?.[key] === true;
              const percent = usagePercent(usage, limit);
              return (
                <div key={key}>
                  <div className="mb-2 flex justify-between gap-3 text-sm">
                    <span className="font-semibold text-gray-700">{LIMIT_LABELS[key] ?? key}</span>
                    <span className={exceeded ? "font-bold text-rose-700" : "font-bold text-gray-900"}>
                      {valueLabel(usage)} / {valueLabel(limit)}
                    </span>
                  </div>
                  {limit == null ? null : (
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${exceeded ? "bg-rose-500" : "bg-indigo-600"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
