import { createClient } from "@/lib/supabase/client";
import { getStoredOrganizationId, setStoredOrganizationId } from "@/lib/organization-storage";
import { getStoredMemberProfile, setStoredMemberProfile } from "@/lib/member-profile-storage";
import type { MemberMeMembership, MemberMeResponse } from "@/lib/types/member-me";
import { extractApiErrorMessage } from "@/lib/api/parse-api-error";

function parseMemberMePayload(data: unknown): MemberMeResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Réponse profil invalide");
  }
  return data as MemberMeResponse;
}

/** Appelle le backend via la route Next.js (JWT session Supabase). */
export async function fetchMemberMe(accessToken: string): Promise<MemberMeResponse> {
  const res = await fetch("/api/members/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(
      typeof err.error === "string" ? err.error : extractApiErrorMessage(data)
    );
  }
  return parseMemberMePayload(data);
}

export async function fetchMemberMeWithSession(): Promise<MemberMeResponse | null> {
  let supabase;
  try {
    supabase = createClient();
  } catch {
    return null;
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  return fetchMemberMe(session.access_token);
}

/** Met à jour l’organisation courante (première adhésion avec org résolue) et le cache profil. */
export function applyMemberMeToClientState(data: MemberMeResponse) {
  const currentOrganizationId = getStoredOrganizationId();
  const current = currentOrganizationId
    ? data.memberships.find(
        (m) => m.organization_id === currentOrganizationId && m.organization
      )
    : undefined;
  const fallback = data.memberships.find((m) => m.organization);
  const organizationId = current?.organization_id ?? fallback?.organization_id;
  if (organizationId) {
    setStoredOrganizationId(organizationId);
  }
  setStoredMemberProfile(data);
}

let memberProfileInFlight: Promise<MemberMeResponse | null> | null = null;

async function loadMemberProfileForSessionRequest(): Promise<MemberMeResponse | null> {
  try {
    const data = await fetchMemberMeWithSession();
    if (data) {
      applyMemberMeToClientState(data);
    }
    return data;
  } catch (error) {
    const cached = getStoredMemberProfile();
    if (cached) {
      return cached;
    }
    throw error;
  }
}

export async function loadMemberProfileForSession(): Promise<MemberMeResponse | null> {
  if (!memberProfileInFlight) {
    memberProfileInFlight = loadMemberProfileForSessionRequest().finally(() => {
      memberProfileInFlight = null;
    });
  }
  return memberProfileInFlight;
}

/** Adhésion + organisation affichées (org stockée, sinon première avec `organization` résolue). */
export function getPrimaryMembership(
  data: MemberMeResponse
): MemberMeMembership | undefined {
  const id = getStoredOrganizationId();
  if (id) {
    const m = data.memberships.find((x) => x.organization_id === id && x.organization);
    if (m) return m;
  }
  return data.memberships.find((m) => m.organization);
}
