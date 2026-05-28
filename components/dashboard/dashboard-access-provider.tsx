"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Loader2 } from "lucide-react";
import { getStoredMemberProfile } from "@/lib/member-profile-storage";
import { getOrganizationSubscriptionEntitlements } from "@/lib/api/emall-client";
import { loadMemberProfileForSession } from "@/lib/api/member-me";
import { getPrimaryMembership } from "@/lib/api/member-me";
import { isAdminProfile } from "@/lib/authz";
import type {
  MemberMeMembership,
  MemberMeOrganization,
  MemberMeResponse,
} from "@/lib/types/member-me";
import { AdminRequired } from "@/components/dashboard/admin-required";
import { translate } from "@/lib/i18n";
import type { OrganizationSubscriptionEntitlements } from "@/lib/api/emall-client";

type DashboardAccess = {
  profile: MemberMeResponse | null;
  primaryMembership: MemberMeMembership | undefined;
  organization: MemberMeOrganization | null;
  organizationType: string | null;
  memberRole: string | null;
  loading: boolean;
  resolved: boolean;
  isAdmin: boolean;
  isSalesOrganization: boolean;
  isDeliveryOrganization: boolean;
  subscriptionEntitlements: OrganizationSubscriptionEntitlements | null;
  subscriptionLoading: boolean;
  subscriptionError: string | null;
  subscriptionPlan: string | null;
  subscriptionIsActive: boolean;
  hasFeature: (feature: string) => boolean;
  isLimitExceeded: (limit: string) => boolean;
  getLimit: (limit: string) => unknown;
  getUsage: (limit: string) => number | string | null | undefined;
  refreshProfile: () => Promise<MemberMeResponse | null>;
  refreshSubscription: () => Promise<OrganizationSubscriptionEntitlements | null>;
};

const DashboardAccessContext = createContext<DashboardAccess | null>(null);

export function DashboardAccessProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<MemberMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolved, setResolved] = useState(false);
  const [subscriptionEntitlements, setSubscriptionEntitlements] =
    useState<OrganizationSubscriptionEntitlements | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    try {
      const next = await loadMemberProfileForSession();
      if (next) {
        setProfile(next);
      }
      setResolved(true);
      return next;
    } finally {
      setLoading(false);
    }
  }, []);

  const organizationId = profile
    ? getPrimaryMembership(profile)?.organization_id ??
      getPrimaryMembership(profile)?.organization?.id ??
      null
    : null;

  const refreshSubscription = useCallback(async () => {
    if (!organizationId) {
      setSubscriptionEntitlements(null);
      setSubscriptionError(null);
      return null;
    }
    setSubscriptionLoading(true);
    setSubscriptionError(null);
    try {
      const next = await getOrganizationSubscriptionEntitlements(organizationId);
      setSubscriptionEntitlements(next);
      return next;
    } catch (error) {
      setSubscriptionError(
        error instanceof Error ? error.message : "Droits d'abonnement indisponibles."
      );
      return null;
    } finally {
      setSubscriptionLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    let cancelled = false;

    function applyCachedProfile() {
      const cached = getStoredMemberProfile();
      if (!cached || cancelled) return false;
      setProfile(cached);
      setResolved(true);
      setLoading(false);
      return true;
    }

    function onProfileUpdated(event: Event) {
      const next = (event as CustomEvent<MemberMeResponse>).detail;
      if (next) {
        setProfile(next);
        setResolved(true);
        setLoading(false);
      }
    }

    window.addEventListener("e_mall_member_profile_updated", onProfileUpdated);

    applyCachedProfile();
    setLoading(true);

    loadMemberProfileForSession()
      .then((next) => {
        if (cancelled) return;
        if (next) {
          setProfile(next);
        }
        setResolved(true);
      })
      .catch(() => {
        if (!cancelled) {
          setResolved(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      window.removeEventListener("e_mall_member_profile_updated", onProfileUpdated);
    };
  }, []);

  useEffect(() => {
    if (!resolved || !organizationId) {
      setSubscriptionEntitlements(null);
      setSubscriptionError(null);
      return;
    }
    void refreshSubscription();
  }, [organizationId, refreshSubscription, resolved]);

  const value = useMemo<DashboardAccess>(
    () => {
      const primaryMembership = profile ? getPrimaryMembership(profile) : undefined;
      const organization = primaryMembership?.organization ?? null;
      const organizationType = organization?.org_type ?? null;
      const subscriptionIsActive = subscriptionEntitlements?.is_active ?? true;
      const hasFeature = (feature: string) => {
        if (!subscriptionEntitlements) return true;
        if (!subscriptionEntitlements.is_active) return false;
        return subscriptionEntitlements.features?.[feature] === true;
      };
      const isLimitExceeded = (limit: string) =>
        Boolean(subscriptionEntitlements?.exceeded_limits?.[limit]);
      const getLimit = (limit: string) => subscriptionEntitlements?.limits?.[limit];
      const getUsage = (limit: string) => subscriptionEntitlements?.usage?.[limit];
      return {
        profile,
        primaryMembership,
        organization,
        organizationType,
        memberRole: primaryMembership?.member_role ?? null,
        loading,
        resolved,
        isAdmin: isAdminProfile(profile),
        isSalesOrganization: organizationType === "sales",
        isDeliveryOrganization: organizationType === "delivery",
        subscriptionEntitlements,
        subscriptionLoading,
        subscriptionError,
        subscriptionPlan: subscriptionEntitlements?.plan ?? null,
        subscriptionIsActive,
        hasFeature,
        isLimitExceeded,
        getLimit,
        getUsage,
        refreshProfile,
        refreshSubscription,
      };
    },
    [
      loading,
      profile,
      refreshProfile,
      refreshSubscription,
      resolved,
      subscriptionEntitlements,
      subscriptionError,
      subscriptionLoading,
    ]
  );

  return (
    <DashboardAccessContext.Provider value={value}>
      {children}
    </DashboardAccessContext.Provider>
  );
}

export function useDashboardAccess() {
  const context = useContext(DashboardAccessContext);
  if (!context) {
    throw new Error("useDashboardAccess doit etre utilise dans DashboardAccessProvider.");
  }
  return context;
}

export function useOptionalDashboardAccess() {
  return useContext(DashboardAccessContext);
}

export function AdminGate({
  children,
  description,
}: {
  children: ReactNode;
  description?: string;
}) {
  const access = useDashboardAccess();
  const t = (key: string) => translate(access.profile?.params?.locale, key);

  if (access.loading && (!access.resolved || !access.isAdmin)) {
    return (
      <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-2 pb-12 pt-24 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
        {t("verifyAccess")}
      </div>
    );
  }

  if (!access.isAdmin) {
    return <AdminRequired description={description} />;
  }

  if (!access.subscriptionIsActive) {
    return (
      <AdminRequired
        title="Abonnement inactif"
        description="Les actions d'administration sont suspendues tant que l'abonnement de l'organisation n'est pas actif."
      />
    );
  }

  return <>{children}</>;
}

export function SalesOrganizationGate({
  children,
  description = "Cette section est reservee aux organisations de vente.",
}: {
  children: ReactNode;
  description?: string;
}) {
  const access = useDashboardAccess();
  const t = (key: string) => translate(access.profile?.params?.locale, key);

  if (access.loading && (!access.resolved || !access.organizationType)) {
    return (
      <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-2 pb-12 pt-24 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
        {t("verifyAccess")}
      </div>
    );
  }

  if (!access.isSalesOrganization) {
    return (
      <AdminRequired
        title="Section reservee aux organisations de vente"
        description={description}
      />
    );
  }

  return <>{children}</>;
}
