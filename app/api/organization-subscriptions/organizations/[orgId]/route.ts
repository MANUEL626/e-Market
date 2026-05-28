import { NextResponse } from "next/server";
import { extractApiErrorMessage } from "@/lib/api/parse-api-error";
import { getEmallBackendBase } from "@/lib/server/emall-backend";

async function proxy(
  request: Request,
  orgId: string,
  method: "GET" | "PATCH"
) {
  const backend = getEmallBackendBase();
  if (!backend) {
    return NextResponse.json({ error: "E_MALL_API_URL manquant" }, { status: 500 });
  }

  const auth = request.headers.get("Authorization");
  if (!auth) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const init: RequestInit = {
    method,
    headers: { Authorization: auth, Accept: "application/json" },
    cache: "no-store",
  };

  if (method === "PATCH") {
    const body = await request.text();
    init.headers = {
      ...init.headers,
      "Content-Type": "application/json",
    };
    if (body) init.body = body;
  }

  const res = await fetch(
    `${backend}/api/v1/organization-subscriptions/organizations/${orgId}`,
    init
  );
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
  context: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await context.params;
  return proxy(request, orgId, "GET");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await context.params;
  return proxy(request, orgId, "PATCH");
}
