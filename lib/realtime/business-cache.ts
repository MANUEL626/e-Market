"use client";

type CacheEntry = {
  value: unknown;
  expiresAt: number | null;
};

const cache = new Map<string, CacheEntry>();

export function getBusinessCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt != null && entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setBusinessCache<T>(
  key: string,
  value: T,
  options?: { ttlMs?: number }
): T {
  cache.set(key, {
    value,
    expiresAt: options?.ttlMs ? Date.now() + options.ttlMs : null,
  });
  return value;
}

export function updateBusinessCache<T>(key: string, updater: (current: T | null) => T): T {
  const next = updater(getBusinessCache<T>(key));
  cache.set(key, { value: next, expiresAt: null });
  return next;
}

export function deleteBusinessCache(key: string) {
  cache.delete(key);
}

export function deleteBusinessCacheByPrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
