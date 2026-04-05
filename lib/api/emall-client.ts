import { createClient } from "@/lib/supabase/client";
import {
  getStoredOrganizationId,
  setStoredOrganizationId,
} from "@/lib/organization-storage";
import { extractApiErrorMessage } from "@/lib/api/parse-api-error";
import type {
  ArticleOrder,
  CreateArticlePayload,
  OrganizationArticle,
  UpdateArticlePayload,
} from "@/lib/types/article-orders";
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
  return request<OrganizationArticle>(`/articles/${articleId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
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
  return request(`/article-orders/${orderId}/receive`, {
    method: "POST",
    body: JSON.stringify({ lines }),
  });
}

export async function cancelArticleOrder(orderId: string): Promise<unknown> {
  return request(`/article-orders/${orderId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
