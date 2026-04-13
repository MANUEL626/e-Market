"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Shield,
  User,
  Users,
  Mail,
  AlertCircle,
} from "lucide-react";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { getPrimaryMembership } from "@/lib/api/member-me";
import { displayNameFromUser, initialsFromUser } from "@/lib/member-profile-storage";
import {
  inviteOrganizationMember,
  listOrganizationMembers,
} from "@/lib/api/emall-client";
import type { OrganizationMember } from "@/lib/types/organization-members";

function memberTypeLabel(t: string): string {
  switch (t) {
    case "admin":
      return "Administrateur";
    case "supervisor":
      return "Superviseur";
    case "member":
      return "Membre";
    default:
      return t;
  }
}

function memberRoleLabel(r: string): string {
  switch (r) {
    case "sales_management":
      return "Vente";
    case "delivery_management":
      return "Livraison";
    default:
      return r;
  }
}

function canManageTeam(
  m: { member_type: string; activity_status: boolean } | undefined
): boolean {
  if (!m?.activity_status) return false;
  return m.member_type === "admin" || m.member_type === "supervisor";
}

export default function TeamPage() {
  const { profile, loading: profileLoading } = useMemberProfile();
  const primary = profile ? getPrimaryMembership(profile) : undefined;
  const manage = canManageTeam(primary);

  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteErr, setInviteErr] = useState<string | null>(null);
  const [inviteOk, setInviteOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile || !manage) {
      setLoading(false);
      setMembers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await listOrganizationMembers();
      setMembers(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger l’équipe.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [profile, manage]);

  useEffect(() => {
    if (profileLoading) return;
    void load();
  }, [profileLoading, load]);

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteBusy(true);
    setInviteErr(null);
    setInviteOk(null);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      await inviteOrganizationMember({
        email: inviteEmail.trim(),
        redirect_to: origin ? `${origin}/auth/callback?flow=invite` : undefined,
      });
      setInviteOk(
        "Invitation envoyée. La personne recevra un e-mail pour rejoindre l’organisation."
      );
      setInviteEmail("");
      await load();
    } catch (err) {
      setInviteErr(err instanceof Error ? err.message : "Échec de l’invitation.");
    } finally {
      setInviteBusy(false);
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
          Équipe
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Membres de votre organisation, rôles et accès (API e-Mall).
        </p>
      </div>

      {profileLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement du profil…
        </div>
      )}

      {!profileLoading && !profile && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-6">
          Connectez-vous pour voir l’équipe.
        </div>
      )}

      {profile && !manage && (
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-700 mb-6 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900">Accès réservé aux gestionnaires</p>
            <p className="text-gray-600 mt-1">
              Seuls les <strong>administrateurs</strong> et <strong>superviseurs</strong>{" "}
              actifs peuvent consulter et gérer les membres de l’organisation.
            </p>
          </div>
        </div>
      )}

      {manage && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Membres</h2>
            <p className="text-sm text-gray-500 mt-1">
              Inviter par e-mail, modifier le type, le rôle métier ou le statut actif.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setInviteOpen(true);
                setInviteErr(null);
                setInviteOk(null);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#3730A3] hover:bg-[#2e2889] text-white text-sm font-bold rounded-full transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Inviter un membre
            </button>
          </div>
        </div>
      )}

      {manage && loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des membres…
        </div>
      )}

      {manage && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 mb-6">
          {error}
        </div>
      )}

      {manage && !loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((row) => {
            const u = row.user;
            const name = displayNameFromUser(u);
            const initials = initialsFromUser(u);
            const inactive = !row.activity_status;
            return (
              <div
                key={row.id}
                className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-50 shadow-sm bg-indigo-50 flex items-center justify-center text-lg font-bold text-indigo-700">
                    {initials}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2.5 py-1 text-[9px] font-extrabold tracking-widest uppercase rounded-full ${
                        row.member_type === "admin"
                          ? "bg-indigo-100 text-indigo-700"
                          : row.member_type === "supervisor"
                            ? "bg-violet-100 text-violet-800"
                            : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {memberTypeLabel(row.member_type)}
                    </span>
                    {inactive && (
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
                        Inactif
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    {u.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{u.username}</p>
                </div>

                <div className="text-xs text-gray-600 mb-6 space-y-1">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-gray-400" />
                    Rôle métier : {memberRoleLabel(row.member_role)}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    Statut : {row.activity_status ? "Actif" : "Désactivé"}
                  </div>
                </div>

                <div className="mt-auto">
                  <Link
                    href={`/dashboard/team/${row.id}`}
                    className="block w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 text-sm font-bold rounded-xl text-center transition"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {manage && !loading && !error && members.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-12 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">
            Aucun membre listé pour l’instant. Utilisez « Inviter un membre » pour
            ajouter un collaborateur par e-mail.
          </p>
        </div>
      )}

      {inviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-title"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100">
            <h2 id="invite-title" className="text-lg font-extrabold text-gray-900 mb-1">
              Inviter un membre
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Saisissez l’adresse e-mail. La personne recevra un message Supabase pour
              créer son mot de passe ou rejoindre l’organisation.
            </p>
            <form onSubmit={submitInvite} className="space-y-4">
              <div>
                <label
                  htmlFor="invite-email"
                  className="block text-[10px] font-extrabold text-gray-500 tracking-widest uppercase mb-2"
                >
                  E-mail
                </label>
                <input
                  id="invite-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="collaborateur@exemple.com"
                />
              </div>
              {inviteErr && (
                <p className="text-sm text-red-600">{inviteErr}</p>
              )}
              {inviteOk && (
                <p className="text-sm text-emerald-700">{inviteOk}</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteOpen(false)}
                  className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={inviteBusy}
                  className="px-6 py-2.5 bg-[#3730A3] hover:bg-[#2e2889] disabled:opacity-60 text-white text-sm font-bold rounded-full transition flex items-center gap-2"
                >
                  {inviteBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                  Envoyer l’invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
