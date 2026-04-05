"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { getPrimaryMembership } from "@/lib/api/member-me";
import { orgTypeLabel } from "@/lib/settings-member-labels";

function formatDateFr(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function GeneralSettingsPage() {
  const { profile, loading } = useMemberProfile();
  const primary = profile ? getPrimaryMembership(profile) : undefined;
  const org = primary?.organization;

  return (
    <div className="pb-12 text-gray-900">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Général</h1>
        <p className="text-gray-500 text-sm">
          Informations de votre organisation telles qu’enregistrées sur e-Mall (lecture seule).
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
          Impossible d’afficher l’organisation : connectez-vous depuis la{" "}
          <Link href="/login" className="font-bold underline">
            page de connexion
          </Link>
          .
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm">
            <h2 className="text-xl font-extrabold mb-2 text-gray-900">Entreprise</h2>
            <p className="text-xs text-gray-500 mb-6">
              Source : <span className="font-mono">GET /api/v1/members/me</span> (organisation liée à votre espace).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Nom de l’organisation</label>
                <input
                  type="text"
                  readOnly
                  value={org?.name ?? "—"}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800 cursor-default"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Type d’activité</label>
                <input
                  type="text"
                  readOnly
                  value={org ? orgTypeLabel(org.org_type) : "—"}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800 cursor-default"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-600 mb-2">Description</label>
              <textarea
                rows={4}
                readOnly
                value={org?.description?.trim() ? org.description : "Aucune description."}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800 cursor-default resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Identifiant organisation</label>
                <input
                  type="text"
                  readOnly
                  value={org?.id ?? "—"}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-xs font-mono text-gray-700 cursor-default"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Créée le</label>
                <input
                  type="text"
                  readOnly
                  value={formatDateFr(org?.created_at)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm text-gray-800 cursor-default"
                />
              </div>
            </div>

            {primary && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm text-gray-700">
                <span className="font-semibold text-gray-900">Votre rôle : </span>
                <span className="capitalize">{primary.member_type}</span>
                {primary.member_role ? (
                  <>
                    {" "}
                    <span className="text-gray-400">·</span> {primary.member_role.replace(/_/g, " ")}
                  </>
                ) : null}
                {primary.activity_status === false && (
                  <span className="ml-2 text-rose-600 font-medium">(adhésion inactive)</span>
                )}
              </div>
            )}
          </div>

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
                      {m.organization?.name ?? "Organisation (données indisponibles)"}
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
              <h3 className="text-sm font-extrabold text-gray-900">Offre actuelle</h3>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-extrabold tracking-widest uppercase rounded-md border border-indigo-100">
                Pro Plus
              </span>
            </div>
            <div className="flex items-end gap-1 mb-2">
              <div className="text-4xl font-black text-gray-900">$149</div>
              <div className="text-sm font-medium text-gray-500 pb-1">/mo</div>
            </div>
            <p className="text-[11px] text-gray-500 mb-6">Next billing date: Oct 24, 2023</p>

            <div className="flex gap-2 items-center text-sm font-medium text-gray-700 bg-gray-50 py-2 px-3 rounded-xl w-fit mb-6">
              <div className="w-6 h-4 bg-[#0a2540] rounded flex items-center justify-center relative overflow-hidden text-white italic text-[8px] font-bold">
                vis
              </div>
              <span className="text-gray-400">••••</span> 4242
            </div>

            <Link
              href="/settings/billing"
              className="block w-full py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-sm rounded-full transition shadow-sm text-center"
            >
              Gérer la facturation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
