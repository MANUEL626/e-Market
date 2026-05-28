"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Hash,
  Loader2,
  QrCode,
  Receipt,
  RefreshCw,
  ShoppingBasket,
  UserRound,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { getCustomerSale, getCustomerSaleHistory, getCustomerSalePickupQr } from "@/lib/api/emall-client";
import { SalesOrganizationGate } from "@/components/dashboard/dashboard-access-provider";
import { getEffectiveOrganizationId } from "@/lib/organization-resolve";
import type {
  CustomerSaleHistoryEvent,
  CustomerSaleOrderDetail,
  CustomerSaleStatus,
} from "@/lib/types/customer-sales";

const statusLabel: Record<CustomerSaleStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  in_delivery: "In delivery",
  cancelled: "Cancelled",
  completed: "Completed",
};

const statusPillClass: Record<CustomerSaleStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
  in_progress: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/80",
  in_delivery: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/80",
  cancelled: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
  completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
};

function fulfillmentLabel(value: string | undefined) {
  if (value === "pickup") return "Retrait";
  if (value === "delivery") return "Livraison";
  if (value === "walk_in_offline") return "Comptoir";
  return value ?? "—";
}

export default function CustomerSaleDetailPage() {
  return (
    <SalesOrganizationGate description="Le detail des ventes est disponible uniquement pour les organisations de vente.">
      <CustomerSaleDetailContent />
    </SalesOrganizationGate>
  );
}

function CustomerSaleDetailContent() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [mounted, setMounted] = useState(false);

  const [detail, setDetail] = useState<CustomerSaleOrderDetail | null>(null);
  const [history, setHistory] = useState<CustomerSaleHistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pickupQrOpen, setPickupQrOpen] = useState(false);
  const [pickupQrLoading, setPickupQrLoading] = useState(false);
  const [pickupQrError, setPickupQrError] = useState<string | null>(null);
  const [pickupQrImageUrl, setPickupQrImageUrl] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!orderId || !getEffectiveOrganizationId()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [sale, saleHistory] = await Promise.all([
          getCustomerSale(orderId),
          getCustomerSaleHistory(orderId).catch(() => [] as CustomerSaleHistoryEvent[]),
        ]);
        if (cancelled) return;
        setDetail(sale);
        setHistory(saleHistory);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, orderId]);

  const refreshDetail = async () => {
    if (!orderId || !getEffectiveOrganizationId()) return;
    try {
      const [sale, saleHistory] = await Promise.all([
        getCustomerSale(orderId),
        getCustomerSaleHistory(orderId).catch(() => [] as CustomerSaleHistoryEvent[]),
      ]);
      setDetail(sale);
      if (sale.order.status === "completed") {
        setPickupQrOpen(false);
      }
      setHistory(saleHistory);
    } catch {
      /* ignore silent refresh errors */
    }
  };

  const loadPickupQr = async () => {
    if (!orderId) return;
    setPickupQrLoading(true);
    setPickupQrError(null);
    try {
      const data = await getCustomerSalePickupQr(orderId);
      const url = await QRCode.toDataURL(data.qr_payload, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      setPickupQrImageUrl(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Impossible de charger le QR.";
      setPickupQrError(msg);
      setPickupQrImageUrl(null);
    } finally {
      setPickupQrLoading(false);
    }
  };

  const parseAmount = (value: unknown): number | null => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const computedTotal = useMemo(() => {
    if (!detail) return null;
    const subtotal = parseAmount(detail.order.subtotal_amount);
    if (subtotal != null) return subtotal;
    const totalAmount = parseAmount(detail.order.total_amount);
    if (totalAmount != null) return totalAmount;
    const total = detail.lines.reduce((acc, line) => {
      const p =
        typeof line.unit_price === "number"
          ? line.unit_price
          : typeof line.unit_price_snapshot === "string"
            ? Number(line.unit_price_snapshot)
            : typeof line.unit_price_snapshot === "number"
              ? line.unit_price_snapshot
              : 0;
      return acc + p * line.quantity;
    }, 0);
    return Number.isFinite(total) ? total : null;
  }, [detail]);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-28 text-gray-500">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <span className="text-sm font-medium">Chargement de la vente…</span>
      </div>
    );
  }

  if (!getEffectiveOrganizationId()) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          ID d’organisation introuvable.
        </p>
        <Link href="/dashboard/sales" className="mt-4 inline-block font-semibold text-indigo-600">
          ← Retour
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-28 text-gray-500">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <span className="text-sm font-medium">Chargement de la vente…</span>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error ?? "Vente introuvable."}
        </div>
        <Link href="/dashboard/sales" className="font-semibold text-indigo-600">
          ← Retour aux ventes
        </Link>
      </div>
    );
  }

  const { order, lines } = detail;
  const currency = order.currency ?? "XOF";
  const fulfillment = order.fulfillment_type ?? order.mode;

  const canShowPickupQr =
    fulfillment === "pickup" && order.status !== "completed" && order.status !== "cancelled";

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <Link
        href="/dashboard/sales"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la liste
      </Link>

      <div className="mb-8 rounded-[28px] border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div className="space-y-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusPillClass[order.status]}`}
            >
              {statusLabel[order.status]}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Détail vente</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Hash className="h-4 w-4 text-indigo-400" />
                <span className="font-mono text-xs text-gray-700 break-all">{order.id}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-400" />
                {new Date(order.created_at).toLocaleString("fr-FR", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>
          <div className="min-w-[220px] rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Montant total</p>
            <p className="mt-1 text-2xl font-extrabold text-indigo-900">
              {computedTotal == null
                ? "—"
                : new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency,
                  }).format(computedTotal)}
            </p>
            <p className="mt-2 text-xs text-indigo-700/80">
              Mode: <strong>{fulfillmentLabel(fulfillment)}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Client</p>
          <p className="inline-flex items-center gap-2 text-sm text-gray-700">
            <UserRound className="h-4 w-4 text-gray-400" />
            {order.external_customer_label || order.customer_id || "Non renseigné"}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</p>
          <p className="text-sm text-gray-700">{order.notes || "—"}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Synthèse</p>
          <p className="text-sm text-gray-700">
            {order.total_lines ?? lines.length} ligne(s) • {order.total_items ?? "—"} article(s)
          </p>
        </div>
      </div>

      {canShowPickupQr && (
        <div className="mb-8 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-lg font-extrabold text-gray-900">Retrait magasin (pickup)</h2>
              <p className="max-w-xl text-sm leading-relaxed text-gray-600">
                Pour finaliser la commande, le client doit scanner le code QR de validation. Chaque génération
                renvoie un nouveau payload côté serveur — affichez le QR au comptoir puis actualisez cette page
                après le scan pour voir le statut mis à jour.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setPickupQrOpen(true);
                  void loadPickupQr();
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#3730A3] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-900/15 hover:bg-[#2f2788]"
              >
                <QrCode className="h-4 w-4" />
                Afficher le QR retrait
              </button>
              <button
                type="button"
                onClick={() => void refreshDetail()}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser le statut
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4 font-bold text-gray-900">
          <ShoppingBasket className="h-5 w-5 text-indigo-500" />
          Articles de la commande
        </div>
        <div className="divide-y divide-gray-50">
          {lines.map((line) => {
            const unitPrice =
              typeof line.unit_price === "number"
                ? line.unit_price
                : typeof line.unit_price_snapshot === "string"
                  ? Number(line.unit_price_snapshot)
                  : typeof line.unit_price_snapshot === "number"
                    ? line.unit_price_snapshot
                    : null;
            const lineTotal = unitPrice == null ? null : unitPrice * line.quantity;
            return (
              <div
                key={line.id}
                className="flex flex-col justify-between gap-4 px-6 py-5 transition hover:bg-indigo-50/20 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-bold text-gray-900">
                    {line.article_name?.trim() || line.article_id}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-gray-400">{line.article_id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-700">
                    Qté: <strong className="tabular-nums">{line.quantity}</strong>
                  </span>
                  <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-indigo-800">
                    PU:{" "}
                    <strong className="tabular-nums">
                      {unitPrice == null
                        ? "—"
                        : new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency,
                          }).format(unitPrice)}
                    </strong>
                  </span>
                  <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-800 ring-1 ring-emerald-100">
                    Total:{" "}
                    <strong className="tabular-nums">
                      {lineTotal == null
                        ? "—"
                        : new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency,
                          }).format(lineTotal)}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4 font-bold text-gray-900">
          <Receipt className="h-5 w-5 text-indigo-500" />
          Historique de statut
        </div>
        <div className="divide-y divide-gray-50">
          {history.length === 0 ? (
            <p className="px-6 py-5 text-sm text-gray-500">Aucun événement d’historique disponible.</p>
          ) : (
            history.map((event) => (
              <div key={event.id} className="flex flex-col gap-1 px-6 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-gray-800">
                  <strong>{event.from_status ?? "—"}</strong> → <strong>{event.to_status}</strong>
                  {event.note ? ` • ${event.note}` : ""}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(event.created_at).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {pickupQrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-lg font-bold text-gray-900">QR — validation retrait</h3>
              <button
                type="button"
                onClick={() => {
                  setPickupQrOpen(false);
                  setPickupQrError(null);
                }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-6">
              {pickupQrLoading ? (
                <div className="flex flex-col items-center gap-3 py-10 text-gray-500">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
                  <span className="text-sm font-medium">Chargement du QR…</span>
                </div>
              ) : pickupQrError ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {pickupQrError}
                </p>
              ) : pickupQrImageUrl ? (
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={pickupQrImageUrl}
                    alt="QR code validation retrait"
                    className="rounded-xl border border-gray-100 bg-white p-2"
                    width={280}
                    height={280}
                  />
                  <p className="text-center text-xs text-gray-500">
                    Demandez au client de scanner ce code avec l’application. Le passage en « terminée » est
                    effectué côté serveur après validation du scan.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => void loadPickupQr()}
                  disabled={pickupQrLoading}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${pickupQrLoading ? "animate-spin" : ""}`} />
                  Régénérer le QR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void refreshDetail();
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  Statut à jour ?
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
