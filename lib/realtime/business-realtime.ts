"use client";

import { createClient } from "@/lib/supabase/client";

export type BusinessRealtimePayload<T> = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: Partial<T>;
};

type ChangeHandler<T> = (
  payload: BusinessRealtimePayload<T>
) => void;

function subscribeToTable<T>(
  channelName: string,
  table: string,
  filter: string,
  onChange: ChangeHandler<T>
): () => void {
  const supabase = createClient();
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter,
      },
      (payload) => onChange(payload as unknown as BusinessRealtimePayload<T>)
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeToOrganizationArticles<T>(
  organizationId: string,
  onChange: ChangeHandler<T>
): () => void {
  return subscribeToTable<T>(
    `articles:${organizationId}`,
    "organization_articles",
    `organization_id=eq.${organizationId}`,
    onChange
  );
}

export function subscribeToArticlePosts<T>(
  articleId: string,
  onChange: ChangeHandler<T>
): () => void {
  return subscribeToTable<T>(
    `article-posts:${articleId}`,
    "organization_article_posts",
    `organization_article_id=eq.${articleId}`,
    onChange
  );
}

export function subscribeToArticleOrders<T>(
  organizationId: string,
  onChange: ChangeHandler<T>
): () => void {
  return subscribeToTable<T>(
    `article-orders:${organizationId}`,
    "organization_article_orders",
    `organization_id=eq.${organizationId}`,
    onChange
  );
}

export function subscribeToCustomerSales<T>(
  organizationId: string,
  onChange: ChangeHandler<T>
): () => void {
  return subscribeToTable<T>(
    `customer-sales:${organizationId}`,
    "organization_customer_sale_orders",
    `organization_id=eq.${organizationId}`,
    onChange
  );
}

export function subscribeToOrganizationMembers<T>(
  organizationId: string,
  onChange: ChangeHandler<T>
): () => void {
  return subscribeToTable<T>(
    `members:${organizationId}`,
    "members",
    `organization_id=eq.${organizationId}`,
    onChange
  );
}
