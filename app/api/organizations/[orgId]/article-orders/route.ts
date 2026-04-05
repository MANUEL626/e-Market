import { NextResponse } from "next/server";
import { getEmallBackendBase } from "@/lib/server/emall-backend";
import { extractApiErrorMessage } from "@/lib/api/parse-api-error";

async function forwardJson(
  request: Request,
  orgId: string,
  pathSuffix: string,
  method: "GET" | "POST",
  body?: string
) {
  const backend = getEmallBackendBase();
  if (!backend) {
    return NextResponse.json({ error: "E_MALL_API_URL manquant" }, { status: 500 });
  }
  const auth = request.headers.get("Authorization");
  if (!auth) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const url = `${backend}/api/v1/organizations/${orgId}/article-orders${pathSuffix}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: auth,
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body } : {}),
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
    return NextResponse.json(
      { error: extractApiErrorMessage(data), detail: data },
      { status: res.status }
    );
  }
  return NextResponse.json(data, { status: res.status });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await context.params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return forwardJson(request, orgId, q, "GET");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await context.params;
  const body = await request.text();
  return forwardJson(request, orgId, "", "POST", body);
}
