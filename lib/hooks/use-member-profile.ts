"use client";

import { useEffect, useState } from "react";
import type { MemberMeResponse } from "@/lib/types/member-me";
import { getStoredMemberProfile } from "@/lib/member-profile-storage";
import { loadMemberProfileForSession } from "@/lib/api/member-me";

export function useMemberProfile() {
  const [profile, setProfile] = useState<MemberMeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const cached = getStoredMemberProfile();
    if (cached) {
      setProfile(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    loadMemberProfileForSession().then((p) => {
      if (cancelled) return;
      setProfile(p);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, loading };
}
