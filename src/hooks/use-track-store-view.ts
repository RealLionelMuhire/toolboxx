"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

/**
 * Custom hook to track tenant store page visits.
 * - Tracks total visits on every page load.
 * - Tracks unique visits once per session (sessionStorage-deduped).
 *
 * @param slug - The tenant slug of the store being visited
 */
export const useTrackStoreView = (slug: string) => {
  const trpc = useTRPC();
  const hasTracked = useRef(false);
  const trackView = useMutation(trpc.tenants.trackStoreView.mutationOptions());

  useEffect(() => {
    if (typeof window === "undefined" || !slug || hasTracked.current) return;

    hasTracked.current = true;

    const viewedKey = `viewed_store_${slug}`;
    const hasViewedInSession = sessionStorage.getItem(viewedKey);

    trackView.mutate({
      slug,
      isUnique: !hasViewedInSession,
    });

    if (!hasViewedInSession) {
      sessionStorage.setItem(viewedKey, "true");
    }
  }, [slug]);

  return { isTracking: trackView.isPending };
};
