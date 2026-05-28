import {
  PackageOpen,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PublicSiteHeader } from "@/components/public-site-header";
import { PricingPlans, type PricingPlan } from "@/components/pricing-plans";

const plans: PricingPlan[] = [
  {
    name: "Freemium",
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    subtitle: "Pour demarrer une petite boutique.",
    badge: "Start",
    icon: "package",
    tone: "border-gray-100 bg-white",
    button: "Creer gratuitement",
    features: [
      "Catalogue de base",
      "Gestion simple du stock",
      "Ventes comptoir",
      "1 membre equipe",
      "Support communautaire",
    ],
  },
  {
    name: "Standard",
    monthlyPrice: 14900,
    annualMonthlyPrice: 11900,
    subtitle: "Pour les boutiques qui vendent chaque jour.",
    badge: "Populaire",
    icon: "zap",
    tone: "border-indigo-200 bg-indigo-50/40 ring-1 ring-indigo-100",
    button: "Choisir Standard",
    features: [
      "Articles et commandes illimites",
      "Pickup et livraison",
      "Assignation livreur",
      "Historique des statuts",
      "Dashboard de ventes",
    ],
  },
  {
    name: "Premium",
    monthlyPrice: 39900,
    annualMonthlyPrice: 31900,
    subtitle: "Pour equipes, livraison et pilotage avance.",
    badge: "Scale",
    icon: "crown",
    tone: "border-gray-900 bg-slate-950 text-white",
    button: "Passer Premium",
    features: [
      "Tout Standard",
      "Suivi GPS temps reel",
      "Roles et permissions avances",
      "Messagerie equipe/client",
      "Support prioritaire",
    ],
  },
];

const includedFeatures: Array<[string, LucideIcon]> = [
  ["Sessions securisees", ShieldCheck],
  ["Catalogue marchand", PackageOpen],
  ["Support evolution", Sparkles],
  ["Activation rapide", Zap],
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicSiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-8 py-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
            <Sparkles className="h-3.5 w-3.5" />
            Plans flexibles
          </div>
          <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-gray-900">
            Un tarif pour chaque niveau de croissance.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-500">
            Commencez en freemium, passez au Standard pour vendre plus vite, puis activez
            Premium quand la livraison et l'equipe deviennent critiques.
          </p>
        </section>

        <section className="px-8 pb-20">
          <div className="mx-auto max-w-7xl">
            <PricingPlans plans={plans} />
          </div>
        </section>

        <section className="bg-[#f8fafc] px-8 py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Ce qui reste inclus</h2>
              <p className="mt-4 text-gray-500">
                Les plans partagent le meme socle produit pour garantir une experience stable
                quand votre boutique grandit.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {includedFeatures.map(([label, Icon]) => (
                <div key={label} className="rounded-[8px] border border-gray-100 bg-white p-5 shadow-sm">
                  <Icon className="mb-4 h-5 w-5 text-indigo-600" />
                  <p className="font-bold text-gray-900">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
