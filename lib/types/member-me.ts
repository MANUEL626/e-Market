export type MemberMeOrganization = {
  id: string;
  name: string;
  org_type: string;
  description: string | null;
  profile_picture: string | null;
  countries: string[] | null;
  created_by: string;
  created_at: string;
};

export type MemberMeMembership = {
  id: string;
  user_id: string;
  organization_id: string;
  member_type: string;
  member_role: string;
  activity_status: boolean;
  created_at: string;
  organization: MemberMeOrganization | null;
};

export type MemberMeUser = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string;
  user_type: string;
  phone: string | null;
  activity_status: boolean;
  profile_picture: string | null;
  created_at: string;
};

export type MemberMeParams = {
  user_id: string;
  locale: "fr" | "en" | "de" | "zh" | string;
  extra: Record<string, unknown>;
  updated_at: string | null;
};

export type MemberMeResponse = {
  user: MemberMeUser;
  memberships: MemberMeMembership[];
  auth: Record<string, unknown> | null;
  params: MemberMeParams | null;
};
