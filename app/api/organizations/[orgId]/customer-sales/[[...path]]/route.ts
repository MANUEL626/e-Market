import { NextResponse } from "next/server";
import { getEmallBackendBase } from "@/lib/server/emall-backend";
import { extractApiErrorMessage } from "@/lib/api/parse-api-error";

async function proxy(
  request: Request,
  orgId: string,
  pathSegments: string[] | undefined,
  method: "GET" | "POST" | "PATCH"
) {
  const backend = getEmallBackendBase();
  if (!backend) {
    return NextResponse.json({ error: "E_MALL_API_URL manquant" }, { status: 500 });
  }
  const auth = request.headers.get("Authorization");
  if (!auth) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const path = pathSegments?.join("/") ?? "";
  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  const target = `${backend}/api/v1/organizations/${orgId}/customer-sales${path ? `/${path}` : ""}${qs ? `?${qs}` : ""}`;

  const init: RequestInit = {
    method,
    headers: {
      Authorization: auth,
      Accept: "application/json",
    },
  };

  if (method !== "GET") {
    const bodyText = await request.text();
    init.headers = {
      ...init.headers,
      "Content-Type": "application/json",
    };
    if (bodyText) init.body = bodyText;
  }

  const res = await fetch(target, init);
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
    return NextResponse.json(
      { error: extractApiErrorMessage(data), detail: data },
      { status: res.status }
    );
  }
  if (res.status === 204 || text === "") {
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.json(data, { status: res.status });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string; path?: string[] }> }
) {
  const { orgId, path } = await context.params;
  return proxy(request, orgId, path, "GET");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ orgId: string; path?: string[] }> }
) {
  const { orgId, path } = await context.params;
  return proxy(request, orgId, path, "POST");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orgId: string; path?: string[] }> }
) {
  const { orgId, path } = await context.params;
  return proxy(request, orgId, path, "PATCH");
}
