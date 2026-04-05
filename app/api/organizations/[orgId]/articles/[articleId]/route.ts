import { NextResponse } from "next/server";
import { getEmallBackendBase } from "@/lib/server/emall-backend";
import { extractApiErrorMessage } from "@/lib/api/parse-api-error";

async function proxyToBackend(
  request: Request,
  orgId: string,
  articleId: string,
  method: "GET" | "PATCH",
  body?: unknown
) {
  const backend = getEmallBackendBase();
  if (!backend) {
    return NextResponse.json({ error: "E_MALL_API_URL manquant" }, { status: 500 });
  }
  const auth = request.headers.get("Authorization");
  if (!auth) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const init: RequestInit = {
    method,
    headers: {
      Authorization: auth,
      Accept: "application/json",
    },
  };
  if (method === "PATCH") {
    init.headers = { ...init.headers, "Content-Type": "application/json" };
    init.body = JSON.stringify(body ?? {});
  }
  const res = await fetch(
    `${backend}/api/v1/organizations/${orgId}/articles/${articleId}`,
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
  return NextResponse.json(data, { status: res.status });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string; articleId: string }> }
) {
  const { orgId, articleId } = await context.params;
  return proxyToBackend(request, orgId, articleId, "GET");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orgId: string; articleId: string }> }
) {
  const { orgId, articleId } = await context.params;
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }
  return proxyToBackend(request, orgId, articleId, "PATCH", body);
}
