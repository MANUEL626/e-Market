"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getPrimaryMembership } from "@/lib/api/member-me";
import {
  getOrganizationSubscription,
  type OrganizationSubscription,
  type OrganizationSubscriptionEntitlements,
} from "@/lib/api/emall-client";
import { isAdminMembership } from "@/lib/authz";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { getAvatarPublicUrl } from "@/lib/supabase/avatar-url";
import { uploadOrganizationAvatar } from "@/lib/supabase/upload-avatar";
import { orgTypeLabel } from "@/lib/settings-member-labels";
import { translate } from "@/lib/i18n";
import {
  API_CURRENCY_OPTIONS,
  DEFAULT_PURCHASE_CURRENCY,
  DEFAULT_SALE_CURRENCY,
  normalizeApiCurrency,
  type ApiCurrencyCode,
} from "@/lib/currencies";
import { useOptionalDashboardAccess } from "@/components/dashboard/dashboard-access-provider";

const COUNTRY_OPTIONS = [
  { code: "BJ", label: "Benin" },
  { code: "TG", label: "Togo" },
  { code: "NG", label: "Nigeria" },
  { code: "GH", label: "Ghana" },
  { code: "CI", label: "Cote d'Ivoire" },
  { code: "SN", label: "Senegal" },
];

function formatDateFr(iso: string | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function normalizeCountries(countries: string[]): string[] {
  return Array.from(
    new Set(
      countries
        .map((country) => country.trim().toUpperCase())
        .filter((country) => /^[A-Z]{2}$/.test(country))
    )
  );
}

function planLabel(code: string | null | undefined) {
  if (!code) return "-";
  return code.charAt(0).toUpperCase() + code.slice(1);
}

function statusLabel(status: string | null | undefined) {
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

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Session expiree. Reconnectez-vous.");
  }
  return session.access_token;
}

async function readApiError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    return data.error;
  }
  if (data && typeof data === "object" && "detail" in data && typeof data.detail === "string") {
    return data.detail;
  }
  return "Mise a jour organisation echouee.";
}

export default function GeneralSettingsPage() {
  const { profile, loading, refreshProfile } = useMemberProfile();
  const dashboardAccess = useOptionalDashboardAccess();
  const primary = profile ? getPrimaryMembership(profile) : undefined;
  const org = primary?.organization;
  const t = (key: string) => translate(profile?.params?.locale, key);
  const canEdit = isAdminMembership(primary);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [purchaseCurrency, setPurchaseCurrency] =
    useState<ApiCurrencyCode>(DEFAULT_PURCHASE_CURRENCY);
  const [saleCurrency, setSaleCurrency] = useState<ApiCurrencyCode>(DEFAULT_SALE_CURRENCY);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null);
  const [entitlements, setEntitlements] =
    useState<OrganizationSubscriptionEntitlements | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  useEffect(() => {
    setName(org?.name ?? "");
    setDescription(org?.description ?? "");
    setCountries(normalizeCountries(org?.countries ?? []));
    setPurchaseCurrency(
      normalizeApiCurrency(org?.default_currencies?.purchase, DEFAULT_PURCHASE_CURRENCY)
    );
    setSaleCurrency(
      normalizeApiCurrency(org?.default_currencies?.sale, DEFAULT_SALE_CURRENCY)
    );
  }, [org]);

  useEffect(() => {
    setEntitlements(dashboardAccess?.subscriptionEntitlements ?? null);
  }, [dashboardAccess?.subscriptionEntitlements]);

  useEffect(() => {
    if (!primary?.organization_id) {
      setSubscription(null);
      setSubscriptionError(null);
      return;
    }

    let cancelled = false;
    setSubscriptionLoading(true);
    setSubscriptionError(null);
    getOrganizationSubscription(primary.organization_id)
      .then((subscriptionData) => {
        if (cancelled) return;
        setSubscription(subscriptionData);
      })
      .catch((err) => {
        if (cancelled) return;
        setSubscription(null);
        setSubscriptionError(
          err instanceof Error ? err.message : "Abonnement indisponible."
        );
      })
      .finally(() => {
        if (!cancelled) setSubscriptionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [primary?.organization_id]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const orgAvatarUrl = avatarPreview ?? getAvatarPublicUrl(org?.profile_picture);
  const normalizedCountries = useMemo(() => normalizeCountries(countries), [countries]);
  const originalCountries = useMemo(
    () => normalizeCountries(org?.countries ?? []),
    [org?.countries]
  );
  const hasOrganizationChanges = useMemo(() => {
    if (!org) return false;
    return (
      name.trim() !== org.name ||
      description.trim() !== (org.description ?? "") ||
      normalizedCountries.join("|") !== originalCountries.join("|") ||
      purchaseCurrency !==
        normalizeApiCurrency(org.default_currencies?.purchase, DEFAULT_PURCHASE_CURRENCY) ||
      saleCurrency !== normalizeApiCurrency(org.default_currencies?.sale, DEFAULT_SALE_CURRENCY) ||
      Boolean(avatarFile)
    );
  }, [
    avatarFile,
    description,
    name,
    normalizedCountries,
    org,
    originalCountries,
    purchaseCurrency,
    saleCurrency,
  ]);
  const canSubmit = Boolean(org && canEdit && hasOrganizationChanges && !saving);

  function onAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError(null);
    if (file && !file.type.startsWith("image/")) {
      setError("Selectionnez une image valide pour l'organisation.");
      event.target.value = "";
      return;
    }
    setAvatarFile(file);
  }

  function toggleCountry(countryCode: string) {
    if (!canEdit) return;
    setError(null);
    setMessage(null);
    setCountries((current) => {
      const selected = new Set(current);
      if (selected.has(countryCode)) {
        selected.delete(countryCode);
      } else {
        selected.add(countryCode);
      }
      return normalizeCountries(Array.from(selected));
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!org || !canSubmit) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const token = await getAccessToken();
      let profilePicture = org.profile_picture;

      if (avatarFile) {
        profilePicture = await uploadOrganizationAvatar(org.id, avatarFile);
      }

      const res = await fetch(`/api/organizations/${org.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          profile_picture: profilePicture,
          countries: normalizedCountries,
          default_currencies: {
            purchase: purchaseCurrency,
            sale: saleCurrency,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(await readApiError(res));
      }

      setAvatarFile(null);
      await refreshProfile();
      setMessage(t("orgUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise a jour organisation echouee.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-12 text-gray-900">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">{t("general")}</h1>
        <p className="text-gray-500 text-sm">{t("adminCanEditOrg")}</p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("loadingProfile")}
        </div>
      )}

      {!loading && !profile && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-8">
          Impossible d'afficher l'organisation :{" "}
          <Link href="/login" className="font-bold underline">
            {t("signIn")}
          </Link>
          .
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form
            id="organization-settings-form"
            onSubmit={onSubmit}
            className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm"
          >
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 shrink-0">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-indigo-100 text-sm font-extrabold text-indigo-700">
                  {orgAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={orgAvatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    org?.name?.slice(0, 2).toUpperCase() ?? "-"
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatarChange}
                />
                <button
                  type="button"
                  disabled={!canEdit || saving}
                  onClick={() => fileInputRef.current?.click()}
                  title={t("changeLogo")}
                  className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#3730A3] text-white shadow-sm disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">{t("organization")}</h2>
                <p className="text-xs text-gray-500">
                  Source : <span className="font-mono">{"PATCH /api/v1/organizations/{id}"}</span>
                </p>
              </div>
            </div>

            {!canEdit && profile && (
              <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Seuls les admins actifs peuvent modifier l'organisation.
              </div>
            )}
            {message && (
              <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">{t("organizationName")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  readOnly={!canEdit}
                  maxLength={500}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800 read-only:cursor-default read-only:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Type</label>
                <input
                  type="text"
                  readOnly
                  value={org ? orgTypeLabel(org.org_type) : "-"}
                  className="w-full bg-gray-100 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-500 cursor-default"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-600 mb-2">{t("description")}</label>
              <textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                readOnly={!canEdit}
                maxLength={10000}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800 resize-none read-only:cursor-default read-only:text-gray-500"
              />
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-xs font-semibold text-gray-600">
                Pays
              </label>
              <div className="flex flex-wrap gap-2">
                {COUNTRY_OPTIONS.map((country) => {
                  const checked = countries.includes(country.code);
                  return (
                    <button
                      key={country.code}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => toggleCountry(country.code)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                        checked
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200"
                      }`}
                    >
                      {country.code} - {country.label}
                    </button>
                  );
                })}
              </div>
              {!countries.length && (
                <p className="mt-2 text-xs font-medium text-amber-700">
                  {t("selectAtLeastOneCountry")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="purchase-currency" className="block text-xs font-semibold text-gray-600 mb-2">
                  Devise des achats
                </label>
                <select
                  id="purchase-currency"
                  value={purchaseCurrency}
                  onChange={(event) => setPurchaseCurrency(event.target.value as ApiCurrencyCode)}
                  disabled={!canEdit}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800 disabled:cursor-not-allowed disabled:text-gray-500"
                >
                  {API_CURRENCY_OPTIONS.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sale-currency" className="block text-xs font-semibold text-gray-600 mb-2">
                  Devise des ventes
                </label>
                <select
                  id="sale-currency"
                  value={saleCurrency}
                  onChange={(event) => setSaleCurrency(event.target.value as ApiCurrencyCode)}
                  disabled={!canEdit}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800 disabled:cursor-not-allowed disabled:text-gray-500"
                >
                  {API_CURRENCY_OPTIONS.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">{t("organizationId")}</label>
                <input
                  type="text"
                  readOnly
                  value={org?.id ?? "-"}
                  className="w-full bg-gray-100 border border-gray-100 rounded-xl py-3 px-4 text-xs font-mono text-gray-500 cursor-default"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">{t("createdAt")}</label>
                <input
                  type="text"
                  readOnly
                  value={formatDateFr(org?.created_at)}
                  className="w-full bg-gray-100 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-500 cursor-default"
                />
              </div>
            </div>

            {primary && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm text-gray-700">
                <span className="font-semibold text-gray-900">{t("yourRole")} </span>
                <span className="capitalize">{primary.member_type}</span>
                {primary.member_role ? (
                  <>
                    {" "}
                    <span className="text-gray-400">-</span> {primary.member_role.replace(/_/g, " ")}
                  </>
                ) : null}
                {primary.activity_status === false && (
                  <span className="ml-2 text-rose-600 font-medium">(adhesion inactive)</span>
                )}
              </div>
            )}

            <div className="mt-8 flex justify-end border-t border-gray-50 pt-6">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 rounded-full bg-[#3730A3] px-5 py-3 text-sm font-extrabold text-white shadow-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t("save")}
              </button>
            </div>
          </form>

          {profile && profile.memberships.length > 1 && (
            <div className="mt-8 bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm">
              <h2 className="text-lg font-extrabold mb-4 text-gray-900">Toutes vos organisations</h2>
              <ul className="space-y-3">
                {profile.memberships.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-xl border border-gray-100 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-gray-900">
                      {m.organization?.name ?? "Organisation indisponible"}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">{m.organization_id}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <div className="bg-white p-6 rounded-[24px] border-l-4 border-[#3730A3] border-gray-100 border-r-0 border-t-0 border-b-0 shadow-lg relative overflow-hidden h-full flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-gray-900">{t("activeOffer")}</h3>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-extrabold tracking-widest uppercase rounded-md border border-indigo-100">
                {subscriptionLoading
                  ? "..."
                  : statusLabel(entitlements?.status ?? subscription?.status)}
              </span>
            </div>
            {subscriptionLoading ? (
              <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement de l'abonnement...
              </div>
            ) : subscriptionError ? (
              <p className="mb-6 text-sm font-semibold text-rose-700">
                {subscriptionError}
              </p>
            ) : (
              <>
                <div className="mb-2 text-4xl font-black text-gray-900">
                  {subscription?.plan_details?.name ??
                    planLabel(entitlements?.plan ?? subscription?.plan)}
                </div>
                <p className="mb-6 text-[11px] text-gray-500">
                  Source : abonnement interne API
                  {subscription?.current_period_end
                    ? ` · fin de periode ${formatDateFr(subscription.current_period_end)}`
                    : ""}
                </p>
                {entitlements?.is_active === false && (
                  <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                    Abonnement inactif : certaines fonctionnalites peuvent etre limitees.
                  </p>
                )}
              </>
            )}
            <Link
              href="/settings/billing"
              className="block w-full py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-sm rounded-full transition shadow-sm text-center"
            >
              {t("billing")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
