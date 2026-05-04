"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2, Plus, Search, Send, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { displayNameFromUser } from "@/lib/member-profile-storage";
import { useMemberProfile } from "@/lib/hooks/use-member-profile";
import { useMessagesRealtime } from "@/lib/hooks/use-messages-realtime";
import {
  getConversation,
  listConversations,
  listOrganizationMembersForMessaging,
  listMessages,
  openDirectConversation,
  sendMessage,
} from "@/lib/api/messaging-client";
import type {
  ConversationDetail,
  ConversationListItem,
  MessagingOrganizationMember,
  MessageRow,
} from "@/lib/types/messaging";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PAGE_SIZE = 50;

function formatMessageTime(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatListTime(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Horodatage le plus récent pour tri / affichage (aligné sur le guide API). */
function conversationTimeIso(conv: ConversationListItem): string | null {
  return conv.last_message?.created_at ?? conv.last_message_at;
}

/** Titre principal dans la liste : e-mail de l’interlocuteur (direct), sinon repli raisonnable. */
function conversationListPrimary(conv: ConversationListItem): string {
  const email = conv.other_participant?.email?.trim();
  if (email) return email;
  const p = conv.other_participant;
  if (p) {
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
    if (name) return name;
    if (p.username?.trim()) return p.username.trim();
  }
  if (conv.title?.trim()) return conv.title.trim();
  return conv.type === "group" ? "Groupe" : "Conversation";
}

function conversationListPreview(conv: ConversationListItem): string {
  const body = conv.last_message?.body?.trim();
  if (body) {
    return body.length > 100 ? `${body.slice(0, 97)}…` : body;
  }
  return "Aucun message";
}

function conversationListInitial(conv: ConversationListItem): string {
  const email = conv.other_participant?.email?.trim();
  if (email) return email.slice(0, 1).toUpperCase();
  const p = conv.other_participant;
  const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
  if (name) return name.slice(0, 1).toUpperCase();
  const t = conv.title?.trim();
  if (t) return t.slice(0, 1).toUpperCase();
  return "?";
}

function formatDayLabel(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
  }).format(new Date(iso));
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function labelForHeader(
  detail: ConversationDetail | null,
  myUserId: string | undefined
): string {
  if (!detail) return "Conversation";
  if (detail.title?.trim()) return detail.title;
  const parts = detail.participants ?? [];
  const other = parts.find((p) => p.user_id !== myUserId);
  if (other?.user) {
    const email = other.user.email?.trim();
    if (email) return email;
    return displayNameFromUser(other.user);
  }
  if (other) return `Utilisateur ${other.user_id.slice(0, 8)}…`;
  return "Conversation directe";
}

function mergeUniqueById(older: MessageRow[], newer: MessageRow[]): MessageRow[] {
  const map = new Map<string, MessageRow>();
  for (const m of older) map.set(m.id, m);
  for (const m of newer) map.set(m.id, m);
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

type ThreadItem =
  | { kind: "day"; iso: string }
  | { kind: "msg"; m: MessageRow };

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loading: profileLoading } = useMemberProfile();
  const myId = profile?.user.id;

  const [conversations, setConversations] = useState<ConversationListItem[]>(
    []
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [listFilter, setListFilter] = useState("");
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasOlder, setHasOlder] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [members, setMembers] = useState<MessagingOrganizationMember[]>([]);
  const [memberFilter, setMemberFilter] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  /** Évite un double appel `openDirectConversation` (ex. React Strict Mode). */
  const withProcessingRef = useRef<string | null>(null);

  const refreshList = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const list = await listConversations();
      setConversations(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (profileLoading) return;
    void refreshList();
  }, [profileLoading, refreshList]);

  const loadThread = useCallback(
    async (conversationId: string) => {
      setLoadingThread(true);
      setSendErr(null);
      try {
        const [d, initial] = await Promise.all([
          getConversation(conversationId),
          listMessages(conversationId, { limit: PAGE_SIZE }),
        ]);
        setDetail(d);
        const sorted = mergeUniqueById([], initial);
        setMessages(sorted);
        setHasOlder(initial.length >= PAGE_SIZE);
      } catch (e) {
        setSendErr(e instanceof Error ? e.message : "Chargement du fil impossible.");
        setMessages([]);
        setDetail(null);
      } finally {
        setLoadingThread(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setMessages([]);
      return;
    }
    void loadThread(selectedId);
  }, [selectedId, loadThread]);

  const onRealtimeInsert = useCallback((row: MessageRow) => {
    if (!selectedId || row.conversation_id !== selectedId) return;
    setMessages((prev) => {
      if (prev.some((m) => m.id === row.id)) return prev;
      return mergeUniqueById(prev, [row]);
    });
    setConversations((prev) =>
      prev.map((c) =>
        c.id === row.conversation_id
          ? {
              ...c,
              last_message_at: row.created_at,
              last_message: {
                id: row.id,
                conversation_id: row.conversation_id,
                sender_id: row.sender_id,
                body: row.body,
                created_at: row.created_at,
              },
            }
          : c
      )
    );
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [selectedId]);

  useMessagesRealtime(selectedId, onRealtimeInsert);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [selectedId, messages.length]);

  const withParam = searchParams.get("with")?.trim() ?? "";

  useEffect(() => {
    if (profileLoading || !myId) return;
    if (!withParam || !UUID_RE.test(withParam)) {
      withProcessingRef.current = null;
      return;
    }
    if (withParam === myId) {
      setSendErr("Vous ne pouvez pas démarrer une conversation avec vous-même.");
      router.replace("/dashboard/messages", { scroll: false });
      return;
    }
    if (withProcessingRef.current === withParam) return;
    withProcessingRef.current = withParam;

    (async () => {
      try {
        const { conversation_id } = await openDirectConversation(withParam);
        await refreshList();
        setSelectedId(conversation_id);
        router.replace("/dashboard/messages", { scroll: false });
      } catch (e) {
        withProcessingRef.current = null;
        setError(
          e instanceof Error ? e.message : "Ouverture de la conversation impossible."
        );
        router.replace("/dashboard/messages", { scroll: false });
      }
    })();
  }, [myId, profileLoading, refreshList, router, withParam]);

  async function submitDraft() {
    const text = draft.trim();
    if (!selectedId || !text || sending) return;
    setSending(true);
    setSendErr(null);
    try {
      const created = await sendMessage(selectedId, text);
      setDraft("");
      if (created?.id) {
        setMessages((prev) => mergeUniqueById(prev, [created]));
      } else {
        const again = await listMessages(selectedId, { limit: PAGE_SIZE });
        setMessages(mergeUniqueById([], again));
      }
      await refreshList();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setSendErr(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    void submitDraft();
  }

  async function loadOlder() {
    if (!selectedId || loadingMore || messages.length === 0 || !hasOlder) return;
    setLoadingMore(true);
    setSendErr(null);
    try {
      const oldest = messages[0];
      const older = await listMessages(selectedId, {
        limit: PAGE_SIZE,
        before: oldest.created_at,
      });
      if (older.length === 0) {
        setHasOlder(false);
        return;
      }
      if (older.length < PAGE_SIZE) setHasOlder(false);
      setMessages((prev) => mergeUniqueById(older, prev));
    } catch (e) {
      setSendErr(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function openMemberPicker() {
    setMemberPickerOpen(true);
    setMembersLoading(true);
    setMembersError(null);
    try {
      const rows = await listOrganizationMembersForMessaging(false);
      setMembers(rows.filter((m) => m.user_id !== myId));
    } catch (e) {
      setMembersError(
        e instanceof Error
          ? e.message
          : "Impossible de charger la liste des membres."
      );
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }

  async function startConversationWith(userId: string) {
    setMembersError(null);
    try {
      const { conversation_id } = await openDirectConversation(userId);
      await refreshList();
      setSelectedId(conversation_id);
      setMemberPickerOpen(false);
      setMemberFilter("");
    } catch (e) {
      setMembersError(
        e instanceof Error
          ? e.message
          : "Impossible d’ouvrir la conversation."
      );
    }
  }

  const sortedFilteredConversations = useMemo(() => {
    const q = listFilter.trim().toLowerCase();
    const list = !q
      ? conversations
      : conversations.filter((c) => {
          const email = (c.other_participant?.email ?? "").toLowerCase();
          const last = (c.last_message?.body ?? "").toLowerCase();
          const title = (c.title ?? "").toLowerCase();
          const un = (c.other_participant?.username ?? "").toLowerCase();
          const fn = (c.other_participant?.first_name ?? "").toLowerCase();
          const ln = (c.other_participant?.last_name ?? "").toLowerCase();
          return (
            email.includes(q) ||
            last.includes(q) ||
            title.includes(q) ||
            un.includes(q) ||
            fn.includes(q) ||
            ln.includes(q)
          );
        });
    return [...list].sort((a, b) => {
      const ta = new Date(
        conversationTimeIso(a) ?? a.created_at
      ).getTime();
      const tb = new Date(
        conversationTimeIso(b) ?? b.created_at
      ).getTime();
      return tb - ta;
    });
  }, [conversations, listFilter]);

  const filteredMembers = useMemo(() => {
    const q = memberFilter.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const name = `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim().toLowerCase();
      const username = (m.username ?? "").toLowerCase();
      return (
        name.includes(q) || username.includes(q)
      );
    });
  }, [memberFilter, members]);

  const headerTitle = labelForHeader(detail, myId);

  const [supabaseReady, setSupabaseReady] = useState(true);
  useEffect(() => {
    try {
      createClient();
      setSupabaseReady(true);
    } catch {
      setSupabaseReady(false);
    }
  }, []);

  const messagesWithDayBreaks: ThreadItem[] = [];
  let lastDay: string | null = null;
  for (const m of messages) {
    const dk = dayKey(m.created_at);
    if (dk !== lastDay) {
      lastDay = dk;
      messagesWithDayBreaks.push({ kind: "day", iso: m.created_at });
    }
    messagesWithDayBreaks.push({ kind: "msg", m });
  }

  return (
    <div className="max-w-[1400px] mx-auto h-[calc(100vh-144px)] min-h-[600px] bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex overflow-hidden">
      <div className="w-[380px] border-r border-gray-100 flex flex-col flex-shrink-0 bg-white">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-6 gap-4">
            <h1 className="text-2xl font-extrabold text-gray-900">Messages</h1>
            <button
              type="button"
              onClick={() => void openMemberPicker()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3730A3] hover:bg-[#2e2889] text-white text-xs font-bold transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nouveau
            </button>
          </div>
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={listFilter}
              onChange={(e) => setListFilter(e.target.value)}
              placeholder="E-mail, nom, dernier message…"
              className="w-full bg-gray-50 border border-transparent rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>
          {!supabaseReady && (
            <p className="text-xs text-amber-700 mt-3">
              Realtime indisponible : configurez Supabase (.env.local). Les envois REST fonctionnent
              tout de même.
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto mt-2">
          {loadingList && (
            <div className="flex items-center gap-2 text-sm text-gray-500 px-6 py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600 px-6 py-2">{error}</p>
          )}
          {!loadingList &&
            sortedFilteredConversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => setSelectedId(conv.id)}
                className={`relative w-full text-left flex items-center gap-4 p-4 cursor-pointer transition ${
                  selectedId === conv.id
                    ? "bg-indigo-50/50"
                    : "hover:bg-gray-50"
                }`}
              >
                {selectedId === conv.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-indigo-600 rounded-r-full" />
                )}
                <div className="relative ml-2 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                  {conversationListInitial(conv)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1 gap-2">
                    <h3 className="font-bold text-gray-900 truncate">
                      {conversationListPrimary(conv)}
                    </h3>
                    <span className="text-[9px] font-extrabold tracking-widest uppercase text-gray-400 shrink-0">
                      {formatListTime(conversationTimeIso(conv))}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {conversationListPreview(conv)}
                  </p>
                </div>
              </button>
            ))}
          {!loadingList && sortedFilteredConversations.length === 0 && !error && (
            <p className="text-sm text-gray-500 px-6 py-4">
              Aucune conversation. Ouvrez un fil avec le bouton{" "}
              <button
                type="button"
                onClick={() => void openMemberPicker()}
                className="text-indigo-700 font-semibold underline"
              >
                Nouveau
              </button>{" "}
              ou via une URL{" "}
              <span className="font-mono text-xs">
                ?with=&lt;uuid_utilisateur&gt;
              </span>
              .
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50/30 min-w-0">
        <div className="h-20 px-8 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
              {headerTitle.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-lg text-gray-900 leading-tight truncate">
                {selectedId ? headerTitle : "Sélectionnez une conversation"}
              </h2>
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-0.5">
                Messagerie E‑MALL
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-4">
          {!selectedId && (
            <p className="text-center text-sm text-gray-500 mt-12">
              Choisissez une conversation dans la liste ou démarrez-en une depuis la fiche d’un
              membre.
            </p>
          )}
          {selectedId && loadingThread && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-12">
              <Loader2 className="h-5 w-5 animate-spin" /> Chargement des messages…
            </div>
          )}
          {selectedId && !loadingThread && hasOlder && messages.length > 0 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => void loadOlder()}
                disabled={loadingMore}
                className="text-xs font-bold text-indigo-700 hover:underline disabled:opacity-50"
              >
                {loadingMore ? "Chargement…" : "Charger les messages plus anciens"}
              </button>
            </div>
          )}
          {sendErr && selectedId && (
            <p className="text-sm text-red-600 text-center">{sendErr}</p>
          )}
          {selectedId &&
            !loadingThread &&
            messagesWithDayBreaks.map((item, idx) => {
              if (item.kind === "day") {
                return (
                  <div key={`day-${item.iso}-${idx}`} className="flex justify-center my-4">
                    <span className="px-4 py-1.5 bg-white border border-gray-100 rounded-full text-[10px] font-extrabold text-gray-400 tracking-widest uppercase shadow-sm">
                      {formatDayLabel(item.iso)}
                    </span>
                  </div>
                );
              }
              const m = item.m;
              const mine = myId && m.sender_id === myId;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                      mine
                        ? "bg-[#3730A3] text-white rounded-br-sm"
                        : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p
                      className={`text-[10px] font-bold mt-2 ${
                        mine ? "text-indigo-200 text-right" : "text-gray-400"
                      }`}
                    >
                      {formatMessageTime(m.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          <div ref={bottomRef} />
        </div>

        <div className="p-6 bg-white border-t border-gray-100 flex-shrink-0">
          <form
            onSubmit={handleSend}
            className="bg-gray-50 border border-gray-100 rounded-full p-2 flex items-center transition focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 shadow-sm"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submitDraft();
                }
              }}
              placeholder={
                selectedId ? "Écrire un message…" : "Sélectionnez une conversation"
              }
              disabled={!selectedId || sending}
              className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none placeholder-gray-400 text-gray-700 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!selectedId || sending || !draft.trim()}
              className="w-10 h-10 bg-[#3730A3] hover:bg-[#2e2889] disabled:opacity-40 text-white rounded-full flex items-center justify-center shadow-md transition mr-1 flex-shrink-0"
              aria-label="Envoyer"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </form>
        </div>
      </div>
      {memberPickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-picker-title"
        >
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 id="member-picker-title" className="text-lg font-extrabold text-gray-900">
                  Démarrer une conversation
                </h2>
                <p className="text-sm text-gray-500">
                  Sélectionnez un membre pour ouvrir (ou retrouver) un fil direct.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMemberPickerOpen(false);
                  setMemberFilter("");
                }}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 border-b border-gray-100">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={memberFilter}
                  onChange={(e) => setMemberFilter(e.target.value)}
                  placeholder="Rechercher un membre (nom, e-mail, username)…"
                  className="w-full bg-gray-50 border border-transparent rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
            <div className="max-h-[380px] overflow-y-auto p-3">
              {membersLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500 px-3 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des membres…
                </div>
              )}
              {membersError && (
                <p className="text-sm text-red-600 px-3 py-2">{membersError}</p>
              )}
              {!membersLoading && !membersError && filteredMembers.length === 0 && (
                <p className="text-sm text-gray-500 px-3 py-4">
                  Aucun membre trouvé.
                </p>
              )}
              {!membersLoading &&
                !membersError &&
                filteredMembers.map((m) => (
                  <button
                    key={m.user_id}
                    type="button"
                    onClick={() => void startConversationWith(m.user_id)}
                    className="w-full text-left px-3 py-3 rounded-xl hover:bg-gray-50 transition flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                      {(m.first_name?.[0] ?? m.username?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {[m.first_name, m.last_name].filter(Boolean).join(" ") || m.username || "Utilisateur"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        @{m.username ?? "inconnu"} · {m.member_type}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1400px] mx-auto h-[calc(100vh-144px)] min-h-[400px] flex items-center justify-center bg-white rounded-[24px] border border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement des messages…
          </div>
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}
