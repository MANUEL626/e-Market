"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Loader2,
  Megaphone,
  RefreshCw,
  Search,
} from "lucide-react";
import { getArticlePostsCountsBatch, listArticles } from "@/lib/api/emall-client";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { translate } from "@/lib/l10n";
import {
  AdminGate,
  SalesOrganizationGate,
  useDashboardAccess,
} from "@/components/dashboard/dashboard-access-provider";
import { articleCategoryLabel } from "@/lib/dashboard/article-categories";
import { getOrganizationArticleSignedUrl } from "@/lib/supabase/organization-article-image-url";
import type { OrganizationArticle } from "@/lib/types/article-orders";

export default function StockPostsIndexPage() {
  return (
    <SalesOrganizationGate description="Les posts vitrine sont disponibles uniquement pour les organisations de vente.">
      <AdminGate description="Seul un administrateur peut acceder aux posts vitrine.">
        <StockPostsIndexContent />
      </AdminGate>
    </SalesOrganizationGate>
  );
}

function StockPostsIndexContent() {
  const { profile } = useMemberProfile();
  const access = useDashboardAccess();
  const t = (key: string) => translate(profile?.params?.locale, key);
  const [articles, setArticles] = useState<OrganizationArticle[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string | null>>({});
  const [postCounts, setPostCounts] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [countsLoading, setCountsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const postsFeatureEnabled = access.hasFeature("article_posts");

  const loadArticles = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await listArticles(activeOnly);
      setArticles(list);
      const map: Record<string, string | null> = {};
      await Promise.all(
        list.map(async (a) => {
          map[a.id] = await getOrganizationArticleSignedUrl(a.primary_image_storage_path);
        })
      );
      setThumbs(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible");
      setArticles([]);
      setThumbs({});
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    if (!postsFeatureEnabled) {
      setPostCounts({});
      return;
    }
    if (articles.length === 0) {
      setPostCounts({});
      return;
    }
    let cancelled = false;
    (async () => {
      setCountsLoading(true);
      const next: Record<string, number | null> = {};
      articles.forEach((a) => {
        next[a.id] = null;
      });
      setPostCounts(next);
      try {
        const ids = articles.map((a) => a.id);
        const merged = await getArticlePostsCountsBatch(ids);
        if (cancelled) return;
        // si certains ids sont absents, on les met à 0 (pas d'appels individuels).
        const out: Record<string, number> = {};
        ids.forEach((id) => {
          out[id] = Number.isFinite(merged[id]) ? merged[id] : 0;
        });
        setPostCounts(out);
      } finally {
        if (!cancelled) setCountsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [articles, postsFeatureEnabled]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) => {
      const name = (a.name ?? "").toLowerCase();
      const cat = articleCategoryLabel(a.category).toLowerCase();
      return name.includes(q) || cat.includes(q);
    });
  }, [articles, filter]);

  return (
    <div className="mx-auto max-w-[1200px] pb-12">
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/stock" className="transition hover:text-gray-900">
          {t("stock")}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" />
        <span className="font-medium text-gray-900">{t("postsShowcase")}</span>
      </nav>

      <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-start">
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-700">
            {t("promotion")}
          </div>
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-gray-900">
            {t("postsShowcase")}
          </h1>
          <p className="max-w-xl text-base text-gray-500">
            {t("showcasePostsIntro")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadArticles()}
          disabled={loading}
          className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {t("refresh")}
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t("searchArticle")}
            className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          {t("activeArticlesOnly")}
        </label>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          {t("loadingCatalog")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">{t("articles")}</th>
                  <th className="hidden px-6 py-4 sm:table-cell">{t("category")}</th>
                  <th className="px-6 py-4">Posts</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      {t("noArticleMatches")}
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => {
                    const cnt = postCounts[a.id];
                    const errCount = cnt === -1;
                    return (
                      <tr key={a.id} className="hover:bg-gray-50/80">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-100">
                              {thumbs[a.id] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={thumbs[a.id]!}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                                  —
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate max-w-[220px] sm:max-w-xs">
                                {a.name}
                              </p>
                              <p className="font-mono text-[10px] text-gray-400 truncate">{a.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-6 py-4 text-gray-600 sm:table-cell">
                          {articleCategoryLabel(a.category)}
                        </td>
                        <td className="px-6 py-4">
                          {countsLoading && cnt == null ? (
                            <span className="text-gray-400">…</span>
                          ) : errCount ? (
                            <span className="text-amber-600">Erreur</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
                              {cnt ?? 0} posts
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/stock/posts/${a.id}?from=posts`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#3730A3] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#2e2889]"
                          >
                            <Megaphone className="h-3.5 w-3.5" />
                            {t("manage")}
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
