import { NextResponse } from "next/server";
import { getEmallBackendBase } from "@/lib/server/emall-backend";
import { extractApiErrorMessage } from "@/lib/api/parse-api-error";

export async function GET(request: Request) {
  const backend = getEmallBackendBase();
  if (!backend) {
    return NextResponse.json({ error: "E_MALL_API_URL manquant" }, { status: 500 });
  }

  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const res = await fetch(`${backend}/api/v1/members/me`, {
    headers: {
      Authorization: auth,
      Accept: "application/json",
    },
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
