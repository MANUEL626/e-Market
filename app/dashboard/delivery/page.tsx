"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Crosshair,
  Loader2,
  MapPin,
  Radio,
  RefreshCw,
  Route,
  QrCode,
  Send,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { getPrimaryMembership, loadMemberProfileForSession } from "@/lib/api/member-me";
import { isAdminProfile } from "@/lib/authz";
import {
  assignCustomerSaleDelivery,
  createDeliveryAssignmentTrackPoint,
  getCustomerSaleDeliveryQr,
  getCustomerSaleDeliveryTrack,
  listCustomerSales,
  listDeliveryAssignments,
  listOrganizationMembers,
} from "@/lib/api/emall-client";
import { getEffectiveOrganizationId } from "@/lib/organization-resolve";
import { createClient } from "@/lib/supabase/client";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { translate } from "@/lib/i18n";
import type { OrganizationMember } from "@/lib/types/organization-members";
import type {
  CustomerSaleDeliveryTrackPoint,
  CustomerSaleOrderDetail,
  CustomerSaleStatus,
} from "@/lib/types/customer-sales";

const statusLabel: Record<CustomerSaleStatus, string> = {
  pending: "En attente",
  in_progress: "Preparation",
  in_delivery: "En livraison",
  cancelled: "Annulee",
  completed: "Terminee",
};

const statusClass: Record<CustomerSaleStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
  in_progress: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/80",
  in_delivery: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/80",
  cancelled: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
  completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
};

function isDeliveryOrder(detail: CustomerSaleOrderDetail) {
  const mode = detail.order.fulfillment_type ?? detail.order.mode;
  return mode === "delivery";
}

function displayCustomer(detail: CustomerSaleOrderDetail) {
  return detail.order.external_customer_label || detail.order.customer_id || "Client non renseigne";
}

function initials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CL";
}

function parsePoint(row: Record<string, unknown>): CustomerSaleDeliveryTrackPoint | null {
  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    id: String(row.id ?? `${row.order_id ?? "order"}-${row.recorded_at ?? Date.now()}`),
    order_id: String(row.order_id ?? ""),
    latitude,
    longitude,
    accuracy_meters: (() => {
      if (row.accuracy_meters == null || row.accuracy_meters === "") return null;
      const value = Number(row.accuracy_meters);
      return Number.isFinite(value) ? value : null;
    })(),
    recorded_at: String(row.recorded_at ?? new Date().toISOString()),
  };
}

function mergeTrackPoints(
  previous: CustomerSaleDeliveryTrackPoint[],
  incoming: CustomerSaleDeliveryTrackPoint[]
) {
  const map = new Map<string, CustomerSaleDeliveryTrackPoint>();
  for (const point of previous) map.set(point.id, point);
  for (const point of incoming) map.set(point.id, point);
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function DeliveryMap({ points }: { points: CustomerSaleDeliveryTrackPoint[] }) {
  const projected = useMemo(() => {
    if (points.length === 0) return [];
    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = Math.max(maxLat - minLat, 0.001);
    const lngSpan = Math.max(maxLng - minLng, 0.001);
    return points.map((p) => ({
      point: p,
      x: 10 + ((p.longitude - minLng) / lngSpan) * 80,
      y: 90 - ((p.latitude - minLat) / latSpan) * 80,
    }));
  }, [points]);

  const latest = projected.at(-1);
  const polyline = projected.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-[8px] border border-slate-800 bg-[#101827] shadow-sm">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_28%,rgba(14,165,233,0.18),transparent_26%),radial-gradient(circle_at_78%_72%,rgba(16,185,129,0.14),transparent_24%)]" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {projected.length > 1 ? (
          <polyline
            points={polyline}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="3 2"
          />
        ) : null}
      </svg>

      {projected.map(({ point, x, y }, index) => (
        <span
          key={point.id}
          className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ${
            index === projected.length - 1
              ? "bg-emerald-400 ring-emerald-400/25"
              : "bg-sky-400 ring-sky-400/20"
          }`}
          style={{ left: `${x}%`, top: `${y}%` }}
          title={formatDate(point.recorded_at)}
        />
      ))}

      <div className="absolute left-4 top-4 rounded-[8px] border border-white/10 bg-slate-950/80 px-4 py-3 text-white backdrop-blur">
        <p className="text-xs font-semibold uppercase text-slate-300">Carte temps reel</p>
        <p className="mt-1 text-lg font-extrabold">{points.length} point(s)</p>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-200 backdrop-blur">
        {latest ? (
          <>
            <span className="inline-flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-emerald-300" />
              {latest.point.latitude.toFixed(5)}, {latest.point.longitude.toFixed(5)}
            </span>
            <span className="text-slate-400">{formatDate(latest.point.recorded_at)}</span>
          </>
        ) : (
          <span className="inline-flex items-center gap-2 text-slate-300">
            <MapPin className="h-4 w-4" />
            Aucun point GPS recu pour cette livraison.
          </span>
        )}
      </div>
    </div>
  );
}

export default function DeliveryPage() {
  const { profile } = useMemberProfile();
  const t = (key: string) => translate(profile?.params?.locale, key);
  const [orders, setOrders] = useState<CustomerSaleOrderDetail[]>([]);
  const [assignments, setAssignments] = useState<CustomerSaleOrderDetail[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [currentMemberRole, setCurrentMemberRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackPoints, setTrackPoints] = useState<CustomerSaleDeliveryTrackPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackLoading, setTrackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [assignMemberId, setAssignMemberId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [postingLocation, setPostingLocation] = useState(false);
  const [watching, setWatching] = useState(false);
  const [deliveryQrOpen, setDeliveryQrOpen] = useState(false);
  const [deliveryQrLoading, setDeliveryQrLoading] = useState(false);
  const [deliveryQrError, setDeliveryQrError] = useState<string | null>(null);
  const [deliveryQrImageUrl, setDeliveryQrImageUrl] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const pointsRef = useRef<CustomerSaleDeliveryTrackPoint[]>([]);

  useEffect(() => {
    pointsRef.current = trackPoints;
  }, [trackPoints]);

  const deliveryMembers = useMemo(
    () =>
      members.filter(
        (member) => member.activity_status && member.member_role === "delivery_management"
      ),
    [members]
  );

  const selected = useMemo(() => {
    if (!selectedOrderId) return null;
    return (
      orders.find((row) => row.order.id === selectedOrderId) ??
      assignments.find((row) => row.order.id === selectedOrderId) ??
      null
    );
  }, [assignments, orders, selectedOrderId]);

  const selectedAssignedMember = useMemo(() => {
    const memberId = selected?.order.assigned_delivery_member_id;
    if (!memberId) return null;
    return members.find((member) => member.id === memberId) ?? null;
  }, [members, selected?.order.assigned_delivery_member_id]);

  const selectedAssignedMemberLabel = useMemo(() => {
    if (!selectedAssignedMember) return null;
    const user = selectedAssignedMember.user;
    return (
      [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
      user.username ||
      user.email
    );
  }, [selectedAssignedMember]);

  const isDeliveryMember = currentMemberRole === "delivery_management";
  const canManageSelectedDelivery =
    isDeliveryMember &&
    Boolean(selected?.order.assigned_delivery_member_id) &&
    selected?.order.assigned_delivery_member_id === currentMemberId;
  const selectedAlreadyAssigned = Boolean(selected?.order.assigned_delivery_member_id);

  const kpis = useMemo(() => {
    const active = orders.filter((row) => row.order.status === "in_delivery").length;
    const preparation = orders.filter((row) => row.order.status === "in_progress").length;
    const pending = orders.filter((row) => row.order.status === "pending").length;
    const completed = orders.filter((row) => row.order.status === "completed").length;
    return { active, preparation, pending, completed };
  }, [orders]);

  const loadData = useCallback(async () => {
    setError(null);
    const profile = await loadMemberProfileForSession();
    const primaryMembership = profile ? getPrimaryMembership(profile) : undefined;
    setCurrentMemberId(primaryMembership?.id ?? null);
    setCurrentMemberRole(primaryMembership?.member_role ?? null);
    setIsAdmin(isAdminProfile(profile));
    if (!getEffectiveOrganizationId()) {
      setOrders([]);
      setAssignments([]);
      setMembers([]);
      throw new Error("ID d'organisation introuvable.");
    }
    const [sales, assigned, orgMembers] = await Promise.all([
      listCustomerSales(),
      listDeliveryAssignments().catch(() => [] as CustomerSaleOrderDetail[]),
      listOrganizationMembers().catch(() => [] as OrganizationMember[]),
    ]);
    const deliveryOrders = sales.filter(isDeliveryOrder);
    const assignedDelivery = assigned.filter(isDeliveryOrder);
    const assignedFromSales =
      primaryMembership?.member_role === "delivery_management"
        ? deliveryOrders.filter(
            (detail) => detail.order.assigned_delivery_member_id === primaryMembership.id
          )
        : [];
    const assignedById = new Map<string, CustomerSaleOrderDetail>();
    for (const detail of assignedDelivery) assignedById.set(detail.order.id, detail);
    for (const detail of assignedFromSales) assignedById.set(detail.order.id, detail);
    const effectiveAssignedDelivery = Array.from(assignedById.values());
    const visibleDeliveryOrders =
      primaryMembership?.member_role === "delivery_management"
        ? effectiveAssignedDelivery
        : deliveryOrders;
    setOrders(visibleDeliveryOrders);
    setAssignments(effectiveAssignedDelivery);
    setMembers(orgMembers);
    setSelectedOrderId(
      (current) =>
        current && visibleDeliveryOrders.some((detail) => detail.order.id === current)
          ? current
          : visibleDeliveryOrders[0]?.order.id ?? null
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await loadData();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  useEffect(() => {
    if (!selectedOrderId) {
      setTrackPoints([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setTrackLoading(true);
        setTrackError(null);
        const points = await getCustomerSaleDeliveryTrack(selectedOrderId, { limit: 300 });
        if (!cancelled) setTrackPoints(points);
      } catch (e) {
        if (!cancelled) {
          setTrackPoints([]);
          setTrackError(e instanceof Error ? e.message : "Suivi GPS indisponible");
        }
      } finally {
        if (!cancelled) setTrackLoading(false);
      }
    })();

    let realtime:
      | {
          remove: () => void;
        }
      | null = null;
    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`delivery-track:${selectedOrderId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "customer_sale_delivery_track_points",
            filter: `order_id=eq.${selectedOrderId}`,
          },
          (payload) => {
            const next = parsePoint(payload.new as Record<string, unknown>);
            if (next) setTrackPoints((prev) => mergeTrackPoints(prev, [next]));
          }
        )
        .subscribe();
      realtime = {
        remove: () => {
          void supabase.removeChannel(channel);
        },
      };
    } catch {
      setTrackError("Realtime indisponible; bascule en polling HTTP.");
    }

    const interval = window.setInterval(async () => {
      const latest = pointsRef.current.at(-1);
      try {
        const delta = await getCustomerSaleDeliveryTrack(selectedOrderId, {
          since: latest?.recorded_at ?? null,
          limit: 100,
        });
        if (delta.length > 0) {
          setTrackPoints((prev) => mergeTrackPoints(prev, delta));
        }
      } catch {
        /* Realtime is the primary channel; polling stays as a quiet fallback. */
      }
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      realtime?.remove();
    };
  }, [selectedOrderId]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const assignSelectedOrder = async () => {
    if (!selected || !assignMemberId || !isAdmin || selectedAlreadyAssigned) return;
    try {
      setAssigning(true);
      setError(null);
      await assignCustomerSaleDelivery(selected.order.id, { member_id: assignMemberId });
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assignation impossible");
    } finally {
      setAssigning(false);
    }
  };

  const postLocation = async (coords: GeolocationCoordinates) => {
    if (!selectedOrderId || !canManageSelectedDelivery) return;
    await createDeliveryAssignmentTrackPoint(selectedOrderId, {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy_meters: Number.isFinite(coords.accuracy) ? coords.accuracy : null,
    });
  };

  const sendCurrentLocation = async () => {
    if (!selectedOrderId || !canManageSelectedDelivery || !navigator.geolocation) return;
    setPostingLocation(true);
    setTrackError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void postLocation(position.coords)
          .catch((e) => setTrackError(e instanceof Error ? e.message : "Position refusee"))
          .finally(() => setPostingLocation(false));
      },
      (geoError) => {
        setTrackError(geoError.message || "Geolocalisation refusee");
        setPostingLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  };

  const toggleWatch = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setWatching(false);
      return;
    }
    if (!selectedOrderId || !canManageSelectedDelivery || !navigator.geolocation) {
      setTrackError("Geolocalisation indisponible sur ce navigateur.");
      return;
    }
    setWatching(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        void postLocation(position.coords).catch((e) =>
          setTrackError(e instanceof Error ? e.message : "Position refusee")
        );
      },
      (geoError) => {
        setTrackError(geoError.message || "Geolocalisation refusee");
        setWatching(false);
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    );
  };

  const loadDeliveryQr = async () => {
    if (!selectedOrderId || !canManageSelectedDelivery) return;
    setDeliveryQrLoading(true);
    setDeliveryQrError(null);
    try {
      const data = await getCustomerSaleDeliveryQr(selectedOrderId);
      const url = await QRCode.toDataURL(data.qr_payload, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      setDeliveryQrImageUrl(url);
    } catch (e) {
      setDeliveryQrError(e instanceof Error ? e.message : "QR livraison indisponible");
      setDeliveryQrImageUrl(null);
    } finally {
      setDeliveryQrLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] pb-12">
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-100">
            <Radio className="h-3.5 w-3.5" />
            Suivi GPS hybride: API + Realtime
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{t("deliveries")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">{t("deliveryIntro")}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          {t("refresh")}
        </button>
      </div>

      {error ? (
        <div className="mb-6 flex gap-3 rounded-[8px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t("inDelivery"), value: kpis.active, icon: Truck, tone: "text-sky-700 bg-sky-50" },
          { label: t("inProgress"), value: kpis.preparation, icon: Clock3, tone: "text-indigo-700 bg-indigo-50" },
          { label: "Pending", value: kpis.pending, icon: Route, tone: "text-amber-700 bg-amber-50" },
          { label: t("completed"), value: kpis.completed, icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50" },
        ].map((item) => (
          <div key={item.label} className="rounded-[8px] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">{item.label}</span>
              <span className={`rounded-[8px] p-2 ${item.tone}`}>
                <item.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[8px] border border-gray-100 bg-white py-24 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <span className="text-sm font-medium">{t("loadingDeliveries")}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[430px_1fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[8px] border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="font-extrabold text-gray-900">{t("deliveryOrders")}</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {orders.length}{" "}
                  {isDeliveryMember
                    ? "livraison(s) attribuee(s) au membre connecte"
                    : "commande(s) cote marchand"}
                </p>
              </div>
              <div className="max-h-[560px] overflow-y-auto">
                {orders.length === 0 ? (
                  <p className="px-5 py-10 text-sm text-gray-500">
                    {isDeliveryMember
                      ? "Aucune livraison ne vous est attribuee pour le moment."
                      : "Aucune commande de livraison pour le moment."}
                  </p>
                ) : (
                  orders.map((detail) => {
                    const active = detail.order.id === selectedOrderId;
                    const label = displayCustomer(detail);
                    return (
                      <button
                        key={detail.order.id}
                        type="button"
                        onClick={() => setSelectedOrderId(detail.order.id)}
                        className={`w-full border-b border-gray-50 px-5 py-4 text-left transition last:border-0 ${
                          active ? "bg-sky-50/80" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                              {initials(label)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-gray-900">{label}</p>
                              <p className="truncate font-mono text-[11px] text-gray-400">{detail.order.id}</p>
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass[detail.order.status]}`}>
                            {statusLabel[detail.order.status]}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span>{formatDate(detail.order.created_at)}</span>
                          <span>{detail.order.total_items ?? "-"} article(s)</span>
                          <span>
                            {detail.order.assigned_delivery_member_id
                              ? `Livreur: ${
                                  members.find(
                                    (member) =>
                                      member.id === detail.order.assigned_delivery_member_id
                                  )?.user.email ?? "assigne"
                                }`
                              : "Non assignee"}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          <div className="space-y-6">
            <div className="rounded-[8px] border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">
                    {selected ? displayCustomer(selected) : "Selectionne une livraison"}
                  </h2>
                  <p className="mt-1 break-all font-mono text-xs text-gray-400">
                    {selected?.order.id ?? "Aucune commande active"}
                  </p>
                </div>
                {selected ? (
                  <div className="flex flex-wrap gap-2">
                    {canManageSelectedDelivery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryQrOpen(true);
                          void loadDeliveryQr();
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3730A3] px-4 py-2 text-sm font-bold text-white hover:bg-[#2f2788]"
                      >
                        <QrCode className="h-4 w-4" />
                        QR livraison
                      </button>
                    ) : null}
                    <Link
                      href={`/dashboard/sales/${selected.order.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                    >
                      <UserRound className="h-4 w-4" />
                      Detail vente
                    </Link>
                  </div>
                ) : null}
              </div>

              <DeliveryMap points={trackPoints} />

              {trackLoading ? (
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement du trace...
                </p>
              ) : null}
              {trackError ? (
                <p className="mt-3 rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {trackError}
                </p>
              ) : null}
            </div>

            {((isAdmin && !selectedAlreadyAssigned) || isDeliveryMember) ? (
              <div
                className={`grid grid-cols-1 gap-4 ${
                  isAdmin && !selectedAlreadyAssigned && isDeliveryMember ? "lg:grid-cols-2" : ""
                }`}
              >
              {isAdmin && !selectedAlreadyAssigned ? (
                <div className="rounded-[8px] border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 font-extrabold text-gray-900">Assigner un livreur</h3>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                      value={assignMemberId}
                      onChange={(e) => setAssignMemberId(e.target.value)}
                      className="min-w-0 flex-1 rounded-[8px] border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400"
                      disabled={!selected}
                    >
                      <option value="">Choisir un membre livraison</option>
                      {deliveryMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.user.first_name || member.user.username || member.user.email} {member.user.last_name ?? ""}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void assignSelectedOrder()}
                      disabled={!selected || !assignMemberId || assigning}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3730A3] px-4 py-2 text-sm font-bold text-white hover:bg-[#2f2788] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                      Assigner
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Le backend place la commande en livraison et le livreur pourra obtenir le QR de validation.
                  </p>
                </div>
              ) : null}

              {isDeliveryMember ? (
                <div className="rounded-[8px] border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 font-extrabold text-gray-900">Publier la position</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void sendCurrentLocation()}
                      disabled={!canManageSelectedDelivery || postingLocation}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {postingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Envoyer maintenant
                    </button>
                    <button
                      type="button"
                      onClick={toggleWatch}
                      disabled={!canManageSelectedDelivery}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
                        watching
                          ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Radio className="h-4 w-4" />
                      {watching ? "Arreter le suivi" : "Suivi continu"}
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    {canManageSelectedDelivery
                      ? "Action reservee au livreur assigne. Les points POST declenchent ensuite Realtime sur la carte."
                      : selectedAssignedMemberLabel
                        ? `Cette livraison est assignee a ${selectedAssignedMemberLabel}.`
                        : "Selectionnez une livraison qui vous est assignee pour publier la position."}
                  </p>
                </div>
              ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {deliveryQrOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-[8px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-lg font-bold text-gray-900">QR validation livraison</h3>
              <button
                type="button"
                onClick={() => {
                  setDeliveryQrOpen(false);
                  setDeliveryQrError(null);
                }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-6">
              {deliveryQrLoading ? (
                <div className="flex flex-col items-center gap-3 py-10 text-gray-500">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
                  <span className="text-sm font-medium">Chargement du QR...</span>
                </div>
              ) : deliveryQrError ? (
                <p className="rounded-[8px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {deliveryQrError}
                </p>
              ) : deliveryQrImageUrl ? (
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={deliveryQrImageUrl}
                    alt="QR code validation livraison"
                    className="rounded-[8px] border border-gray-100 bg-white p-2"
                    width={280}
                    height={280}
                  />
                  <p className="text-center text-xs text-gray-500">
                    Reserve au livreur assigne. Le scan client finalise la livraison cote backend.
                  </p>
                </div>
              ) : null}
              <div className="flex justify-end border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => void loadDeliveryQr()}
                  disabled={deliveryQrLoading}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${deliveryQrLoading ? "animate-spin" : ""}`} />
                  Regenerer
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
