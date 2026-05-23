import { NextResponse } from "next/server";
import { extractApiErrorMessage } from "@/lib/api/parse-api-error";
import { getEmallBackendBase } from "@/lib/server/emall-backend";

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const backend = getEmallBackendBase();
  if (!backend) {
    return NextResponse.json({ error: "E_MALL_API_URL manquant" }, { status: 500 });
  }

  const auth = request.headers.get("Authorization");
  if (!auth) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { orderId } = await context.params;
  const target = `${backend}/api/v1/customer-sales/delivery-assignments/${orderId}/track-points`;
  const bodyText = await request.text();

  const res = await fetch(target, {
    method: "POST",
    headers: {
      Authorization: auth,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: bodyText || "{}",
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
