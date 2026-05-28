export const API_CURRENCY_OPTIONS = [
  { code: "xof", label: "XOF - Franc CFA" },
  { code: "eur", label: "EUR - Euro" },
  { code: "usd", label: "USD - Dollar US" },
  { code: "gbp", label: "GBP - Livre sterling" },
  { code: "cny", label: "CNY - Yuan chinois" },
  { code: "ngn", label: "NGN - Naira" },
  { code: "ghs", label: "GHS - Cedi" },
] as const;

export type ApiCurrencyCode = (typeof API_CURRENCY_OPTIONS)[number]["code"];

export const DEFAULT_PURCHASE_CURRENCY: ApiCurrencyCode = "eur";
export const DEFAULT_SALE_CURRENCY: ApiCurrencyCode = "xof";

const API_CURRENCY_CODES = new Set<string>(
  API_CURRENCY_OPTIONS.map((currency) => currency.code)
);

export function isApiCurrencyCode(value: unknown): value is ApiCurrencyCode {
  return typeof value === "string" && API_CURRENCY_CODES.has(value.toLowerCase());
}

export function normalizeApiCurrency(
  value: unknown,
  fallback: ApiCurrencyCode
): ApiCurrencyCode {
  if (!isApiCurrencyCode(value)) return fallback;
  return value.toLowerCase() as ApiCurrencyCode;
}

export function formatMoney(
  value: number | string | null | undefined,
  currency: string | null | undefined,
  locale = "fr-FR"
): string {
  if (value == null || value === "") return "—";
  const amount = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(amount)) return "—";
  const resolvedCurrency = normalizeApiCurrency(currency, DEFAULT_PURCHASE_CURRENCY);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: resolvedCurrency.toUpperCase(),
  }).format(amount);
}
