"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  Loader2,
  AlertCircle,
  Package,
  CheckCircle2,
  Ban,
  ArrowUpRight,
} from "lucide-react";
import { listArticleOrders } from "@/lib/api/emall-client";
import { loadMemberProfileForSession } from "@/lib/api/member-me";
import { getEffectiveOrganizationId } from "@/lib/organization-resolve";
import type { ArticleOrder, OrderStatus } from "@/lib/types/article-orders";

const STATUS_FILTER: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "open", label: "Ouvertes" },
  { value: "received", label: "Reçues" },
  { value: "cancelled", label: "Annulées" },
];

function statusBadge(status: OrderStatus) {
  const map: Record<OrderStatus, string> = {
    open: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
    received: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
    cancelled: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80",
  };
  const labels: Record<OrderStatus, string> = {
    open: "Ouverte",
    received: "Reçue",
    cancelled: "Annulée",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function OrdersPage() {
  const [allOrders, setAllOrders] = useState<ArticleOrder[]>([]);
  const [filter, setFilter] = useState<(typeof STATUS_FILTER)[number]["value"]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgMissing, setOrgMissing] = useState(false);

  const orders = useMemo(() => {
    if (filter === "all") return allOrders;
    return allOrders.filter((o) => o.status === filter);
  }, [allOrders, filter]);

  const kpis = useMemo(() => {
    const open = allOrders.filter((o) => o.status === "open").length;
    const received = allOrders.filter((o) => o.status === "received").length;
    const cancelled = allOrders.filter((o) => o.status === "cancelled").length;
    return { open, received, cancelled, total: allOrders.length };
  }, [allOrders]);

  const loadOrders = useCallback(async () => {
    await loadMemberProfileForSession();
    if (!getEffectiveOrganizationId()) {
      setOrgMissing(true);
      setAllOrders([]);
      return;
    }
    setOrgMissing(false);
    const list = await listArticleOrders(undefined);
    setAllOrders(list);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await loadOrders();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur";
        if (!cancelled) {
          if (msg === "AUTH_REQUIRED") {
            setError("Vous devez être connecté (Supabase) pour voir les commandes.");
          } else if (msg === "SUPABASE_CONFIG") {
            setError("Configuration Supabase manquante dans .env.local.");
          } else {
            setError(msg);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadOrders]);

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#3730A3] via-indigo-700 to-violet-800 px-8 py-10 mb-10 text-white shadow-lg shadow-indigo-900/20">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-fuchsia-400/20 blur-2xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-indigo-200/90">
                Approvisionnement
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Commandes fournisseur
            </h1>
            <p className="text-indigo-100/90 max-w-xl text-sm sm:text-base leading-relaxed">
              Enregistrez vos bons de commande, puis réceptionnez les livraisons pour mettre à jour le stock — avec
              traçabilité des écarts.
            </p>
          </div>
          <Link
            href="/dashboard/orders/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#3730A3] text-sm font-bold rounded-full shadow-lg shadow-black/10 hover:bg-indigo-50 transition"
          >
            <Plus className="w-4 h-4" />
            Nouvelle commande
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Total commandes</span>
            <ClipboardList className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{kpis.total}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-800/80">Ouvertes</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-amber-900">{kpis.open}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-800/80">Reçues</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-900">{kpis.received}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Annulées</span>
            <Ban className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-800">{kpis.cancelled}</p>
        </div>
      </div>

      {orgMissing && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 flex gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">ID d’organisation manquant</p>
            <p className="mt-1 text-amber-800/90">
              Connectez-vous avec un compte membre : l’organisation est enregistrée après inscription ou chargée depuis
              le profil (<code className="text-xs bg-white/80 px-1 rounded">GET /members/me</code>).
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {STATUS_FILTER.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setFilter(s.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filter === s.value
                ? "bg-[#3730A3] text-white shadow-md shadow-indigo-900/15"
                : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="rounded-[24px] border border-gray-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <span className="text-sm font-medium">Chargement des commandes…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 px-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-300">
              <ClipboardList className="w-8 h-8" />
            </div>
            <p className="text-lg font-semibold text-gray-900">Aucune commande</p>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Aucun résultat pour ce filtre. Créez une nouvelle commande fournisseur pour lancer un approvisionnement.
            </p>
            <Link
              href="/dashboard/orders/new"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
            >
              Nouvelle commande
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-gray-500">
                  <th className="px-6 py-4 font-semibold">Statut</th>
                  <th className="px-6 py-4 font-semibold">Référence / note</th>
                  <th className="px-6 py-4 font-semibold">Lignes</th>
                  <th className="px-6 py-4 font-semibold">Créée</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-indigo-50/30 transition-colors group"
                  >
                    <td className="px-6 py-4 align-middle">{statusBadge(o.status)}</td>
                    <td className="px-6 py-4 text-gray-800 max-w-[min(280px,40vw)]">
                      <span className="line-clamp-2 font-medium">{o.note || "Sans note"}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 tabular-nums">{o.lines?.length ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap text-xs sm:text-sm">
                      {o.created_at
                        ? new Date(o.created_at).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 group-hover:underline"
                      >
                        Détail
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
