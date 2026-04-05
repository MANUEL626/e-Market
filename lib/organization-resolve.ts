import { getStoredOrganizationId } from "@/lib/organization-storage";

/** UUID d’organisation courante (profil membre / localStorage). */
export function getEffectiveOrganizationId(): string | null {
  return getStoredOrganizationId();
}
