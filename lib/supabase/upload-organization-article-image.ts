import { createClient } from "@/lib/supabase/client";

const BUCKET = "organization-articles";

export async function uploadOrganizationArticleImage(
  organizationId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const rawExt = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase()
    : "jpg";
  const ext = /^[a-z0-9]+$/i.test(rawExt) ? rawExt : "jpg";
  const objectPath = `${organizationId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return objectPath;
}
