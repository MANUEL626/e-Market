"use client";

import { createClient } from "@/lib/supabase/client";

const AVATAR_BUCKET = "avatars";

function normalizeAvatarPath(path: string): string {
  return path.replace(/^\/+/, "").replace(/^avatars\/+/i, "");
}

function avatarExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

async function uploadAvatar(path: string, file: File): Promise<string> {
  const objectPath = normalizeAvatarPath(path);
  if (!file.type.startsWith("image/")) {
    throw new Error("Selectionnez une image valide.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Session Supabase introuvable. Reconnectez-vous avant d'uploader une image.");
  }

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(objectPath, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || "image/jpeg",
  });

  if (error) {
    const rlsHint = /row-level security|violates/i.test(error.message)
      ? " La policy Storage du bucket avatars bloque probablement ce chemin d'objet."
      : "";
    throw new Error(
      `Upload avatar echoue (bucket: ${AVATAR_BUCKET}, path: ${objectPath}) : ${error.message}.${rlsHint}`
    );
  }

  return objectPath;
}

export async function uploadMemberAvatar(userId: string, file: File): Promise<string> {
  const ext = avatarExtension(file);
  return uploadAvatar(`${userId}/profile_${Date.now()}.${ext}`, file);
}

export async function uploadOrganizationAvatar(
  organizationId: string,
  file: File
): Promise<string> {
  const ext = avatarExtension(file);
  return uploadAvatar(`organizations/${organizationId}/profile_${Date.now()}.${ext}`, file);
}
