"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Crown, PackageOpen, Zap } from "lucide-react";

export type PricingPlanIcon = "package" | "zap" | "crown";

export type PricingPlan = {
  name: "Freemium" | "Standard" | "Premium";
  monthlyPrice: number;
  annualMonthlyPrice: number;
  subtitle: string;
  badge: string;
  icon: PricingPlanIcon;
  tone: string;
  button: string;
  features: string[];
};

type BillingCycle = "monthly" | "annual";

const formatXof = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(value);

const planIcons = {
  package: PackageOpen,
  zap: Zap,
  crown: Crown,
};

export function PricingPlans({ plans }: { plans: PricingPlan[] }) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const yearlySavings = useMemo(() => {
    const standard = plans.find((plan) => plan.name === "Standard");
    if (!standard || standard.monthlyPrice === 0) return 0;
    return Math.round((1 - standard.annualMonthlyPrice / standard.monthlyPrice) * 100);
  }, [plans]);

  return (
    <div>
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`rounded-full px-5 py-2 text-sm font-bold transition ${
              billingCycle === "monthly"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`rounded-full px-5 py-2 text-sm font-bold transition ${
              billingCycle === "annual"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Annuel
          </button>
        </div>
        <p className="text-sm font-medium text-emerald-700">
          {billingCycle === "annual"
            ? `Paiement annuel active: environ ${yearlySavings}% d'economie.`
            : "Changez vers l'annuel pour reduire le cout mensuel."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const displayPrice =
            billingCycle === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;
          const annualTotal = plan.annualMonthlyPrice * 12;
          const isPremium = plan.name === "Premium";
          const isStandard = plan.name === "Standard";
          const Icon = planIcons[plan.icon];

          return (
            <div
              key={plan.name}
              className={`flex min-h-[580px] flex-col rounded-[8px] border p-6 shadow-sm ${plan.tone}`}
            >
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <span
                    className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      isPremium
                        ? "bg-white/10 text-white"
                        : isStandard
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {plan.badge}
                  </span>
                  <h2 className="text-2xl font-extrabold">{plan.name}</h2>
                  <p className={`mt-2 text-sm ${isPremium ? "text-slate-300" : "text-gray-500"}`}>
                    {plan.subtitle}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-[8px] ${
                    isPremium ? "bg-white text-slate-950" : "bg-white text-indigo-700"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-end justify-center gap-2 lg:justify-start">
                  <span className="text-5xl font-black tracking-tight">
                    {formatXof(displayPrice)}
                  </span>
                  <span className={`pb-2 text-sm ${isPremium ? "text-slate-300" : "text-gray-500"}`}>
                    XOF / mois
                  </span>
                </div>
                <p className={`mt-2 text-xs ${isPremium ? "text-slate-400" : "text-gray-500"}`}>
                  {billingCycle === "annual"
                    ? plan.monthlyPrice === 0
                      ? "Gratuit, meme en annuel."
                      : `Facture ${formatXof(annualTotal)} XOF une fois par an.`
                    : "Facturation mensuelle, sans engagement annuel."}
                </p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        isPremium ? "bg-emerald-400 text-slate-950" : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className={isPremium ? "text-slate-200" : "text-gray-600"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition ${
                  isPremium
                    ? "bg-white text-slate-950 hover:bg-slate-100"
                    : isStandard
                      ? "bg-[#3730A3] text-white hover:bg-[#2f2788]"
                      : "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                }`}
              >
                {plan.button}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
