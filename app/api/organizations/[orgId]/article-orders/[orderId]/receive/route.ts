import { NextResponse } from "next/server";
import { getEmallBackendBase } from "@/lib/server/emall-backend";
import { extractApiErrorMessage } from "@/lib/api/parse-api-error";

export async function POST(
  request: Request,
  context: { params: Promise<{ orgId: string; orderId: string }> }
) {
  const backend = getEmallBackendBase();
  if (!backend) {
    return NextResponse.json({ error: "E_MALL_API_URL manquant" }, { status: 500 });
  }
  const auth = request.headers.get("Authorization");
  if (!auth) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { orgId, orderId } = await context.params;
  const body = await request.text();
  const res = await fetch(
    `${backend}/api/v1/organizations/${orgId}/article-orders/${orderId}/receive`,
    {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body,
    }
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
