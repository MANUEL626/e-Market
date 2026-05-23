"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Camera,
  ChevronRight,
  Loader2,
  Save,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { getPrimaryMembership } from "@/lib/api/member-me";
import {
  displayNameFromUser,
  initialsFromUser,
} from "@/lib/member-profile-storage";
import { getAvatarPublicUrl } from "@/lib/supabase/avatar-url";
import { uploadMemberAvatar } from "@/lib/supabase/upload-avatar";
import { orgTypeLabel } from "@/lib/settings-member-labels";
import { languageLabel, LOCALE_OPTIONS, translate } from "@/lib/i18n";

function formatDateFr(iso: string | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function localeLabel(value: string | undefined): string {
  return languageLabel(value);
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
  return "Mise a jour echouee.";
}

export default function ProfileSettingsPage() {
  const { profile, loading, refreshProfile } = useMemberProfile();
  const user = profile?.user;
  const primary = profile ? getPrimaryMembership(profile) : undefined;
  const org = primary?.organization;
  const t = (key: string) => translate(profile?.params?.locale, key);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [locale, setLocale] = useState("fr");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(user?.first_name ?? "");
    setLastName(user?.last_name ?? "");
    setUsername(user?.username ?? "");
    setLocale(profile?.params?.locale ?? "fr");
  }, [profile, user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const authConfirmed =
    profile?.auth && typeof profile.auth === "object" && "email_confirmed_at" in profile.auth
      ? (profile.auth as { email_confirmed_at?: string }).email_confirmed_at
      : undefined;

  const fullName = user ? displayNameFromUser(user) : "-";
  const initials = user ? initialsFromUser(user) : "?";
  const userAvatarUrl = avatarPreview ?? getAvatarPublicUrl(user?.profile_picture);
  const orgAvatarUrl = getAvatarPublicUrl(org?.profile_picture);

  const hasProfileChanges = useMemo(() => {
    if (!user) return false;
    return (
      firstName.trim() !== (user.first_name ?? "") ||
      lastName.trim() !== (user.last_name ?? "") ||
      username.trim() !== (user.username ?? "") ||
      locale !== (profile?.params?.locale ?? "fr") ||
      Boolean(avatarFile)
    );
  }, [avatarFile, firstName, lastName, locale, profile?.params?.locale, user, username]);

  const canSubmit = useMemo(
    () => Boolean(user && hasProfileChanges && !saving),
    [hasProfileChanges, user, saving]
  );

  function onAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError(null);
    if (file && !file.type.startsWith("image/")) {
      setError("Selectionnez une image valide pour le profil.");
      event.target.value = "";
      return;
    }
    setAvatarFile(file);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !hasProfileChanges) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const token = await getAccessToken();
      let profilePicture = user.profile_picture;

      if (avatarFile) {
        profilePicture = await uploadMemberAvatar(user.id, avatarFile);
      }

      const profileRes = await fetch("/api/members/me/profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          username: username.trim() || user.username,
          profile_picture: profilePicture,
        }),
      });

      if (!profileRes.ok) {
        throw new Error(await readApiError(profileRes));
      }

      const paramsRes = await fetch("/api/members/me/params", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ locale }),
      });

      if (!paramsRes.ok) {
        throw new Error(await readApiError(paramsRes));
      }

      setAvatarFile(null);
      await refreshProfile();
      setMessage(t("profileUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise a jour echouee.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-12 text-gray-900">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">{t("profile")}</h1>
        <p className="text-gray-500 text-sm">{t("profileIntro")}</p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("loadingProfile")}
        </div>
      )}

      {!loading && !profile && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-8">
          {t("noProfileData")}{" "}
          <Link href="/login" className="font-bold underline">
            {t("signIn")}
          </Link>
          .
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <div className="h-px bg-gray-200 flex-1"></div>
        <span className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase px-4">
          {t("accountUser")}
        </span>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form id="member-profile-form" onSubmit={onSubmit} className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center mb-8">
              <div className="relative h-24 w-24 shrink-0">
                <div className="h-24 w-24 rounded-full overflow-hidden shadow-sm border-4 border-white bg-indigo-100 flex items-center justify-center">
                  {userAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userAvatarUrl} alt={fullName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-extrabold text-indigo-700">{initials}</span>
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
                  disabled={!user || saving}
                  onClick={() => fileInputRef.current?.click()}
                  title={t("changeImage")}
                  className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-[#3730A3] text-white flex items-center justify-center border-2 border-white shadow-sm disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">{t("profile")}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Ces champs utilisent PATCH /api/v1/members/me/profile.
                </p>
              </div>
            </div>

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
                <label className="block text-xs font-semibold text-gray-600 mb-2">{t("firstName")}</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  maxLength={50}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">{t("lastName")}</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  maxLength={50}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">{t("username")}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  maxLength={50}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">{t("currentLanguage")}</label>
                <select
                  value={locale}
                  onChange={(event) => setLocale(event.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800"
                >
                  {LOCALE_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">{t("email")}</label>
                <input
                  type="email"
                  readOnly
                  value={user?.email ?? "-"}
                  className="w-full bg-gray-100 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-500 cursor-default"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">{t("phone")}</label>
                <input
                  type="text"
                  readOnly
                  value={user?.phone ?? "-"}
                  className="w-full bg-gray-100 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-500 cursor-default"
                />
              </div>
            </div>

            {org && (
              <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-100 text-xs font-extrabold text-indigo-700">
                    {orgAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={orgAvatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      org.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">{t("orgMain")} </span>
                    {org.name}
                    <span className="text-gray-500"> - {orgTypeLabel(org.org_type)}</span>
                    {org.countries?.length ? (
                      <div className="mt-1 text-xs text-gray-500">Pays : {org.countries.join(", ")}</div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-gray-50 mt-6">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 rounded-full bg-[#3730A3] px-5 py-3 text-sm font-extrabold text-white shadow-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t("save")}
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold">{t("security")}</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-3 -mx-3 rounded-xl transition">
                <div>
                  <div className="text-sm font-bold text-gray-900">{t("password")}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Gere par Supabase</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              <div
                className={`border p-4 rounded-xl flex items-center justify-between ${
                  authConfirmed ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
                }`}
              >
                <div>
                  <div
                    className={`text-[11px] font-extrabold tracking-widest uppercase ${
                      authConfirmed ? "text-emerald-800" : "text-amber-800"
                    }`}
                  >
                    {t("emailConfirmed")}
                  </div>
                  <div className={`text-xs mt-1 ${authConfirmed ? "text-emerald-600" : "text-amber-700"}`}>
                    {authConfirmed ? formatDateFr(authConfirmed) : t("notConfirmed")}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full shrink-0 ${authConfirmed ? "bg-emerald-500" : "bg-amber-400"}`} />
              </div>

              <div className="text-[11px] text-gray-500 px-1">
                {t("technicalId")} <span className="font-mono text-gray-700">{user?.id ?? "-"}</span>
              </div>
              <div className="text-[11px] text-gray-500 px-1">
                {t("currentLanguage")} : <span className="font-semibold text-gray-700">{localeLabel(profile?.params?.locale)}</span>
              </div>
              <div className="text-[11px] text-gray-500 px-1">
                {t("typeAccount")} <span className="font-semibold text-gray-700">{user?.user_type ?? "-"}</span>
              </div>
              <div className="text-[11px] text-gray-500 px-1">
                {t("createdAt")} : <span className="font-semibold text-gray-700">{formatDateFr(user?.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold">{t("notifications")}</h3>
            </div>
            <p className="text-[11px] text-gray-400">Preferences a brancher sur l'API plus tard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
