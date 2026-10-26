"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { MediaListItem } from "@/lib/media/admin-types";
import { listMedia } from "@/server/actions/media";

/** Paged, searchable media list backed by the listMedia server action. */
export function useMediaList(
  initial?: { items: MediaListItem[]; nextCursor?: string },
  { videos = true }: { videos?: boolean } = {},
) {
  const [items, setItems] = useState<MediaListItem[]>(initial?.items ?? []);
  const [cursor, setCursor] = useState<string | undefined>(initial?.nextCursor);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(!!initial);
  const [pending, startTransition] = useTransition();

  const load = useCallback(
    (q: string) => {
      startTransition(async () => {
        const res = await listMedia({ q, videos });
        setItems(res.items);
        setCursor(res.nextCursor);
        setLoaded(true);
      });
    },
    [videos],
  );

  // Debounced search.
  useEffect(() => {
    if (!loaded && query === "") {
      load("");
      return;
    }
    const t = setTimeout(() => load(query), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to query changes
  }, [query]);

  const loadMore = () =>
    startTransition(async () => {
      if (!cursor) return;
      const res = await listMedia({ q: query, cursor, videos });
      setItems((prev) => [...prev, ...res.items]);
      setCursor(res.nextCursor);
    });

  return {
    items,
    setItems,
    query,
    setQuery,
    pending,
    hasMore: !!cursor,
    loadMore,
    prepend: (added: MediaListItem[]) => setItems((prev) => [...added, ...prev]),
  };
}
