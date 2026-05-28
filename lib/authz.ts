import type { MemberMeMembership, MemberMeResponse } from "@/lib/types/member-me";
import { getPrimaryMembership } from "@/lib/api/member-me";

export function isAdminMembership(
  membership: Pick<MemberMeMembership, "member_type" | "activity_status"> | undefined
): boolean {
  return Boolean(membership?.activity_status && membership.member_type === "admin");
}

export function isAdminProfile(profile: MemberMeResponse | null | undefined): boolean {
  if (!profile) return false;
  return isAdminMembership(getPrimaryMembership(profile));
}
