import { createClient } from "@/lib/supabase/client";
import {
  getStoredOrganizationId,
  setStoredOrganizationId,
} from "@/lib/organization-storage";
import { extractApiErrorMessage } from "@/lib/api/parse-api-error";
import { getPrimaryMembership, loadMemberProfileForSession } from "@/lib/api/member-me";
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
import {
  deleteBusinessCacheByPrefix,
  getBusinessCache,
  setBusinessCache,
} from "@/lib/realtime/business-cache";
export { setStoredOrganizationId };

export type PerformancePeriod = "7d" | "30d" | "90d" | "year";
export type FinancialPeriod = "month" | PerformancePeriod;
export type PerformanceAgentTask =
  | "executive_summary"
  | "monthly_report"
  | "financial_diagnosis"
  | "trend_analysis"
  | "stock_recommendations"
  | "sales_actions";

export type MoneyAmount = {
  currency: string;
  amount: number;
};

export type MetricComparison = {
  current: number | string;
  previous: number | string;
  variation_percent: number | string | null;
  trend: string;
};

export type MoneyComparison = MetricComparison & {
  currency: string;
};

export type PerformanceDashboardSummary = {
  generated_at: string;
  timezone: string;
  organization_id: string;
  period_key: FinancialPeriod;
  monthly_summary?: {
    sales?: {
      count?: MetricComparison;
      revenue?: MoneyComparison[];
    };
    supplier_orders?: {
      count?: MetricComparison;
      cost?: MoneyComparison[];
    };
    catalog?: {
      active_products?: number;
      in_stock_products?: number;
      low_stock_products?: number;
      out_of_stock_products?: number;
    };
  };
  weekly_sales?: {
    summary?: {
      sales_count?: number;
      items_sold?: number;
      revenue?: MoneyAmount[];
    };
    by_product?: Array<{
      article_id: string;
      name: string | null;
      sales_count: number;
      quantity_sold: number;
      revenue: MoneyAmount[];
    }>;
  };
  inventory_summary?: {
    products?: {
      total_products?: number;
      active_products?: number;
      inactive_products?: number;
    };
    stock_status?: {
      in_stock_products?: number;
      low_stock_products?: number;
      out_of_stock_products?: number;
      active_in_stock_products?: number;
      active_low_stock_products?: number;
      active_out_of_stock_products?: number;
    };
    quantities?: {
      stock_quantity?: number;
      reserved_quantity?: number;
      available_quantity?: number;
    };
    alerts?: {
      active_products_out_of_stock?: number;
      active_products_low_stock?: number;
      active_products_with_reserved_stock?: number;
    };
  };
  financial_summary?: FinancialSummary;
  sales_status?: SalesStatusSummary;
  top_products?: TopProductsSummary;
  trending_products?: TrendingProductsSummary;
};

export type FinancialSummary = {
  period_key: FinancialPeriod;
  sales_count: number;
  supplier_orders_count: number;
  revenue: MoneyAmount[];
  supplier_cost: MoneyAmount[];
  gross_margin_estimate: MoneyAmount[];
  average_order_value: MoneyAmount[];
  notes: string[];
};

export type SalesStatusSummary = {
  period_key: FinancialPeriod;
  total_orders: number | string;
  pipeline_orders: number | string;
  completed_orders: number | string;
  cancelled_orders: number | string;
  cancellation_rate_percent: number | string;
  by_status: Array<{ status: string; count: number | string }>;
  by_fulfillment_type: Array<{ fulfillment_type: string; count: number | string }>;
  completed_revenue: MoneyAmount[];
};

export type TopProductsSummary = {
  period_key: PerformancePeriod;
  limit: number;
  items: Array<{
    article_id: string;
    name: string | null;
    category: string | null;
    sales_count: number;
    quantity_sold: number;
    revenue: MoneyAmount[];
  }>;
};

export type TrendingProductsSummary = {
  period_key: PerformancePeriod;
  limit: number;
  items: Array<{
    article_id: string;
    name: string | null;
    category: string | null;
    trend_score: number;
    events: Record<string, number>;
    quantity_sold: number;
    revenue: MoneyAmount[];
    stock_quantity: number;
    reserved_quantity: number;
    available_quantity: number;
    stock_status: string | null;
  }>;
};

export type AIContextResponse = {
  generated_at: string;
  timezone: string;
  organization_id: string;
  period_key: FinancialPeriod;
  instructions: string[];
  anomalies: string[];
  data: Record<string, unknown>;
};

export type PerformanceAgentResponse = {
  generated_at: string;
  organization_id: string;
  task: PerformanceAgentTask;
  period_key: FinancialPeriod;
  provider: string;
  model: string;
  key_index?: number | null;
  fallback_used: boolean;
  attempts?: Array<Record<string, unknown>>;
  output: string;
  context?: Record<string, unknown>;
};

export type OrganizationSubscriptionPlanCode = "freemium" | "standard" | "premium";

export type OrganizationSubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired"
  | "suspended"
  | string;

export type OrganizationSubscriptionPlan = {
  code: OrganizationSubscriptionPlanCode;
  name: string;
  description: string | null;
  features: Record<string, unknown>;
  limits: Record<string, unknown>;
  active: boolean;
  sort_order: number;
};

export type OrganizationSubscription = {
  id?: string;
  organization_id: string;
  plan: OrganizationSubscriptionPlanCode;
  status: OrganizationSubscriptionStatus;
  source?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
  plan_details?: OrganizationSubscriptionPlan | null;
  created_at?: string;
  updated_at?: string;
};

export type OrganizationSubscriptionEntitlements = {
  organization_id: string;
  plan: OrganizationSubscriptionPlanCode;
  status: OrganizationSubscriptionStatus;
  is_active: boolean;
  features: Record<string, unknown>;
  limits: Record<string, number | null | string | boolean | unknown>;
  usage: Record<string, number | string | null | undefined>;
  exceeded_limits: Record<string, boolean>;
};

type DedupeOptions = {
  ttlMs?: number;
};

const inFlight = new Map<string, Promise<unknown>>();

async function deduped<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: DedupeOptions
): Promise<T> {
  const cached = getBusinessCache<T>(key);
  if (cached != null) {
    return cached;
  }
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const promise = fetcher()
    .then((value) => {
      setBusinessCache(key, value, { ttlMs: options?.ttlMs });
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });
  inFlight.set(key, promise);
  return promise;
}

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
  const profile = await loadMemberProfileForSession();
  if (!isAdminProfile(profile)) {
    throw new Error("Acces reserve aux administrateurs.");
  }
}

async function assertAssignedDeliveryMemberClient(orderId: string): Promise<void> {
  const profile = await loadMemberProfileForSession();
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

async function requestPerformance<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const orgId = getStoredOrganizationId();
  if (!orgId) {
    throw new Error("ORG_REQUIRED");
  }
  const headers = await authHeaders();
  const res = await fetch(`/api/organizations/${orgId}/performance${path}`, {
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
async function requestOrganizationSubscription<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`/api/organization-subscriptions${path}`, {
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

export async function listArticles(activeOnly = true): Promise<OrganizationArticle[]> {
  const orgId = getStoredOrganizationId();
  if (!orgId) {
    throw new Error("ORG_REQUIRED");
  }
  const cacheKey = `api:articles:${orgId}:${activeOnly ? "active" : "all"}`;
  return deduped(
    cacheKey,
    async () => {
      const q = activeOnly ? "?active_only=true" : "?active_only=false";
      const data = await request<unknown>(`/articles${q}`);
      if (Array.isArray(data)) return data as OrganizationArticle[];
      return [];
    },
    { ttlMs: 60_000 }
  );
}

export async function createArticle(
  body: CreateArticlePayload
): Promise<OrganizationArticle> {
  await assertAdminClient();
  const article = await request<OrganizationArticle>(`/articles`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  deleteBusinessCacheByPrefix("stock:articles:");
  deleteBusinessCacheByPrefix("dashboard:summary:");
  return article;
}

export async function getArticle(articleId: string): Promise<OrganizationArticle> {
  return request<OrganizationArticle>(`/articles/${articleId}`);
}

export async function updateArticle(
  articleId: string,
  body: UpdateArticlePayload
): Promise<OrganizationArticle> {
  await assertAdminClient();
  const article = await request<OrganizationArticle>(`/articles/${articleId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  deleteBusinessCacheByPrefix("stock:articles:");
  deleteBusinessCacheByPrefix("dashboard:summary:");
  return article;
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
  const cacheKey = `api:article-posts:${orgId}:${articleId}`;
  return deduped(
    cacheKey,
    async () => {
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
    },
    { ttlMs: 60_000 }
  );
}

export async function getArticlePostsCountsBatch(articleIds: string[]): Promise<Record<string, number>> {
  const orgId = getStoredOrganizationId();
  if (!orgId) throw new Error("ORG_REQUIRED");
  const ids = Array.from(new Set(articleIds.filter(Boolean)));
  if (ids.length === 0) return {};
  const sortedKey = [...ids].sort().join(",");
  const cacheKey = `api:article-posts:counts:${orgId}:${sortedKey}`;
  return deduped(
    cacheKey,
    async () => {
      const params = new URLSearchParams();
      ids.forEach((id) => params.append("article_ids", id));
      const data = await request<unknown>(`/articles/posts/batch?${params.toString()}`);

      if (data && typeof data === "object") {
        if ("counts" in data && typeof (data as { counts?: unknown }).counts === "object") {
          const counts = (data as { counts?: unknown }).counts as Record<string, unknown>;
          const out: Record<string, number> = {};
          for (const [id, n] of Object.entries(counts ?? {})) {
            const numeric = Number(n);
            if (Number.isFinite(numeric)) out[id] = numeric;
          }
          return out;
        }
        // cas: payload directement sous forme { "<article_id>": 3, ... }
        const out: Record<string, number> = {};
        for (const [id, n] of Object.entries(data as Record<string, unknown>)) {
          const numeric = Number(n);
          if (Number.isFinite(numeric)) out[id] = numeric;
        }
        if (Object.keys(out).length > 0) return out;
      }

      if (Array.isArray(data)) {
        const out: Record<string, number> = {};
        for (const row of data as Array<Record<string, unknown>>) {
          const id = String(row.article_id ?? row.id ?? "");
          const n = Number(row.posts_count ?? row.count ?? row.n ?? 0);
          if (id && Number.isFinite(n)) out[id] = n;
        }
        return out;
      }

      return {};
    },
    { ttlMs: 60_000 }
  );
}

export async function listOrganizationSubscriptionPlans(): Promise<OrganizationSubscriptionPlan[]> {
  const cacheKey = "api:subscription:plans";
  return deduped(
    cacheKey,
    async () => {
      const data = await requestOrganizationSubscription<{ plans: OrganizationSubscriptionPlan[] }>(
        "/plans"
      );
      return Array.isArray(data.plans) ? data.plans : [];
    },
    { ttlMs: 5 * 60_000 }
  );
}

export async function getOrganizationSubscription(
  organizationId = getStoredOrganizationId()
): Promise<OrganizationSubscription> {
  if (!organizationId) {
    throw new Error("ORG_REQUIRED");
  }
  const cacheKey = `api:subscription:org:${organizationId}`;
  return deduped(
    cacheKey,
    () =>
      requestOrganizationSubscription<OrganizationSubscription>(`/organizations/${organizationId}`),
    { ttlMs: 60_000 }
  );
}

export async function getOrganizationSubscriptionEntitlements(
  organizationId = getStoredOrganizationId()
): Promise<OrganizationSubscriptionEntitlements> {
  if (!organizationId) {
    throw new Error("ORG_REQUIRED");
  }
  const cacheKey = `api:subscription:entitlements:${organizationId}`;
  return deduped(
    cacheKey,
    () =>
      requestOrganizationSubscription<OrganizationSubscriptionEntitlements>(
        `/organizations/${organizationId}/entitlements`
      ),
    { ttlMs: 60_000 }
  );
}

export async function updateOrganizationSubscription(
  organizationId: string,
  body: {
    plan?: OrganizationSubscriptionPlanCode;
    status?: OrganizationSubscriptionStatus;
    source?: string;
  }
): Promise<OrganizationSubscription> {
  await assertAdminClient();
  return requestOrganizationSubscription<OrganizationSubscription>(
    `/organizations/${organizationId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );
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
  currency?: string | null;
  lines: { article_id: string; quantity_ordered: number; total_price: number }[];
}): Promise<ArticleOrder> {
  await assertAdminClient();
  const order = await request<ArticleOrder>(`/article-orders`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  deleteBusinessCacheByPrefix("article-orders:");
  deleteBusinessCacheByPrefix("dashboard:summary:");
  return order;
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
  const result = await request(`/article-orders/${orderId}/receive`, {
    method: "POST",
    body: JSON.stringify({ lines }),
  });
  deleteBusinessCacheByPrefix("article-orders:");
  deleteBusinessCacheByPrefix("stock:articles:");
  deleteBusinessCacheByPrefix("dashboard:summary:");
  return result;
}

export async function cancelArticleOrder(orderId: string): Promise<unknown> {
  await assertAdminClient();
  const result = await request(`/article-orders/${orderId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  deleteBusinessCacheByPrefix("article-orders:");
  deleteBusinessCacheByPrefix("dashboard:summary:");
  return result;
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
  const result = await request(`/members/invite`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  deleteBusinessCacheByPrefix("members:");
  return result;
}

export async function updateOrganizationMember(
  memberId: string,
  body: UpdateMemberPayload
): Promise<OrganizationMember> {
  await assertAdminClient();
  const member = await request<OrganizationMember>(`/members/${memberId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  deleteBusinessCacheByPrefix("members:");
  return member;
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
  const sale = await requestCustomerSales<CustomerSaleOrderDetail>(`/walk-in`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  deleteBusinessCacheByPrefix("customer-sales:");
  deleteBusinessCacheByPrefix("stock:articles:");
  deleteBusinessCacheByPrefix("dashboard:summary:");
  return sale;
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
  const sale = await requestCustomerSales<CustomerSaleOrderDetail>(`/${orderId}/assign-delivery`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  deleteBusinessCacheByPrefix("customer-sales:");
  return sale;
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

export async function getPerformanceDashboardSummary(
  period: FinancialPeriod = "month",
  limit = 10
): Promise<PerformanceDashboardSummary> {
  const orgId = getStoredOrganizationId();
  if (!orgId) throw new Error("ORG_REQUIRED");
  const cacheKey = `api:dashboard-summary:${orgId}:${period}:${limit}`;
  return deduped(
    cacheKey,
    async () => {
      const q = queryFromObject({ period, limit: String(limit) });
      return requestPerformance<PerformanceDashboardSummary>(`/dashboard-summary${q}`);
    },
    { ttlMs: 60_000 }
  );
}

export async function getFinancialSummary(
  period: FinancialPeriod = "month"
): Promise<FinancialSummary> {
  const orgId = getStoredOrganizationId();
  if (!orgId) throw new Error("ORG_REQUIRED");
  const cacheKey = `api:financial-summary:${orgId}:${period}`;
  return deduped(
    cacheKey,
    async () => {
      const q = queryFromObject({ period });
      return requestPerformance<FinancialSummary>(`/financial-summary${q}`);
    },
    { ttlMs: 60_000 }
  );
}

export async function getSalesStatusSummary(
  period: FinancialPeriod = "month"
): Promise<SalesStatusSummary> {
  const orgId = getStoredOrganizationId();
  if (!orgId) throw new Error("ORG_REQUIRED");
  const cacheKey = `api:sales-status:${orgId}:${period}`;
  return deduped(
    cacheKey,
    async () => {
      const q = queryFromObject({ period });
      return requestPerformance<SalesStatusSummary>(`/sales-status${q}`);
    },
    { ttlMs: 60_000 }
  );
}

export async function getTopProductsSummary(
  period: PerformancePeriod = "30d",
  limit = 20
): Promise<TopProductsSummary> {
  const orgId = getStoredOrganizationId();
  if (!orgId) throw new Error("ORG_REQUIRED");
  const cacheKey = `api:top-products:${orgId}:${period}:${limit}`;
  return deduped(
    cacheKey,
    async () => {
      const q = queryFromObject({ period, limit: String(limit) });
      return requestPerformance<TopProductsSummary>(`/top-products${q}`);
    },
    { ttlMs: 60_000 }
  );
}

export async function getTrendingProductsSummary(
  period: PerformancePeriod = "30d",
  limit = 20
): Promise<TrendingProductsSummary> {
  const orgId = getStoredOrganizationId();
  if (!orgId) throw new Error("ORG_REQUIRED");
  const cacheKey = `api:trending-products:${orgId}:${period}:${limit}`;
  return deduped(
    cacheKey,
    async () => {
      const q = queryFromObject({ period, limit: String(limit) });
      return requestPerformance<TrendingProductsSummary>(`/trending-products${q}`);
    },
    { ttlMs: 60_000 }
  );
}

export async function getPerformanceAIContext(
  period: FinancialPeriod = "month"
): Promise<AIContextResponse> {
  const q = queryFromObject({ period });
  return requestPerformance<AIContextResponse>(`/ai-context${q}`);
}

export async function getPerformanceAgentCapabilities(): Promise<unknown> {
  return requestPerformance<unknown>("/agent/capabilities");
}

export async function runPerformanceAgent(body: {
  task: PerformanceAgentTask;
  period?: FinancialPeriod;
  extra_instructions?: string;
  max_tokens?: number;
}): Promise<PerformanceAgentResponse> {
  return requestPerformance<PerformanceAgentResponse>("/agent", {
    method: "POST",
    body: JSON.stringify({
      task: body.task,
      period: body.period ?? "month",
      language: "fr",
      extra_instructions: body.extra_instructions,
      max_tokens: body.max_tokens ?? 1200,
    }),
  });
}
