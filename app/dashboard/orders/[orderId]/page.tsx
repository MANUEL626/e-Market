"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  PackageCheck,
  Ban,
  AlertCircle,
  Hash,
  Calendar,
  Box,
} from "lucide-react";
import {
  getArticleOrder,
  listArticles,
  receiveArticleOrder,
  cancelArticleOrder,
} from "@/lib/api/emall-client";
import { loadMemberProfileForSession } from "@/lib/api/member-me";
import { getEffectiveOrganizationId } from "@/lib/organization-resolve";
import type {
  ArticleOrder,
  ArticleOrderLine,
  OrderStatus,
  OrganizationArticle,
} from "@/lib/types/article-orders";

function statusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    open: "Ouverte — en attente de réception",
    received: "Reçue — stock mis à jour",
    cancelled: "Annulée",
  };
  return labels[status];
}

function statusPill(status: OrderStatus) {
  const styles: Record<OrderStatus, string> = {
    open: "bg-amber-100 text-amber-900 ring-amber-200/80",
    received: "bg-emerald-100 text-emerald-900 ring-emerald-200/80",
    cancelled: "bg-slate-100 text-slate-700 ring-slate-200/80",
  };
  const short: Record<OrderStatus, string> = {
    open: "Ouverte",
    received: "Reçue",
    cancelled: "Annulée",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${styles[status]}`}
    >
      {short[status]}
    </span>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<ArticleOrder | null>(null);
  const [articles, setArticles] = useState<OrganizationArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [receiveQty, setReceiveQty] = useState<Record<string, number>>({});
  const [shortage, setShortage] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const articleNameById = useMemo(() => {
    const m = new Map<string, string>();
    articles.forEach((a) => m.set(a.id, a.name));
    return m;
  }, [articles]);

  useEffect(() => {
    if (!orderId || !getEffectiveOrganizationId()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await loadMemberProfileForSession();
        const [o, arts] = await Promise.all([
          getArticleOrder(orderId),
          listArticles(false).catch(() => [] as OrganizationArticle[]),
        ]);
        if (cancelled) return;
        setOrder(o);
        setArticles(arts);
        const lines = o.lines ?? [];
        const qty: Record<string, number> = {};
        lines.forEach((l) => {
          const ordered = l.quantity_ordered;
          const already = l.quantity_received;
          qty[l.id] =
            typeof already === "number" && already >= 0
              ? already
              : ordered;
        });
        setReceiveQty(qty);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erreur");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const lines = order?.lines ?? [];
  const noLineReceivedYet = lines.every(
    (l) => l.quantity_received == null || l.quantity_received === undefined
  );
  const canReceive = order?.status === "open" && lines.length > 0 && noLineReceivedYet;
  const canCancel = order?.status === "open" && noLineReceivedYet;

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !canReceive) return;
    setError(null);
    const payload: {
      line_id: string;
      quantity_received: number;
      shortage_reason?: string | null;
    }[] = [];
    for (const line of lines) {
      const q = Math.floor(Number(receiveQty[line.id] ?? 0));
      if (q < 0 || q > line.quantity_ordered) {
        setError(
          `Quantité invalide pour une ligne (${q} / commandé ${line.quantity_ordered}).`
        );
        return;
      }
      if (q < line.quantity_ordered) {
        const reason = (shortage[line.id] ?? "").trim();
        if (!reason) {
          setError(
            "Indiquez un motif d’écart pour toute quantité reçue inférieure à la quantité commandée."
          );
          return;
        }
        payload.push({
          line_id: line.id,
          quantity_received: q,
          shortage_reason: reason,
        });
      } else {
        payload.push({
          line_id: line.id,
          quantity_received: q,
        });
      }
    }
    setSubmitting(true);
    try {
      await receiveArticleOrder(order.id, payload);
      setError(null);
      const refreshed = await getArticleOrder(order.id);
      setOrder(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Réception impossible");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!order || !canCancel) return;
    if (!confirm("Annuler cette commande ? Aucune réception ne doit encore avoir été faite.")) {
      return;
    }
    setCancelSubmitting(true);
    setError(null);
    try {
      await cancelArticleOrder(order.id);
      router.refresh();
      const refreshed = await getArticleOrder(order.id);
      setOrder(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Annulation impossible");
    } finally {
      setCancelSubmitting(false);
    }
  };

  if (!getEffectiveOrganizationId()) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm">
          ID d’organisation introuvable.
        </p>
        <Link href="/dashboard/orders" className="inline-block mt-4 text-indigo-600 font-semibold">
          ← Retour
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-gray-500 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
        <span className="text-sm font-medium">Chargement de la commande…</span>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 mb-4">
          {error}
        </div>
        <Link href="/dashboard/orders" className="text-indigo-600 font-semibold">
          ← Retour aux commandes
        </Link>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 mb-8 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la liste
      </Link>

      <div className="rounded-[28px] border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {statusPill(order.status)}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Détail commande</h1>
            <p className="text-gray-600">{statusLabel(order.status)}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-indigo-400" />
                <span className="font-mono text-xs text-gray-700 break-all">{order.id}</span>
              </span>
              {order.created_at && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  {new Date(order.created_at).toLocaleString("fr-FR", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </span>
              )}
            </div>
          </div>
          {canCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border-2 border-rose-100 bg-rose-50 text-rose-800 text-sm font-bold hover:bg-rose-100 disabled:opacity-50 transition"
            >
              {cancelSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              Annuler
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-[24px] border border-gray-100 bg-gradient-to-br from-gray-50/80 to-white p-6 mb-8">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Note fournisseur</h2>
        <p className="text-gray-900 text-lg leading-relaxed">{order.note?.trim() ? order.note : "—"}</p>
      </div>

      <div className="rounded-[24px] border border-gray-100 bg-white shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 font-bold text-gray-900">
          <Box className="w-5 h-5 text-indigo-500" />
          Lignes commandées
        </div>
        <div className="divide-y divide-gray-50">
          {lines.map((line: ArticleOrderLine) => {
            const name = articleNameById.get(line.article_id) ?? line.article_id;
            return (
              <div
                key={line.id}
                className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-indigo-50/20 transition"
              >
                <div>
                  <p className="font-bold text-gray-900">{name}</p>
                  <p className="text-[11px] text-gray-400 font-mono mt-1">{line.article_id}</p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-700">
                    Commandé : <strong className="tabular-nums">{line.quantity_ordered}</strong>
                  </span>
                  {typeof line.quantity_received === "number" && (
                    <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-800 ring-1 ring-emerald-100">
                      Reçu : <strong className="tabular-nums">{line.quantity_received}</strong>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {canReceive && (
        <form
          onSubmit={handleReceive}
          className="rounded-[24px] border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/40 p-8 space-y-8 shadow-inner"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-900/20">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Réception marchandise</h2>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                Indiquez les quantités réellement arrivées. Si une quantité est inférieure à la commande, le{" "}
                <strong>motif</strong> est obligatoire. Le stock sera crédité des quantités reçues.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {lines.map((line: ArticleOrderLine) => (
              <div
                key={line.id}
                className="rounded-2xl border border-white bg-white/90 p-5 shadow-sm space-y-4"
              >
                <p className="font-bold text-gray-900">
                  {articleNameById.get(line.article_id) ?? line.article_id}
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Quantité reçue (max {line.quantity_ordered})
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={line.quantity_ordered}
                      value={receiveQty[line.id] ?? ""}
                      onChange={(e) =>
                        setReceiveQty((prev) => ({
                          ...prev,
                          [line.id]: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm tabular-nums focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400"
                    />
                  </div>
                  {(receiveQty[line.id] ?? line.quantity_ordered) < line.quantity_ordered && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-rose-600 uppercase tracking-wide mb-1.5">
                        Motif d’écart (obligatoire)
                      </label>
                      <input
                        type="text"
                        value={shortage[line.id] ?? ""}
                        onChange={(e) =>
                          setShortage((prev) => ({ ...prev, [line.id]: e.target.value }))
                        }
                        placeholder="Ex. casse, manquant à la livraison…"
                        className="w-full px-4 py-3 rounded-xl border border-rose-100 bg-rose-50/30 text-sm focus:ring-2 focus:ring-rose-200/50"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting || lines.length === 0}
            className="inline-flex items-center gap-2 px-10 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold rounded-full shadow-lg shadow-emerald-900/10 transition"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <PackageCheck className="w-4 h-4" />
                Valider la réception
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
