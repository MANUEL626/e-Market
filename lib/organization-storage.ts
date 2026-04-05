const ORG_KEY = "e_mall_organization_id";

export function getStoredOrganizationId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ORG_KEY);
}

export function setStoredOrganizationId(id: string) {
  localStorage.setItem(ORG_KEY, id);
}

export function clearStoredOrganizationId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ORG_KEY);
}
