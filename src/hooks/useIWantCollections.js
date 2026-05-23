"use client";

import { useEffect, useState } from "react";
import { getBuildIWantCollections } from "@/lib/iWantCollectionsBuild";
import { filterCollectionsWithActiveClasses } from "@/lib/filterCollectionsWithActiveClasses";
import { collectionService } from "@/services/apiService";

/**
 * “I want…” picker options — initialized from build output, refreshed client-side when API succeeds.
 */
export function useIWantCollections() {
  const [iWantCollections, setIWantCollections] = useState(getBuildIWantCollections);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await collectionService.listByPlacement("i_want");
        const filtered = filterCollectionsWithActiveClasses(rows);
        if (!cancelled && filtered.length > 0) {
          setIWantCollections(filtered);
        }
      } catch {
        // Keep build-time data when the client fetch fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return iWantCollections;
}
