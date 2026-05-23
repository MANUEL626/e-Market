import { NextResponse } from "next/server";

function getBackendUrl(): string | undefined {
  const raw = process.env.E_MALL_API_URL?.trim();
  return raw ? raw.replace(/\/$/, "") : undefined;
}

function optionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeCountries(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((country): country is string => typeof country === "string")
        .map((country) => country.trim().toUpperCase())
        .filter((country) => /^[A-Z]{2}$/.test(country))
    )
  );
}

function normalizeLocale(value: unknown): "fr" | "en" | "de" | "zh" {
  return value === "en" || value === "de" || value === "zh" ? value : "fr";
}

function buildRegisterPayload(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object") return null;
  const input = body as Record<string, unknown>;
  const organizationName = optionalString(input.organization_name);
  const organizationCategory = input.organization_category;
  const email = optionalString(input.email);
  const password = typeof input.password === "string" ? input.password : null;

  if (
    !organizationName ||
    (organizationCategory !== "sales" && organizationCategory !== "delivery") ||
    !email ||
    !password
  ) {
    return null;
  }

  return {
    organization_name: organizationName,
    organization_category: organizationCategory,
    organization_description: optionalString(input.organization_description),
    organization_profile_picture: optionalString(input.organization_profile_picture),
    organization_countries: normalizeCountries(input.organization_countries),
    member_first_name: optionalString(input.member_first_name),
    member_last_name: optionalString(input.member_last_name),
    member_username: optionalString(input.member_username),
    member_profile_picture: optionalString(input.member_profile_picture),
    member_locale: normalizeLocale(input.member_locale),
    email,
    password,
  };
}

export async function POST(request: Request) {
  const backend = getBackendUrl();
  if (!backend) {
    return NextResponse.json(
      { error: "Configuration serveur manquante : définissez E_MALL_API_URL dans .env.local" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const payload = buildRegisterPayload(body);
  if (!payload) {
    return NextResponse.json({ error: "Corps d'inscription invalide" }, { status: 400 });
  }

  const res = await fetch(`${backend}/api/v1/organizations/register-with-member`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const detail = data.detail;
    const message =
      typeof detail === "string"
        ? detail
        : typeof data.message === "string"
          ? data.message
          : "Inscription impossible";
    return NextResponse.json({ error: message, detail: data }, { status: res.status });
  }

  return NextResponse.json(data, { status: 201 });
}
