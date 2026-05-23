"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MessageRow } from "@/lib/types/messaging";

export function useMessagesRealtime(
  conversationId: string | null,
  onInsert: (row: MessageRow) => void
) {
  const onInsertRef = useRef(onInsert);
  onInsertRef.current = onInsert;

  useEffect(() => {
    if (!conversationId) return;
    let supabase;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow;
          onInsertRef.current(row);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);
}
