import type { ApiCurrencyCode } from "@/lib/currencies";

export type OrderStatus = "open" | "received" | "cancelled";

/** Aligné sur l’enum SQL côté API e-Mall. */
export type ArticleCategory =
  | "electronics"
  | "appliances"
  | "clothing"
  | "food"
  | "beauty"
  | "sports"
  | "home"
  | "other";

export interface WholesalePriceTier {
  min_quantity: number;
  max_quantity: number | null;
  unit_price: number;
}

export interface CreateArticlePayload {
  name: string;
  category: ArticleCategory;
  unit_sale_price: number;
  sale_currency?: ApiCurrencyCode;
  wholesale_prices?: WholesalePriceTier[] | null;
  stock_quantity?: number;
  alert_quantity?: number;
  description?: string | null;
  primary_image_storage_path: string;
  additional_image_storage_paths?: string[];
  active?: boolean;
}

/** Champs optionnels pour `PATCH .../articles/{id}` (guide API). */
export type UpdateArticlePayload = Partial<{
  name: string;
  category: ArticleCategory;
  unit_sale_price: number;
  sale_currency: ApiCurrencyCode;
  wholesale_prices: WholesalePriceTier[] | null;
  stock_quantity: number;
  alert_quantity: number;
  description: string | null;
  primary_image_storage_path: string;
  additional_image_storage_paths: string[];
  active: boolean;
}>;

export interface ArticleOrderLine {
  id: string;
  article_id: string;
  quantity_ordered: number;
  total_price?: number | string | null;
  unit_price?: number | string | null;
  /** Renseigné après réception */
  quantity_received?: number | null;
}

export interface ArticleOrder {
  id: string;
  status: OrderStatus;
  currency?: ApiCurrencyCode | string | null;
  total_amount?: number | string | null;
  note?: string | null;
  lines?: ArticleOrderLine[];
  created_at?: string;
}

export interface OrganizationArticle {
  id: string;
  name: string;
  category?: string;
  unit_sale_price?: number;
  sale_currency?: ApiCurrencyCode | string | null;
  wholesale_prices?: WholesalePriceTier[] | null;
  stock_quantity?: number;
  alert_quantity?: number;
  stock_status?: string;
  description?: string | null;
  primary_image_storage_path?: string | null;
  additional_image_storage_paths?: string[] | null;
  active?: boolean;
  created_at?: string;
}
