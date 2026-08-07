"use client";

import { useTrackStoreView } from "@/hooks/use-track-store-view";

interface Props {
  slug: string;
}

/**
 * Invisible client component — fires store view tracking on mount.
 * Rendered inside the server-side tenant store page.
 */
export function TrackStoreView({ slug }: Props) {
  useTrackStoreView(slug);
  return null;
}
