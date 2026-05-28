import { NextResponse } from "next/server";
import { getEmallBackendBase } from "@/lib/server/emall-backend";
import { extractApiErrorMessage } from "@/lib/api/parse-api-error";
import { backendFetch, backendFetchErrorResponse } from "@/lib/server/backend-fetch";

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
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { orgId } = await context.params;
  const { searchParams } = new URL(request.url);
  const articleIds = searchParams.getAll("article_ids").filter(Boolean);
  if (articleIds.length === 0) {
    return NextResponse.json({ counts: {} }, { status: 200 });
  }

  const qs = new URLSearchParams();
  for (const id of articleIds) qs.append("article_ids", id);

  let res: Response;
  try {
    res = await backendFetch(
      `${backend}/api/v1/organizations/${orgId}/articles/posts/batch?${qs.toString()}`,
      {
        method: "GET",
        headers: { Authorization: auth, Accept: "application/json" },
      }
    );
  } catch (error) {
    return backendFetchErrorResponse(
      error,
      "Backend indisponible pendant le chargement des posts."
    );
  }

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

