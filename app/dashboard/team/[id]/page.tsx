"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronRight,
  Loader2,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { getPrimaryMembership } from "@/lib/api/member-me";
import { isAdminMembership } from "@/lib/authz";
import { displayNameFromUser, initialsFromUser } from "@/lib/member-profile-storage";
import {
  inviteOrganizationMember,
  listOrganizationMembers,
  updateOrganizationMember,
} from "@/lib/api/emall-client";
import type { OrganizationMember } from "@/lib/types/organization-members";
import { translate } from "@/lib/i18n";

function canManageTeam(
  m: { member_type: string; activity_status: boolean } | undefined
): boolean {
  return isAdminMembership(m);
}

export default function TeamMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const isNew = rawId === "new";

  const { profile, loading: profileLoading } = useMemberProfile();
  const t = (key: string) => translate(profile?.params?.locale, key);
  const primary = profile ? getPrimaryMembership(profile) : undefined;
  const manage = canManageTeam(primary);

  const [member, setMember] = useState<OrganizationMember | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [memberType, setMemberType] = useState<string>("member");
  const [memberRole, setMemberRole] = useState<string>("sales_management");
  const [activityStatus, setActivityStatus] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteErr, setInviteErr] = useState<string | null>(null);
  const [inviteOk, setInviteOk] = useState<string | null>(null);

  const loadMember = useCallback(async () => {
    if (!rawId || isNew) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listOrganizationMembers();
      const found = list.find((m) => m.id === rawId);
      if (!found) {
        setError("Membre introuvable.");
        setMember(null);
        return;
      }
      setMember(found);
      setMemberType(found.member_type);
      setMemberRole(found.member_role);
      setActivityStatus(found.activity_status);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, [rawId, isNew]);

  useEffect(() => {
    if (profileLoading || !manage || isNew) {
      if (isNew) setLoading(false);
      return;
    }
    void loadMember();
  }, [profileLoading, manage, isNew, loadMember]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return;
    setSaving(true);
    setSaveErr(null);
    try {
      const updated = await updateOrganizationMember(member.id, {
        member_type: memberType,
        member_role: memberRole,
        activity_status: activityStatus,
      });
      setMember(updated);
      router.push("/dashboard/team");
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
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
      setInviteOk("Invitation envoyée.");
      setInviteEmail("");
      router.push("/dashboard/team");
    } catch (err) {
      setInviteErr(err instanceof Error ? err.message : "Échec de l’invitation.");
    } finally {
      setInviteBusy(false);
    }
  }

  if (!profileLoading && profile && !manage) {
    return (
      <div className="max-w-[1000px] mx-auto pb-12">
        <p className="text-gray-600 text-sm mb-4">
          Vous n’avez pas les droits pour gérer les membres.
        </p>
        <Link href="/dashboard/team" className="text-indigo-700 font-bold text-sm">
          ← Retour à l’équipe
        </Link>
      </div>
    );
  }

  if (isNew) {
    return (
      <div className="max-w-[640px] mx-auto pb-12">
        <nav className="flex items-center gap-2 text-[10px] font-extrabold text-gray-500 tracking-widest uppercase mb-4">
          <Link href="/dashboard/team" className="hover:text-gray-900 transition">
            {t("team")}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900">Invitation</span>
        </nav>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          {t("inviteMember")}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Envoi d’un e-mail d’invitation (compte nouveau ou rattachement à l’organisation).
        </p>
        <form
          onSubmit={handleInvite}
          className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 space-y-4"
        >
          <div>
            <label
              htmlFor="new-email"
              className="block text-[10px] font-extrabold text-gray-500 tracking-widest uppercase mb-2"
            >
              E-mail
            </label>
            <input
              id="new-email"
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              placeholder="personne@exemple.com"
            />
          </div>
          {inviteErr && <p className="text-sm text-red-600">{inviteErr}</p>}
          {inviteOk && <p className="text-sm text-emerald-700">{inviteOk}</p>}
          <div className="flex justify-end gap-3 pt-4">
            <Link
              href="/dashboard/team"
              className="px-6 py-3 text-sm font-bold text-gray-600 hover:text-gray-900"
            >
              {t("cancel")}
            </Link>
            <button
              type="submit"
              disabled={inviteBusy}
              className="px-8 py-3 bg-[#3730A3] hover:bg-[#2e2889] disabled:opacity-60 text-white text-sm font-bold rounded-full transition flex items-center gap-2"
            >
              {inviteBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              Envoyer
            </button>
          </div>
        </form>
      </div>
    );
  }

  const u = member?.user;

  return (
    <div className="max-w-[1000px] mx-auto pb-12">
      <nav className="flex items-center gap-2 text-[10px] font-extrabold text-gray-500 tracking-widest uppercase mb-4">
        <Link href="/dashboard/team" className="hover:text-gray-900 transition">
          {t("team")}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900">Modifier le membre</span>
      </nav>

      {profileLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("loadingProfile")}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement du membre…
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 mb-6">
          {error}{" "}
          <Link href="/dashboard/team" className="font-bold underline">
            Retour
          </Link>
        </div>
      )}

      {member && u && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-indigo-50 border-4 border-white shadow-md flex items-center justify-center text-2xl font-bold text-indigo-700 mb-4">
                {initialsFromUser(u)}
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">
                {displayNameFromUser(u)}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{u.email}</p>
              <p className="text-xs text-gray-400 font-mono mt-1">{u.username}</p>
              {profile && member.user_id !== profile.user.id && (
                <Link
                  href={`/dashboard/messages?with=${member.user_id}`}
                  className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#3730A3] text-white text-sm font-bold hover:bg-[#2e2889] transition w-full"
                >
                  <Mail className="w-4 h-4" />
                  Message
                </Link>
              )}
            </div>
            <div className="bg-indigo-50/50 p-6 rounded-[24px] border border-indigo-100/50">
              <div className="flex items-center gap-2 text-indigo-700 font-bold mb-3">
                <ShieldAlert className="w-5 h-5" /> Règle métier
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Vous ne pouvez pas désactiver ou rétrograder le dernier administrateur
                actif. En cas de refus, le message d’erreur du serveur s’affichera
                ci-dessous.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <form
              onSubmit={handleSave}
              className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 space-y-6"
            >
              <h3 className="text-xl font-extrabold text-gray-900">
                Type et rôle
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 tracking-widest uppercase mb-2">
                    Type de membre
                  </label>
                  <select
                    value={memberType}
                    onChange={(e) => setMemberType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="admin">Administrateur</option>
                    <option value="supervisor">Superviseur</option>
                    <option value="member">Membre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 tracking-widest uppercase mb-2">
                    Rôle métier
                  </label>
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="sales_management">Vente</option>
                    <option value="delivery_management">Livraison</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activityStatus}
                  onChange={(e) => setActivityStatus(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-semibold text-gray-900">
                  Compte actif pour cette organisation
                </span>
              </label>
              {saveErr && (
                <p className="text-sm text-red-600">{saveErr}</p>
              )}
              <div className="flex justify-end gap-4 pt-4">
                <Link
                  href="/dashboard/team"
                  className="px-6 py-3 text-sm font-bold text-gray-600 hover:text-gray-900"
                >
                  {t("cancel")}
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-[#3730A3] hover:bg-[#2e2889] disabled:opacity-60 text-white text-sm font-bold rounded-full transition flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
