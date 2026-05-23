"use client";

const cache = new Map<string, unknown>();

export function getBusinessCache<T>(key: string): T | null {
  return (cache.get(key) as T | undefined) ?? null;
}

export function setBusinessCache<T>(key: string, value: T): T {
  cache.set(key, value);
  return value;
}

export function updateBusinessCache<T>(key: string, updater: (current: T | null) => T): T {
  const next = updater(getBusinessCache<T>(key));
  cache.set(key, next);
  return next;
}
