import { createClient } from "@/lib/supabase/client";
import {
  getStoredOrganizationId,
  setStoredOrganizationId,
} from "@/lib/organization-storage";
import { extractApiErrorMessage } from "@/lib/api/parse-api-error";
import { fetchMemberMeWithSession, getPrimaryMembership } from "@/lib/api/member-me";
import { isAdminProfile } from "@/lib/authz";
import type {
  ArticleOrder,
  CreateArticlePayload,
  OrganizationArticle,
  UpdateArticlePayload,
} from "@/lib/types/article-orders";
import type {
  InviteMemberPayload,
  OrganizationMember,
  OrganizationMembersListResponse,
  UpdateMemberPayload,
} from "@/lib/types/organization-members";
import type { OrganizationSubscribersListResponse } from "@/lib/types/organization-subscribers";
import type {
  OrganizationArticlePost,
  UpsertArticlePostPayload,
} from "@/lib/types/article-posts";
import type {
  AssignDeliveryPayload,
  CreateDeliveryTrackPointPayload,
  CreateWalkInSalePayload,
  CustomerSaleDeliveryTrackPoint,
  CustomerSaleHistoryEvent,
  CustomerSaleOrderDetail,
  CustomerSaleReceiptTokenResponse,
  CustomerSaleStatus,
  CustomerSaleStatusGroup,
  UpdateCustomerSaleStatusPayload,
} from "@/lib/types/customer-sales";
import {
  assertArticlePostSlot,
  buildUpsertArticlePostBody,
  normalizeArticlePost,
  normalizeArticlePostsListPayload,
} from "@/lib/article-posts/utils";
export { setStoredOrganizationId };

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
    "Content-Type": "application/json",
  };
}

async function assertAdminClient(): Promise<void> {
  const profile = await fetchMemberMeWithSession();
  if (!isAdminProfile(profile)) {
    throw new Error("Acces reserve aux administrateurs.");
  }
}

async function assertAssignedDeliveryMemberClient(orderId: string): Promise<void> {
  const profile = await fetchMemberMeWithSession();
  const membership = profile ? getPrimaryMembership(profile) : undefined;
  if (membership?.member_role !== "delivery_management") {
    throw new Error("Acces reserve au livreur assigne.");
  }
  const assignedOrders = await listDeliveryAssignments();
  if (!assignedOrders.some((detail) => detail.order.id === orderId)) {
    throw new Error("Acces reserve au livreur assigne.");
  }
}

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const orgId = getStoredOrganizationId();
  if (!orgId) {
    throw new Error("ORG_REQUIRED");
  }
  const headers = await authHeaders();
  const res = await fetch(`/api/organizations/${orgId}${path}`, {
    ...init,
    headers: { ...headers, ...init?.headers },
  });
  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  if (!res.ok) {
    throw new Error(extractApiErrorMessage(data));
  }
  return data as T;
}

async function requestCustomerSales<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const orgId = getStoredOrganizationId();
  if (!orgId) {
    throw new Error("ORG_REQUIRED");
  }
  const headers = await authHeaders();
  const res = await fetch(`/api/organizations/${orgId}/customer-sales${path}`, {
    ...init,
    headers: { ...headers, ...init?.headers },
  });
  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  if (!res.ok) {
    throw new Error(extractApiErrorMessage(data));
  }
  return data as T;
}

/** Toujours via l’API réelle (pas de mock catalogue). */
export async function listArticles(activeOnly = true): Promise<OrganizationArticle[]> {
  const q = activeOnly ? "?active_only=true" : "?active_only=false";
  const data = await request<unknown>(`/articles${q}`);
  if (Array.isArray(data)) return data as OrganizationArticle[];
  return [];
}

export async function createArticle(
  body: CreateArticlePayload
): Promise<OrganizationArticle> {
  await assertAdminClient();
  return request<OrganizationArticle>(`/articles`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getArticle(articleId: string): Promise<OrganizationArticle> {
  return request<OrganizationArticle>(`/articles/${articleId}`);
}

export async function updateArticle(
  articleId: string,
  body: UpdateArticlePayload
): Promise<OrganizationArticle> {
  await assertAdminClient();
  return request<OrganizationArticle>(`/articles/${articleId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * Liste des posts — guide : `GET` → **200** + tableau (tri par `slot`).
 * On accepte aussi **404** (liste vide ou ancien backend) comme **[]** pour robustesse.
 */
export async function listArticlePosts(articleId: string): Promise<OrganizationArticlePost[]> {
  const orgId = getStoredOrganizationId();
  if (!orgId) {
    throw new Error("ORG_REQUIRED");
  }
  const headers = await authHeaders();
  const res = await fetch(`/api/organizations/${orgId}/articles/${articleId}/posts`, {
    headers: { ...headers },
  });
  if (res.status === 404) {
    return [];
  }
  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  if (!res.ok) {
    throw new Error(extractApiErrorMessage(data));
  }
  return normalizeArticlePostsListPayload(data);
}

/** PUT complet par slot (création ou remplacement) — validation alignée guide (chemin, légende, slot). */
export async function upsertArticlePost(
  articleId: string,
  slot: number,
  body: UpsertArticlePostPayload
): Promise<OrganizationArticlePost> {
  await assertAdminClient();
  assertArticlePostSlot(slot);
  const orgId = getStoredOrganizationId();
  if (!orgId) {
    throw new Error("ORG_REQUIRED");
  }
  const payload = buildUpsertArticlePostBody(orgId, body);
  const raw = await request<unknown>(`/articles/${articleId}/posts/${slot}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const n = normalizeArticlePost(raw);
  if (!n) {
    throw new Error("Réponse post invalide : schéma inattendu.");
  }
  return n;
}

/**
 * DELETE sur un emplacement — guide : **204** sans corps.
 * **404** traité comme succès (suppression idempotente).
 */
export async function deleteArticlePost(articleId: string, slot: number): Promise<void> {
  await assertAdminClient();
  assertArticlePostSlot(slot);
  const orgId = getStoredOrganizationId();
  if (!orgId) {
    throw new Error("ORG_REQUIRED");
  }
  const headers = await authHeaders();
  const res = await fetch(`/api/organizations/${orgId}/articles/${articleId}/posts/${slot}`, {
    method: "DELETE",
    headers: { Authorization: headers.Authorization },
  });
  if (res.ok || res.status === 404) {
    return;
  }
  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  throw new Error(extractApiErrorMessage(data));
}

/** Commandes fournisseur — toujours via l’API réelle. */
export async function listArticleOrders(
  status?: "open" | "received" | "cancelled"
): Promise<ArticleOrder[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await request<unknown>(`/article-orders${q}`);
  if (Array.isArray(data)) return data as ArticleOrder[];
  return [];
}

export async function getArticleOrder(orderId: string): Promise<ArticleOrder> {
  return request<ArticleOrder>(`/article-orders/${orderId}`);
}

export async function createArticleOrder(body: {
  note?: string | null;
  lines: { article_id: string; quantity_ordered: number }[];
}): Promise<ArticleOrder> {
  await assertAdminClient();
  return request<ArticleOrder>(`/article-orders`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function receiveArticleOrder(
  orderId: string,
  lines: {
    line_id: string;
    quantity_received: number;
    shortage_reason?: string | null;
  }[]
): Promise<unknown> {
  await assertAdminClient();
  return request(`/article-orders/${orderId}/receive`, {
    method: "POST",
    body: JSON.stringify({ lines }),
  });
}

export async function cancelArticleOrder(orderId: string): Promise<unknown> {
  await assertAdminClient();
  return request(`/article-orders/${orderId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/** Membres d’organisation — admin / superviseur actif requis côté API. */
export async function listOrganizationMembers(): Promise<OrganizationMember[]> {
  const data = await request<OrganizationMembersListResponse>(`/members`);
  return Array.isArray(data.members) ? data.members : [];
}

export async function inviteOrganizationMember(
  body: InviteMemberPayload
): Promise<unknown> {
  await assertAdminClient();
  return request(`/members/invite`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateOrganizationMember(
  memberId: string,
  body: UpdateMemberPayload
): Promise<OrganizationMember> {
  await assertAdminClient();
  return request<OrganizationMember>(`/members/${memberId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * Clients abonnés à la boutique — tout **membre actif** de l’org (guide : pas réservé aux admins).
 * `GET /api/v1/members/organizations/{organization_id}/subscribers`
 */
export async function listOrganizationSubscribers(options?: {
  limit?: number;
  offset?: number;
}): Promise<OrganizationSubscribersListResponse> {
  const orgId = getStoredOrganizationId();
  if (!orgId) {
    throw new Error("ORG_REQUIRED");
  }
  const headers = await authHeaders();
  const qs = new URLSearchParams();
  if (options?.limit != null) qs.set("limit", String(options.limit));
  if (options?.offset != null) qs.set("offset", String(options.offset));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`/api/members/organizations/${orgId}/subscribers${suffix}`, {
    headers: { ...headers },
  });
  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  if (!res.ok) {
    throw new Error(extractApiErrorMessage(data));
  }
  return data as OrganizationSubscribersListResponse;
}

function queryFromObject(query?: Record<string, string | null | undefined>): string {
  if (!query) return "";
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v != null && v !== "") qs.set(k, v);
  }
  const out = qs.toString();
  return out ? `?${out}` : "";
}

/** Ventes client (marchand): liste filtrable via bucket/status_group. */
export async function listCustomerSales(params?: {
  bucket?: string;
  status_group?: CustomerSaleStatusGroup;
}): Promise<CustomerSaleOrderDetail[]> {
  const q = queryFromObject({
    bucket: params?.bucket ?? null,
    status_group: params?.status_group ?? null,
  });
  const data = await requestCustomerSales<unknown>(`${q}`);
  return Array.isArray(data) ? (data as CustomerSaleOrderDetail[]) : [];
}

export async function getCustomerSale(orderId: string): Promise<CustomerSaleOrderDetail> {
  return requestCustomerSales<CustomerSaleOrderDetail>(`/${orderId}`);
}

export async function getCustomerSaleHistory(orderId: string): Promise<CustomerSaleHistoryEvent[]> {
  const data = await requestCustomerSales<unknown>(`/${orderId}/history`);
  return Array.isArray(data) ? (data as CustomerSaleHistoryEvent[]) : [];
}

export async function updateCustomerSaleStatus(
  orderId: string,
  body: UpdateCustomerSaleStatusPayload
): Promise<CustomerSaleOrderDetail> {
  return requestCustomerSales<CustomerSaleOrderDetail>(`/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function createWalkInSale(
  body: CreateWalkInSalePayload
): Promise<CustomerSaleOrderDetail> {
  return requestCustomerSales<CustomerSaleOrderDetail>(`/walk-in`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createCustomerSaleReceiptToken(
  orderId: string
): Promise<CustomerSaleReceiptTokenResponse> {
  return requestCustomerSales<CustomerSaleReceiptTokenResponse>(`/${orderId}/receipt-token`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getCustomerSalePickupQr(
  orderId: string
): Promise<CustomerSaleReceiptTokenResponse> {
  return requestCustomerSales<CustomerSaleReceiptTokenResponse>(`/${orderId}/pickup-qr`);
}

export async function assignCustomerSaleDelivery(
  orderId: string,
  body: AssignDeliveryPayload
): Promise<CustomerSaleOrderDetail> {
  await assertAdminClient();
  const current = await getCustomerSale(orderId);
  if (current.order.assigned_delivery_member_id) {
    throw new Error("Cette livraison est deja attribuee a un livreur.");
  }
  return requestCustomerSales<CustomerSaleOrderDetail>(`/${orderId}/assign-delivery`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getCustomerSaleDeliveryQr(
  orderId: string
): Promise<CustomerSaleReceiptTokenResponse> {
  await assertAssignedDeliveryMemberClient(orderId);
  return requestCustomerSales<CustomerSaleReceiptTokenResponse>(`/${orderId}/delivery-qr`);
}

/** Espace livreur: commandes assignées au membre connecté. */
export async function listDeliveryAssignments(status?: CustomerSaleStatus): Promise<CustomerSaleOrderDetail[]> {
  const q = queryFromObject({ status: status ?? null });
  const headers = await authHeaders();
  const res = await fetch(`/api/customer-sales/delivery-assignments${q}`, {
    headers: { ...headers },
  });
  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  if (!res.ok) {
    throw new Error(extractApiErrorMessage(data));
  }
  return Array.isArray(data) ? (data as CustomerSaleOrderDetail[]) : [];
}

export async function getCustomerSaleDeliveryTrack(
  orderId: string,
  options?: { since?: string | null; limit?: number | null }
): Promise<CustomerSaleDeliveryTrackPoint[]> {
  const q = queryFromObject({
    since: options?.since ?? null,
    limit: options?.limit == null ? null : String(options.limit),
  });
  const data = await requestCustomerSales<unknown>(`/${orderId}/delivery-track${q}`);
  return Array.isArray(data) ? (data as CustomerSaleDeliveryTrackPoint[]) : [];
}

export async function createDeliveryAssignmentTrackPoint(
  orderId: string,
  body: CreateDeliveryTrackPointPayload
): Promise<CustomerSaleDeliveryTrackPoint> {
  await assertAssignedDeliveryMemberClient(orderId);
  const headers = await authHeaders();
  const res = await fetch(`/api/customer-sales/delivery-assignments/${orderId}/track-points`, {
    method: "POST",
    headers: { ...headers },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  if (!res.ok) {
    throw new Error(extractApiErrorMessage(data));
  }
  return data as CustomerSaleDeliveryTrackPoint;
}
