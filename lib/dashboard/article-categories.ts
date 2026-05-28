import type { ArticleCategory } from "@/lib/types/article-orders";
import { formatMoney } from "@/lib/currencies";

export const ARTICLE_CATEGORY_OPTIONS: { value: ArticleCategory; label: string }[] = [
  { value: "electronics", label: "Électronique" },
  { value: "appliances", label: "Électroménager" },
  { value: "clothing", label: "Vêtements" },
  { value: "food", label: "Alimentation" },
  { value: "beauty", label: "Beauté" },
  { value: "sports", label: "Sport" },
  { value: "home", label: "Maison" },
  { value: "other", label: "Autre" },
];

export function articleCategoryLabel(value: string | undefined): string {
  if (!value) return "—";
  const o = ARTICLE_CATEGORY_OPTIONS.find((c) => c.value === value);
  return o?.label ?? value;
}

export function stockStatusBadge(stockStatus: string | undefined): {
  label: string;
  className: string;
} {
  switch (stockStatus) {
    case "out_of_stock":
      return { label: "Rupture", className: "bg-gray-100 text-gray-700" };
    case "low_stock":
      return { label: "Stock bas", className: "bg-rose-100 text-rose-700" };
    case "in_stock":
    default:
      return { label: "En stock", className: "bg-emerald-100 text-emerald-700" };
  }
}

export function formatUnitPrice(value: number | undefined, currency = "xof"): string {
  return formatMoney(value, currency);
}
