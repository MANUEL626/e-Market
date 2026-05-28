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
  HeartHandshake,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { getPrimaryMembership } from "@/lib/api/member-me";
import { isAdminMembership } from "@/lib/authz";
import { displayNameFromUser, initialsFromUser } from "@/lib/member-profile-storage";
import {
  inviteOrganizationMember,
  listOrganizationMembers,
  listOrganizationSubscribers,
} from "@/lib/api/emall-client";
import type { OrganizationMember } from "@/lib/types/organization-members";
import type { OrganizationSubscriber } from "@/lib/types/organization-subscribers";
import { translate } from "@/lib/i18n";
import { getBusinessCache, setBusinessCache } from "@/lib/realtime/business-cache";
import { subscribeToOrganizationMembers } from "@/lib/realtime/business-realtime";
import { useOptionalDashboardAccess } from "@/components/dashboard/dashboard-access-provider";

const SUBSCRIBERS_PAGE_SIZE = 20;

type TeamTab = "members" | "subscribers";

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

function formatSubscribedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function initialsFromUsername(username: string): string {
  const t = username.trim();
  if (!t) return "?";
  return t.slice(0, 2).toUpperCase();
}

function canManageTeam(
  m: { member_type: string; activity_status: boolean } | undefined
): boolean {
  return isAdminMembership(m);
}

export default function TeamPage() {
  const { profile, loading: profileLoading } = useMemberProfile();
  const dashboardAccess = useOptionalDashboardAccess();
  const t = (key: string) => translate(profile?.params?.locale, key);
  const primary = profile ? getPrimaryMembership(profile) : undefined;
  const manage = canManageTeam(primary);
  const activeMember = Boolean(primary?.activity_status);
  const organizationId = primary?.organization_id ?? null;
  const teamLimitExceeded = Boolean(dashboardAccess?.isLimitExceeded("team_members"));
  const teamUsage = dashboardAccess?.getUsage("team_members");
  const teamLimit = dashboardAccess?.getLimit("team_members");

  const [tab, setTab] = useState<TeamTab>("members");
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<OrganizationSubscriber[]>([]);
  const [subsTotal, setSubsTotal] = useState(0);
  const [subsOffset, setSubsOffset] = useState(0);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsError, setSubsError] = useState<string | null>(null);
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
      if (organizationId) {
        const cached = getBusinessCache<OrganizationMember[]>(`members:${organizationId}`);
        if (cached) {
          setMembers(cached);
          setLoading(false);
        }
      }
      const list = await listOrganizationMembers();
      setMembers(list);
      if (organizationId) setBusinessCache(`members:${organizationId}`, list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger l’équipe.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [profile, manage, organizationId]);

  useEffect(() => {
    if (!organizationId || !manage) return;
    return subscribeToOrganizationMembers<OrganizationMember>(organizationId, () => {
      void load();
    });
  }, [load, manage, organizationId]);

  useEffect(() => {
    if (profileLoading) return;
    void load();
  }, [profileLoading, load]);

  const loadSubscribers = useCallback(async () => {
    if (!activeMember) {
      setSubscribers([]);
      setSubsTotal(0);
      return;
    }
    setSubsLoading(true);
    setSubsError(null);
    try {
      const data = await listOrganizationSubscribers({
        limit: SUBSCRIBERS_PAGE_SIZE,
        offset: subsOffset,
      });
      setSubscribers(Array.isArray(data.items) ? data.items : []);
      setSubsTotal(typeof data.total === "number" ? data.total : 0);
    } catch (e) {
      setSubsError(
        e instanceof Error ? e.message : "Impossible de charger les abonnés."
      );
      setSubscribers([]);
      setSubsTotal(0);
    } finally {
      setSubsLoading(false);
    }
  }, [activeMember, subsOffset]);

  useEffect(() => {
    if (profileLoading || tab !== "subscribers" || !activeMember) return;
    void loadSubscribers();
  }, [profileLoading, tab, activeMember, loadSubscribers]);

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    if (teamLimitExceeded) {
      setInviteErr(
        "La limite de membres de votre abonnement est atteinte. Changez de plan avant d'inviter un nouveau membre."
      );
      return;
    }
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
          {t("team")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("teamIntro")}
        </p>
      </div>

      {profileLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("loadingProfile")}
        </div>
      )}

      {!profileLoading && !profile && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-6">
          Connectez-vous pour voir l’équipe.
        </div>
      )}

      {profile && activeMember && (
        <div
          className="flex gap-1 p-1 mb-8 rounded-2xl bg-gray-100/90 border border-gray-200/80 max-w-md"
          role="tablist"
          aria-label="Sections équipe"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "members"}
            onClick={() => {
              setTab("members");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition ${
              tab === "members"
                ? "bg-white text-indigo-900 shadow-sm border border-gray-100"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            {t("members")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "subscribers"}
            onClick={() => {
              setTab("subscribers");
              setSubsOffset(0);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition ${
              tab === "subscribers"
                ? "bg-white text-indigo-900 shadow-sm border border-gray-100"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <HeartHandshake className="w-4 h-4 shrink-0" />
            {t("subscribers")}
          </button>
        </div>
      )}

      {profile && !activeMember && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 mb-6 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Compte membre inactif</p>
            <p className="mt-1 text-amber-800/90">
              Votre accès à cette organisation est désactivé. Contactez un administrateur.
            </p>
          </div>
        </div>
      )}

      {profile && !manage && tab === "members" && activeMember && (
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-700 mb-6 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900">Accès réservé aux gestionnaires</p>
            <p className="text-gray-600 mt-1">
              Seuls les <strong>administrateurs</strong> actifs peuvent consulter et gérer les membres internes et envoyer des invitations.
            </p>
            <p className="text-gray-500 mt-2 text-xs">
              Onglet <strong>Abonnés</strong> : liste des clients qui suivent la boutique (accessible à tout membre actif).
            </p>
          </div>
        </div>
      )}

      {manage && tab === "members" && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">{t("members")}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Inviter par e-mail, modifier le type, le rôle métier ou le statut actif.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={teamLimitExceeded}
              onClick={() => {
                setInviteOpen(true);
                setInviteErr(null);
                setInviteOk(null);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#3730A3] hover:bg-[#2e2889] disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-bold rounded-full transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> {t("inviteMember")}
            </button>
          </div>
        </div>
      )}

      {manage && tab === "members" && teamLimitExceeded && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Limite de membres atteinte
          {teamLimit != null ? ` (${teamUsage ?? 0}/${teamLimit}).` : "."} Passez a
          un plan superieur pour inviter d'autres membres.
        </div>
      )}

      {manage && tab === "members" && loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("loadingMembers")}
        </div>
      )}

      {manage && tab === "members" && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 mb-6">
          {error}
        </div>
      )}

      {manage && tab === "members" && !loading && !error && (
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

      {manage && tab === "members" && !loading && !error && members.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-12 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">
            Aucun membre listé pour l’instant. Utilisez « Inviter un membre » pour
            ajouter un collaborateur par e-mail.
          </p>
        </div>
      )}

      {profile && activeMember && tab === "subscribers" && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                {t("subscribers")}
              </h2>
              <p className="text-sm text-gray-500 mt-1 max-w-xl">
                Comptes clients qui suivent votre organisation (abonnements actifs).
                Tout membre actif peut consulter cette liste.
              </p>
            </div>
            {!subsLoading && !subsError && subsTotal > 0 && (
              <p className="text-sm font-bold text-indigo-900 tabular-nums">
                {subsTotal} abonné{subsTotal > 1 ? "s" : ""}
              </p>
            )}
          </div>

          {subsLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loadingSubscribers")}
            </div>
          )}

          {subsError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 mb-6">
              {subsError}
            </div>
          )}

          {!subsLoading && !subsError && subscribers.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscribers.map((row) => (
                  <div
                    key={row.customer_id}
                    className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-sm font-bold text-rose-700">
                        {initialsFromUsername(row.username)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          @{row.username}
                        </h3>
                        <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                          {row.customer_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mt-auto pt-2 border-t border-gray-50">
                      <span className="text-gray-500">Abonné depuis · </span>
                      {formatSubscribedAt(row.subscribed_at)}
                    </div>
                  </div>
                ))}
              </div>

              {subsTotal > SUBSCRIBERS_PAGE_SIZE && (
                <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Affichage{" "}
                    <span className="font-semibold text-gray-700">
                      {subsOffset + 1}–
                      {Math.min(subsOffset + subscribers.length, subsTotal)}
                    </span>{" "}
                    sur {subsTotal}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={subsOffset === 0}
                      onClick={() =>
                        setSubsOffset((o) =>
                          Math.max(0, o - SUBSCRIBERS_PAGE_SIZE)
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Précédent
                    </button>
                    <button
                      type="button"
                      disabled={
                        subsOffset + SUBSCRIBERS_PAGE_SIZE >= subsTotal
                      }
                      onClick={() =>
                        setSubsOffset((o) => o + SUBSCRIBERS_PAGE_SIZE)
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition"
                    >
                      Suivant
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {!subsLoading && !subsError && subscribers.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-12 text-center">
              <HeartHandshake className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                Aucun client abonné pour l’instant. Lorsque des utilisateurs suivront
                votre organisation, ils apparaîtront ici.
              </p>
            </div>
          )}
        </>
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
              {t("inviteMember")}
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
                  disabled={inviteBusy || teamLimitExceeded}
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
