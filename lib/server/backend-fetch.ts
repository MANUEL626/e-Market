import { NextResponse } from "next/server";

export const BACKEND_FETCH_TIMEOUT_MS = 10_000;

export function backendFetchErrorResponse(
  error: unknown,
  fallback = "Backend indisponible."
) {
  const cause = error instanceof Error ? (error as Error & { cause?: unknown }).cause : null;
  const code =
    cause && typeof cause === "object" && "code" in cause
      ? String((cause as { code?: unknown }).code)
      : "";

  if (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    return NextResponse.json(
      { error: "Le backend met trop de temps a repondre. Reessayez dans un instant." },
      { status: 504 }
    );
  }

  return NextResponse.json(
    {
      error:
        code === "ECONNRESET"
          ? "Connexion backend interrompue pendant le traitement."
          : fallback,
      detail: error instanceof Error ? error.message : String(error),
    },
    { status: 502 }
  );
}

export function backendFetch(input: string | URL, init?: RequestInit) {
  return fetch(input, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(BACKEND_FETCH_TIMEOUT_MS),
  });
}
