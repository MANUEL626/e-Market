"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  List,
  LayoutGrid,
  FileEdit,
  Info,
  Loader2,
  RefreshCw,
  Megaphone,
} from "lucide-react";
import { listArticles } from "@/lib/api/emall-client";
import { loadMemberProfileForSession } from "@/lib/api/member-me";
import {
  articleCategoryLabel,
  formatUnitPrice,
  stockStatusBadge,
} from "@/lib/dashboard/article-categories";
import { getOrganizationArticleSignedUrl } from "@/lib/supabase/organization-article-image-url";
import type { OrganizationArticle } from "@/lib/types/article-orders";

export default function StockManagementPage() {
  const [articles, setArticles] = useState<OrganizationArticle[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await loadMemberProfileForSession();
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
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) => {
      const name = (a.name ?? "").toLowerCase();
      const cat = articleCategoryLabel(a.category).toLowerCase();
      return name.includes(q) || cat.includes(q) || (a.stock_status ?? "").includes(q);
    });
  }, [articles, filter]);

  const kpis = useMemo(() => {
    const total = articles.length;
    const out = articles.filter((a) => a.stock_status === "out_of_stock").length;
    const low = articles.filter((a) => a.stock_status === "low_stock").length;
    const value = articles.reduce((sum, a) => {
      const q = a.stock_quantity ?? 0;
      const p = a.unit_sale_price ?? 0;
      return sum + q * p;
    }, 0);
    return { total, out, low, value };
  }, [articles]);

  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <div className="text-[10px] font-bold text-indigo-700 tracking-widest uppercase mb-1">
            Inventaire
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
            Stock &amp; articles
          </h1>
          <p className="text-gray-500 max-w-xl text-base">
            Liste synchronisée avec l’API e-Mall (catalogue, prix, statut de stock).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-full transition shadow-sm disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Actualiser
          </button>
          <Link
            href="/dashboard/stock/drafts"
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-full transition shadow-sm"
          >
            <FileEdit className="w-4 h-4" /> Brouillons
          </Link>
          <Link
            href="/dashboard/stock/posts"
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-full transition shadow-sm"
          >
            <Megaphone className="w-4 h-4" /> Posts vitrine
          </Link>
          <Link
            href="/dashboard/stock/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#3730A3] hover:bg-[#2e2889] text-white text-sm font-semibold rounded-full transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Ajouter un article
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">Articles</div>
            <div className="text-3xl font-extrabold text-gray-900">{kpis.total}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">Rupture</div>
            <div className="text-3xl font-extrabold text-gray-900">{kpis.out}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">Stock bas</div>
            <div className="text-3xl font-extrabold text-gray-900">{kpis.low}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="text-xs font-semibold text-gray-500 mb-1">Valeur (qty × prix)</div>
          <div className="text-2xl font-extrabold text-gray-900">
            {formatUnitPrice(kpis.value)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrer par nom, catégorie…"
              className="w-full bg-gray-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={!activeOnly}
                onChange={(e) => setActiveOnly(!e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Afficher inactifs
            </label>
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl opacity-60 pointer-events-none">
              <span className="p-2 text-gray-500 rounded-lg bg-white shadow-sm">
                <List className="w-4 h-4" />
              </span>
              <span className="p-2 text-gray-400 rounded-lg">
                <LayoutGrid className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="overflow-x-auto min-h-[200px]">
          {loading && !articles.length ? (
            <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Chargement…
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-bold text-gray-500 tracking-wider uppercase bg-gray-50/50">
                <tr>
                  <th className="px-6 py-5 rounded-tl-xl">Produit</th>
                  <th className="px-6 py-5">Catégorie</th>
                  <th className="px-6 py-5">Prix</th>
                  <th className="px-6 py-5">Quantité</th>
                  <th className="px-6 py-5">Statut</th>
                  <th className="px-6 py-5 rounded-tr-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((product) => {
                  const badge = stockStatusBadge(product.stock_status);
                  const qty = product.stock_quantity ?? 0;
                  const maxBar = Math.max(qty, product.alert_quantity ?? 0, 1);
                  const thumb = thumbs[product.id];
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-200 flex-shrink-0">
                            {thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={thumb}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 text-center px-1">
                                —
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5 font-mono truncate max-w-[200px]">
                              {product.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {articleCategoryLabel(product.category)}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {formatUnitPrice(product.unit_sale_price)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900 w-8">{qty}</span>
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                qty > 20 ? "bg-indigo-600" : qty > 0 ? "bg-rose-500" : "bg-gray-300"
                              }`}
                              style={{
                                width: `${Math.min((qty / maxBar) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full tracking-wider ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/stock/${product.id}`}
                          className="inline-flex items-center justify-center text-gray-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition"
                          title="Voir / modifier"
                        >
                          <Info className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div>
            {filtered.length === 0 && !loading ? (
              <span>Aucun article à afficher.</span>
            ) : (
              <>
                <span className="font-bold text-gray-900">{filtered.length}</span> article
                {filtered.length > 1 ? "s" : ""}
                {filter.trim() ? " (filtrés)" : ""}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
