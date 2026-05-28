import { NextResponse } from "next/server";
import { extractApiErrorMessage } from "@/lib/api/parse-api-error";
import { getEmallBackendBase } from "@/lib/server/emall-backend";

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  const backend = getEmallBackendBase();
  if (!backend) {
    return NextResponse.json({ error: "E_MALL_API_URL manquant" }, { status: 500 });
  }

  const auth = request.headers.get("Authorization");
  if (!auth) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { orgId } = await context.params;
  const res = await fetch(
    `${backend}/api/v1/organization-subscriptions/organizations/${orgId}/entitlements`,
    {
      headers: { Authorization: auth, Accept: "application/json" },
      cache: "no-store",
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
