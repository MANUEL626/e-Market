import type { MemberMeResponse } from "@/lib/types/member-me";

const PROFILE_KEY = "e_mall_member_profile";

export function getStoredMemberProfile(): MemberMeResponse | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MemberMeResponse;
  } catch {
    return null;
  }
}

export function setStoredMemberProfile(data: MemberMeResponse) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("e_mall_member_profile_updated", { detail: data }));
}

export function clearStoredMemberProfile() {
  localStorage.removeItem(PROFILE_KEY);
}

export function displayNameFromUser(user: MemberMeResponse["user"]): string {
  const parts = [user.first_name, user.last_name].filter(Boolean) as string[];
  if (parts.length) return parts.join(" ");
  return user.email || user.username;
}

export function initialsFromUser(user: MemberMeResponse["user"]): string {
  const fn = user.first_name?.trim();
  const ln = user.last_name?.trim();
  if (fn && ln) return `${fn[0]}${ln[0]}`.toUpperCase();
  if (fn) return fn.slice(0, 2).toUpperCase();
  if (user.email) return user.email.slice(0, 2).toUpperCase();
  return user.username.slice(0, 2).toUpperCase();
}
