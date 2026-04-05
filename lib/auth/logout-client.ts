import { createClient } from "@/lib/supabase/client";
import { clearStoredMemberProfile } from "@/lib/member-profile-storage";
import { clearStoredOrganizationId } from "@/lib/organization-storage";

/** Déconnexion Supabase + nettoyage du cache marchand (localStorage). */
export async function performClientLogout(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // Variables Supabase absentes : on purge quand même l’état local.
  } finally {
    clearStoredMemberProfile();
    clearStoredOrganizationId();
  }
}
