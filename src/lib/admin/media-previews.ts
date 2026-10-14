import "server-only";
import type { MediaListItem } from "@/lib/media/admin-types";
import { getMediaItems } from "@/server/actions/media";

/** id → preview for admin forms (null/duplicate ids are ignored). */
export async function mediaPreviews(
  ids: (string | null | undefined)[],
): Promise<Record<string, MediaListItem>> {
  const unique = [...new Set(ids.filter((v): v is string => !!v))];
  return Object.fromEntries((await getMediaItems(unique)).map((m) => [m.id, m]));
}
