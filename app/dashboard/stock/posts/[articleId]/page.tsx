"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { getArticle } from "@/lib/api/emall-client";
import { ArticlePostsEditor } from "@/components/dashboard/article-posts-editor";
import { getStoredOrganizationId } from "@/lib/organization-storage";
import { loadMemberProfileForSession } from "@/lib/api/member-me";
import { isAdminProfile } from "@/lib/authz";
import { AdminRequired } from "@/components/dashboard/admin-required";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { translate } from "@/lib/i18n";

export default function StockPostEditPage() {
  const { profile } = useMemberProfile();
  const t = (key: string) => translate(profile?.params?.locale, key);
  const params = useParams();
  const articleId = typeof params.articleId === "string" ? params.articleId : "";
  const [orgId, setOrgId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await loadMemberProfileForSession();
        const id = getStoredOrganizationId();
        if (!cancelled) {
          setIsAdmin(isAdminProfile(profile));
          setOrgId(id);
          setAccessLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setAccessLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!articleId || accessLoading || !isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
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
  }, [accessLoading, articleId, isAdmin]);

  if (!articleId) {
    return (
      <div className="mx-auto max-w-[1200px] pb-12 text-sm text-rose-600">
        Identifiant d’article manquant.
      </div>
    );
  }

  if (accessLoading) {
    return (
      <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-2 pb-12 pt-24 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
        {t("verifyAccess")}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AdminRequired description="Seul un administrateur peut modifier les posts vitrine." />
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-2 pb-12 pt-24 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
        {t("loadingCatalog")}
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
          ← {t("postsShowcase")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/stock" className="transition hover:text-gray-900">
          {t("stock")}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" />
        <Link href="/dashboard/stock/posts" className="transition hover:text-gray-900">
          {t("postsShowcase")}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" />
        <span className="font-medium text-gray-900 truncate max-w-[min(100%,280px)]">{name}</span>
      </nav>

      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{t("postsShowcase")}</h1>
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
        <Link
          href={`/dashboard/stock/${articleId}`}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("product")}
        </Link>
      </div>

      {orgId ? (
        <ArticlePostsEditor articleId={articleId} orgId={orgId} articleActive={active} />
      ) : (
        <p className="text-sm text-rose-600">Organisation introuvable.</p>
      )}

    </div>
  );
}
