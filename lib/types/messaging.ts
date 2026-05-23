import type { MemberMeUser } from "@/lib/types/member-me";

export type ConversationOtherParticipant = {
  id: string;
  username: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_picture: string | null;
  user_type: string | null;
};

export type ConversationLastMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type ConversationListItem = {
  id: string;
  type: "direct" | "group";
  title: string | null;
  last_message_at: string | null;
  created_at: string;
  other_participant: ConversationOtherParticipant | null;
  last_message: ConversationLastMessage | null;
};

export type ConversationParticipant = {
  user_id: string;
  user?: MemberMeUser | null;
};

export type ConversationDetail = {
  id: string;
  type: "direct" | "group";
  title: string | null;
  created_at: string;
  participants?: ConversationParticipant[];
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type MessagingOrganizationMember = {
  user_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_picture: string | null;
  user_type: "member" | "customer" | "admin" | null;
  member_type: "admin" | "supervisor" | "member";
  member_role: "sales_management" | "delivery_management" | null;
};
