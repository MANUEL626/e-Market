import { NextResponse } from "next/server";
import { extractApiErrorMessage } from "@/lib/api/parse-api-error";
import { getEmallBackendBase } from "@/lib/server/emall-backend";

async function proxyMemberParams(request: Request, method: "GET" | "PATCH") {
  const backend = getEmallBackendBase();
  if (!backend) {
    return NextResponse.json({ error: "E_MALL_API_URL manquant" }, { status: 500 });
  }

  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  let body: string | undefined;
  if (method === "PATCH") {
    try {
      body = JSON.stringify(await request.json());
    } catch {
      return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
    }
  }

  const res = await fetch(`${backend}/api/v1/members/me/params`, {
    method,
    headers: {
      Authorization: auth,
      Accept: "application/json",
      ...(method === "PATCH" ? { "Content-Type": "application/json" } : {}),
    },
    body,
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

export async function GET(request: Request) {
  return proxyMemberParams(request, "GET");
}

export async function PATCH(request: Request) {
  return proxyMemberParams(request, "PATCH");
}
