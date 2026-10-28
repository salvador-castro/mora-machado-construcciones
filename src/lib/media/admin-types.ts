/** Media item as shown in the admin library / picker. */
export type MediaListItem = {
  id: string;
  alt: string;
  originalName: string;
  width: number;
  height: number;
  size: number;
  thumbUrl: string;
  largeUrl: string;
  /** Videos only: URL of the MP4 (thumbUrl/largeUrl are its poster). */
  videoUrl: string | null;
  duration: number | null;
  createdAt: string;
};
