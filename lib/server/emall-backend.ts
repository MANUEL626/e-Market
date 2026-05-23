export function getEmallBackendBase(): string | undefined {
  const raw = process.env.E_MALL_API_URL?.trim();
  return raw ? raw.replace(/\/$/, "") : undefined;
}
