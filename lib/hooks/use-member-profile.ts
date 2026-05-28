"use client";

import { useEffect, useState } from "react";
import type { MemberMeResponse } from "@/lib/types/member-me";
import { getStoredMemberProfile } from "@/lib/member-profile-storage";
import { loadMemberProfileForSession } from "@/lib/api/member-me";
import { useOptionalDashboardAccess } from "@/components/dashboard/dashboard-access-provider";

export function useMemberProfile() {
  const dashboardAccess = useOptionalDashboardAccess();
  const [profile, setProfile] = useState<MemberMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshProfile() {
    setLoading(true);
    try {
      const p = await loadMemberProfileForSession();
      if (p) setProfile(p);
      return p;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (dashboardAccess) return;
    let cancelled = false;

    function onProfileUpdated(event: Event) {
      const next = (event as CustomEvent<MemberMeResponse>).detail;
      if (next) setProfile(next);
    }

    window.addEventListener("e_mall_member_profile_updated", onProfileUpdated);

    const cached = getStoredMemberProfile();
    if (cached) {
      setProfile(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    loadMemberProfileForSession().then((p) => {
      if (cancelled) return;
      if (p) setProfile(p);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      window.removeEventListener("e_mall_member_profile_updated", onProfileUpdated);
    };
  }, [dashboardAccess]);

  if (dashboardAccess) {
    return {
      profile: dashboardAccess.profile,
      loading: dashboardAccess.loading,
      refreshProfile: dashboardAccess.refreshProfile,
    };
  }

  return { profile, loading, refreshProfile };
}
