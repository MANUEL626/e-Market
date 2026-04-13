import type { MemberMeUser } from "@/lib/types/member-me";

/** Ligne `members` + profil `users` (réponse liste / PATCH). */
export type OrganizationMember = {
  id: string;
  user_id: string;
  organization_id: string;
  member_type: string;
  member_role: string;
  activity_status: boolean;
  created_at: string;
  user: MemberMeUser;
};

export type OrganizationMembersListResponse = {
  members: OrganizationMember[];
};

export type UpdateMemberPayload = {
  activity_status?: boolean;
  member_type?: string;
  member_role?: string;
};

export type InviteMemberPayload = {
  email: string;
  redirect_to?: string | null;
};
