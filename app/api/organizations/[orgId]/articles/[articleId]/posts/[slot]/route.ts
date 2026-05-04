import { NextResponse } from "next/server";
import { getEmallBackendBase } from "@/lib/server/emall-backend";
import { extractApiErrorMessage } from "@/lib/api/parse-api-error";
import {
  buildUpsertArticlePostBody,
  parseUpsertPostBodyFromRequest,
} from "@/lib/article-posts/utils";

function parseSlot(raw: string): number | null {
  const n = Number.parseInt(raw, 10);
  if (n === 1 || n === 2 || n === 3) return n;
  return null;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ orgId: string; articleId: string; slot: string }> }
) {
  const backend = getEmallBackendBase();
  if (!backend) {
    return NextResponse.json({ error: "E_MALL_API_URL manquant" }, { status: 500 });
  }
  const auth = request.headers.get("Authorization");
  if (!auth) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { orgId, articleId, slot: slotParam } = await context.params;
  const slot = parseSlot(slotParam);
  if (slot === null) {
    return NextResponse.json({ error: "Emplacement invalide (1–3)" }, { status: 400 });
  }
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }
  const parsed = parseUpsertPostBodyFromRequest(rawBody);
  if (!parsed) {
    return NextResponse.json(
      {
        error:
          "Corps invalide : attendu media_kind (image|video), media_storage_path (chaîne non vide), caption et active optionnels.",
      },
      { status: 400 }
    );
  }
  let payload: ReturnType<typeof buildUpsertArticlePostBody>;
  try {
    payload = buildUpsertArticlePostBody(orgId, parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Validation";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const res = await fetch(
    `${backend}/api/v1/organizations/${orgId}/articles/${articleId}/posts/${slot}`,
    {
      method: "PUT",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
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

export async function DELETE(
  request: Request,
  context: { params: Promise<{ orgId: string; articleId: string; slot: string }> }
) {
  const backend = getEmallBackendBase();
  if (!backend) {
    return NextResponse.json({ error: "E_MALL_API_URL manquant" }, { status: 500 });
  }
  const auth = request.headers.get("Authorization");
  if (!auth) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { orgId, articleId, slot: slotParam } = await context.params;
  const slot = parseSlot(slotParam);
  if (slot === null) {
    return NextResponse.json({ error: "Emplacement invalide (1–3)" }, { status: 400 });
  }
  const res = await fetch(
    `${backend}/api/v1/organizations/${orgId}/articles/${articleId}/posts/${slot}`,
    {
      method: "DELETE",
      headers: { Authorization: auth, Accept: "application/json" },
    }
  );
  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
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
  return new NextResponse(null, { status: res.status });
}
