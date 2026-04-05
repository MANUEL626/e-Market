"use client";

import Link from "next/link";
import { Edit2, Shield, Bell, ChevronRight, Loader2 } from "lucide-react";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { getPrimaryMembership } from "@/lib/api/member-me";
import {
  displayNameFromUser,
  initialsFromUser,
} from "@/lib/member-profile-storage";
import { orgTypeLabel } from "@/lib/settings-member-labels";

function formatDateFr(iso: string | undefined): string {
  if (!iso) return "—";
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

export default function ProfileSettingsPage() {
  const { profile, loading } = useMemberProfile();
  const user = profile?.user;
  const primary = profile ? getPrimaryMembership(profile) : undefined;
  const org = primary?.organization;
  const authConfirmed =
    profile?.auth && typeof profile.auth === "object" && "email_confirmed_at" in profile.auth
      ? (profile.auth as { email_confirmed_at?: string }).email_confirmed_at
      : undefined;

  const fullName = user ? displayNameFromUser(user) : "—";
  const initials = user ? initialsFromUser(user) : "?";

  return (
    <div className="pb-12 text-gray-900">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Profil</h1>
        <p className="text-gray-500 text-sm">
          Informations personnelles issues de votre compte marchand (lecture seule).
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement du profil…
        </div>
      )}

      {!loading && !profile && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-8">
          Aucune donnée profil :{" "}
          <Link href="/login" className="font-bold underline">
            connectez-vous
          </Link>
          .
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <div className="h-px bg-gray-200 flex-1"></div>
        <span className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase px-4">
          Compte utilisateur
        </span>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-sm border-4 border-white bg-indigo-100 flex items-center justify-center">
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-extrabold text-indigo-700">{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  disabled
                  title="Bientôt disponible"
                  className="absolute bottom-0 right-0 w-7 h-7 bg-gray-300 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm cursor-not-allowed"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Identité</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Prénom, nom et identifiants tels que renvoyés par l’API.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Nom affiché</label>
                <input
                  type="text"
                  readOnly
                  value={fullName}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800 cursor-default"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">E-mail</label>
                <input
                  type="email"
                  readOnly
                  value={user?.email ?? "—"}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800 cursor-default"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Prénom</label>
                <input
                  type="text"
                  readOnly
                  value={user?.first_name ?? "—"}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800 cursor-default"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Nom</label>
                <input
                  type="text"
                  readOnly
                  value={user?.last_name ?? "—"}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800 cursor-default"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Nom d’utilisateur</label>
                <input
                  type="text"
                  readOnly
                  value={user?.username ?? "—"}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-xs font-mono text-gray-800 cursor-default"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Téléphone</label>
                <input
                  type="text"
                  readOnly
                  value={user?.phone ?? "—"}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800 cursor-default"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Type de compte</label>
                <input
                  type="text"
                  readOnly
                  value={user?.user_type ?? "—"}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm capitalize text-gray-800 cursor-default"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Compte créé le</label>
                <input
                  type="text"
                  readOnly
                  value={formatDateFr(user?.created_at)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800 cursor-default"
                />
              </div>
            </div>

            {org && (
              <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm">
                <span className="font-semibold text-gray-900">Organisation principale : </span>
                {org.name}
                <span className="text-gray-500"> · {orgTypeLabel(org.org_type)}</span>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-gray-50 mt-6">
              <p className="text-xs text-gray-400">
                Les modifications de profil passeront par une future intégration API.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold">Sécurité</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-3 -mx-3 rounded-xl transition">
                <div>
                  <div className="text-sm font-bold text-gray-900">Mot de passe</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Géré par Supabase (connexion e-mail)</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              <div
                className={`border p-4 rounded-xl flex items-center justify-between ${
                  authConfirmed
                    ? "bg-emerald-50 border-emerald-100"
                    : "bg-amber-50 border-amber-100"
                }`}
              >
                <div>
                  <div
                    className={`text-[11px] font-extrabold tracking-widest uppercase ${
                      authConfirmed ? "text-emerald-800" : "text-amber-800"
                    }`}
                  >
                    E-mail confirmé
                  </div>
                  <div className={`text-xs mt-1 ${authConfirmed ? "text-emerald-600" : "text-amber-700"}`}>
                    {authConfirmed ? formatDateFr(authConfirmed) : "Non confirmé ou donnée absente"}
                  </div>
                </div>
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    authConfirmed ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-amber-400"
                  }`}
                />
              </div>

              <div className="text-[11px] text-gray-500 px-1">
                Identifiant technique :{" "}
                <span className="font-mono text-gray-700">{user?.id ?? "—"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold">Notifications</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Notifications e-mail</span>
                <div className="w-10 h-6 bg-gray-200 rounded-full relative cursor-pointer shadow-inner transition">
                  <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Notifications push</span>
                <div className="w-10 h-6 bg-gray-200 rounded-full relative cursor-pointer shadow-inner transition">
                  <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm"></div>
                </div>
              </div>
              <p className="text-[11px] text-gray-400">Préférences à brancher sur l’API plus tard.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
