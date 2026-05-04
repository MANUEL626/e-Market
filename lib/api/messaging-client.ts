import { createClient } from "@/lib/supabase/client";
import { extractApiErrorMessage } from "@/lib/api/parse-api-error";
import type {
  ConversationDetail,
  ConversationLastMessage,
  ConversationListItem,
  ConversationOtherParticipant,
  MessagingOrganizationMember,
  MessageRow,
} from "@/lib/types/messaging";
import { getStoredOrganizationId } from "@/lib/organization-storage";

async function authHeaders(): Promise<Record<string, string>> {
  let supabase;
  try {
    supabase = createClient();
  } catch {
    throw new Error("SUPABASE_CONFIG");
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("AUTH_REQUIRED");
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    Accept: "application/json",
  };
}

async function messagingFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = await authHeaders();
  const hasBody = init.body !== undefined && init.body !== null;
  const res = await fetch(`/api/messaging/${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  if (!res.ok) {
    throw new Error(
      extractApiErrorMessage(
        typeof data === "object" && data !== null ? data : { detail: text }
      )
    );
  }
  if (res.status === 204 || data === null) {
    return null as T;
  }
  return data as T;
}

export async function openDirectConversation(
  otherUserId: string
): Promise<{ conversation_id: string }> {
  return messagingFetch("conversations/direct", {
    method: "POST",
    body: JSON.stringify({ other_user_id: otherUserId }),
  });
}

function parseOtherParticipant(
  raw: unknown
): ConversationOtherParticipant | null {
  if (typeof raw !== "object" || raw === null || !("id" in raw)) return null;
  const o = raw as Record<string, unknown>;
  return {
    id: String(o.id),
    username: typeof o.username === "string" ? o.username : null,
    email: typeof o.email === "string" ? o.email : null,
    first_name: typeof o.first_name === "string" ? o.first_name : null,
    last_name: typeof o.last_name === "string" ? o.last_name : null,
    profile_picture:
      typeof o.profile_picture === "string" ? o.profile_picture : null,
    user_type: typeof o.user_type === "string" ? o.user_type : null,
  };
}

function parseLastMessage(raw: unknown): ConversationLastMessage | null {
  if (typeof raw !== "object" || raw === null || !("id" in raw)) return null;
  const o = raw as Record<string, unknown>;
  return {
    id: String(o.id),
    conversation_id: String(o.conversation_id ?? ""),
    sender_id: String(o.sender_id ?? ""),
    body: typeof o.body === "string" ? o.body : "",
    created_at: typeof o.created_at === "string" ? o.created_at : "",
  };
}

function normalizeConversationListItem(raw: unknown): ConversationListItem | null {
  if (typeof raw !== "object" || raw === null || !("id" in raw)) return null;
  const o = raw as Record<string, unknown>;
  return {
    id: String(o.id),
    type: o.type === "group" ? "group" : "direct",
    title: typeof o.title === "string" ? o.title : null,
    last_message_at: typeof o.last_message_at === "string" ? o.last_message_at : null,
    created_at: typeof o.created_at === "string" ? o.created_at : "",
    other_participant: parseOtherParticipant(o.other_participant),
    last_message: parseLastMessage(o.last_message),
  };
}

export async function listConversations(): Promise<ConversationListItem[]> {
  const data = await messagingFetch<unknown>("conversations", { method: "GET" });
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => normalizeConversationListItem(item))
    .filter((c): c is ConversationListItem => c !== null);
}

export async function getConversation(
  conversationId: string
): Promise<ConversationDetail> {
  return messagingFetch(`conversations/${conversationId}`, {
    method: "GET",
  });
}

function parseMessagesPayload(data: unknown): MessageRow[] {
  if (Array.isArray(data)) return data as MessageRow[];
  if (
    typeof data === "object" &&
    data !== null &&
    "messages" in data &&
    Array.isArray((data as { messages: unknown }).messages)
  ) {
    return (data as { messages: MessageRow[] }).messages;
  }
  if (
    typeof data === "object" &&
    data !== null &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: MessageRow[] }).items;
  }
  return [];
}

export async function listMessages(
  conversationId: string,
  opts?: { limit?: number; before?: string }
): Promise<MessageRow[]> {
  const sp = new URLSearchParams();
  if (opts?.limit != null) sp.set("limit", String(opts.limit));
  if (opts?.before) sp.set("before", opts.before);
  const q = sp.toString();
  const path = `conversations/${conversationId}/messages${q ? `?${q}` : ""}`;
  const data = await messagingFetch<unknown>(path, { method: "GET" });
  return parseMessagesPayload(data);
}

export async function sendMessage(
  conversationId: string,
  body: string
): Promise<MessageRow | null> {
  const data = await messagingFetch<unknown>(
    `conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ body }),
    }
  );
  if (data && typeof data === "object" && "id" in data) {
    return data as MessageRow;
  }
  return null;
}

export async function listOrganizationMembersForMessaging(
  includeSelf = false
): Promise<MessagingOrganizationMember[]> {
  const orgId = getStoredOrganizationId();
  if (!orgId) {
    throw new Error("ORG_REQUIRED");
  }
  const qs = new URLSearchParams({
    include_self: String(includeSelf),
  });
  const data = await messagingFetch<unknown>(
    `organizations/${orgId}/members?${qs.toString()}`,
    { method: "GET" }
  );
  if (Array.isArray(data)) return data as MessagingOrganizationMember[];
  return [];
}
