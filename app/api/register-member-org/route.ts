import { NextResponse } from "next/server";

function getBackendUrl(): string | undefined {
  const raw = process.env.E_MALL_API_URL?.trim();
  return raw ? raw.replace(/\/$/, "") : undefined;
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

  const res = await fetch(`${backend}/api/v1/organizations/register-with-member`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
