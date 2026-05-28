import {
  Banknote,
  CheckCircle2,
  Globe,
  LineChart,
  PackageOpen,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HomeAuthActions } from "@/components/home-auth-actions";
import { PublicSiteHeader } from "@/components/public-site-header";

type SolutionCard = {
  title: string;
  text: string;
  icon: LucideIcon;
  tone: string;
};

const solutions: SolutionCard[] = [
  {
    title: "Stock centralise",
    text: "Suivez les articles, variantes, images, niveaux disponibles et alertes de rupture depuis un seul espace.",
    icon: PackageOpen,
    tone: "bg-indigo-50 text-indigo-700",
  },
  {
    title: "Ventes client",
    text: "Gerez les ventes pickup, livraison et comptoir avec reservation de stock, historique et validation QR.",
    icon: Banknote,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Livraison temps reel",
    text: "Assignez les livreurs, affichez le trace GPS, suivez les points Realtime et finalisez par QR livraison.",
    icon: Truck,
    tone: "bg-sky-50 text-sky-700",
  },
  {
    title: "Equipe et roles",
    text: "Organisez les permissions entre administration, vente et livraison pour proteger les operations sensibles.",
    icon: Users,
    tone: "bg-fuchsia-50 text-fuchsia-700",
  },
  {
    title: "Pilotage commercial",
    text: "Visualisez les commandes, revenus, performances et activites recentes pour prendre des decisions rapides.",
    icon: LineChart,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "Acces securise",
    text: "Authentification Supabase, sessions utilisateur et routes protegees pour un back-office fiable.",
    icon: ShieldCheck,
    tone: "bg-slate-100 text-slate-700",
  },
];

export default function SolutionsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicSiteHeader />

      <main className="flex-1">
        <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-8 py-20 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="mb-6 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Solutions marchand
            </div>
            <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-gray-900">
              Toute l'operation boutique, du stock a la livraison.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-500">
              Indigo rassemble les outils essentiels pour vendre, preparer, livrer et suivre
              l'activite sans multiplier les fichiers, les messages et les validations manuelles.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <HomeAuthActions variant="hero" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[8px] border border-gray-100 bg-slate-950 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Operations live</p>
                <p className="text-2xl font-extrabold">09:42</p>
              </div>
              <Globe className="h-6 w-6 text-sky-300" />
            </div>
            <div className="grid gap-3">
              {[
                ["Stock", "1,284 articles actifs", "bg-indigo-500"],
                ["Ventes", "42 commandes en cours", "bg-emerald-500"],
                ["Livraison", "8 trajets suivis", "bg-sky-500"],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-[8px] border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{label}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  </div>
                  <p className="text-sm text-slate-300">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f8fafc] px-8 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Modules disponibles</h2>
              <p className="mt-3 text-gray-500">
                Chaque module est pense pour un workflow concret du back-office marchand.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {solutions.map((item) => (
                <div key={item.title} className="rounded-[8px] border border-gray-100 bg-white p-6 shadow-sm">
                  <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-[8px] ${item.tone}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-500">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-8 py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-3">
            {["Commander", "Preparer", "Livrer"].map((step, index) => (
              <div key={step} className="rounded-[8px] border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">{step}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">
                  {index === 0
                    ? "La commande reserve le stock et conserve les lignes article."
                    : index === 1
                      ? "L'equipe avance les statuts et garde un historique clair."
                      : "Le livreur partage sa position et finalise avec validation QR."}
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Inclus dans le back-office
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
