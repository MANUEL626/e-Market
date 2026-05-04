"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { getArticle } from "@/lib/api/emall-client";
import { ArticlePostsEditor } from "@/components/dashboard/article-posts-editor";
import { getStoredOrganizationId } from "@/lib/organization-storage";
import { loadMemberProfileForSession } from "@/lib/api/member-me";

export default function StockPostEditPage() {
  const params = useParams();
  const articleId = typeof params.articleId === "string" ? params.articleId : "";
  const [orgId, setOrgId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let id = getStoredOrganizationId();
      if (!id) {
        await loadMemberProfileForSession();
        id = getStoredOrganizationId();
      }
      if (!cancelled) setOrgId(id);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!articleId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadMemberProfileForSession();
        const a = await getArticle(articleId);
        if (cancelled) return;
        setName(a.name ?? "");
        setActive(a.active !== false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Article introuvable");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  if (!articleId) {
    return (
      <div className="mx-auto max-w-[1200px] pb-12 text-sm text-rose-600">
        Identifiant d’article manquant.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-2 pb-12 pt-24 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
        Chargement…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-4 pb-12">
        <p className="text-sm text-rose-600">{error}</p>
        <Link
          href="/dashboard/stock/posts"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← Retour aux posts vitrine
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] pb-12">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/stock" className="transition hover:text-gray-900">
          Stock
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" />
        <Link href="/dashboard/stock/posts" className="transition hover:text-gray-900">
          Posts vitrine
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" />
        <span className="font-medium text-gray-900 truncate max-w-[min(100%,280px)]">{name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Posts vitrine</h1>
        <p className="mt-2 text-sm text-gray-500">
          Article : <span className="font-semibold text-gray-800">{name}</span>
          <span
            className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
            }`}
          >
            {active ? "Actif" : "Inactif"}
          </span>
        </p>
        <p className="mt-1 font-mono text-[10px] text-gray-400">{articleId}</p>
      </div>

      {orgId ? (
        <ArticlePostsEditor articleId={articleId} orgId={orgId} articleActive={active} />
      ) : (
        <p className="text-sm text-rose-600">Organisation introuvable.</p>
      )}

      <div className="mt-10 border-t border-gray-100 pt-8">
        <Link
          href={`/dashboard/stock/${articleId}`}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← Fiche article (infos, médias, stock)
        </Link>
      </div>
    </div>
  );
}
