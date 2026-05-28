"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUp, ChevronRight, Loader2 } from "lucide-react";
import { getArticle } from "@/lib/api/emall-client";
import { ArticlePostsEditor } from "@/components/dashboard/article-posts-editor";
import { getStoredOrganizationId } from "@/lib/organization-storage";
import {
  AdminGate,
  SalesOrganizationGate,
} from "@/components/dashboard/dashboard-access-provider";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { translate } from "@/lib/i18n";

export default function StockPostEditPage() {
  return (
    <SalesOrganizationGate description="Les posts vitrine sont disponibles uniquement pour les organisations de vente.">
      <AdminGate description="Seul un administrateur peut modifier les posts vitrine.">
        <StockPostEditContent />
      </AdminGate>
    </SalesOrganizationGate>
  );
}

function StockPostEditContent() {
  const { profile } = useMemberProfile();
  const t = (key: string) => translate(profile?.params?.locale, key);
  const params = useParams();
  const searchParams = useSearchParams();
  const articleId = typeof params.articleId === "string" ? params.articleId : "";
  const returnSource = searchParams.get("from") === "stock" ? "stock" : "posts";
  const returnHref = returnSource === "stock" ? "/dashboard/stock" : "/dashboard/stock/posts";
  const returnLabel = returnSource === "stock" ? "Retour au stock" : `Retour aux ${t("postsShowcase").toLowerCase()}`;
  const [orgId, setOrgId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    setOrgId(getStoredOrganizationId());
  }, []);

  useEffect(() => {
    if (!articleId) return;
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
  }, [articleId]);

  useEffect(() => {
    const scrollContainer = document.querySelector("main");
    if (!(scrollContainer instanceof HTMLElement)) return;

    const onScroll = () => {
      setShowBackToTop(scrollContainer.scrollTop > 360);
    };

    onScroll();
    scrollContainer.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const scrollContainer = document.querySelector("main");
    if (scrollContainer instanceof HTMLElement) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        {t("loadingCatalog")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-4 pb-12">
        <p className="text-sm text-rose-600">{error}</p>
        <Link
          href={returnHref}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← {returnLabel}
        </Link>
      </div>
    );
  }

  return (
    <div id="posts-page-top" className="mx-auto max-w-[1200px]">
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
          href={returnHref}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {returnLabel}
        </Link>
      </div>

      {orgId ? (
        <ArticlePostsEditor articleId={articleId} orgId={orgId} articleActive={active} />
      ) : (
        <p className="text-sm text-rose-600">Organisation introuvable.</p>
      )}

      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-indigo-100 bg-white text-indigo-700 shadow-lg shadow-gray-900/10 transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          aria-label="Remonter en haut"
          title="Remonter en haut"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
