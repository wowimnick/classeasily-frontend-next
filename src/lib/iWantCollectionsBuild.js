import generatedIWantCollections from "@/_generated/iWantCollections.json";
import { filterCollectionsWithActiveClasses } from "@/lib/filterCollectionsWithActiveClasses";

/** Collections for the “I want…” picker, baked in at build time. */
export function getBuildIWantCollections() {
  const rows = Array.isArray(generatedIWantCollections?.collections)
    ? generatedIWantCollections.collections
    : [];
  return filterCollectionsWithActiveClasses(rows);
}
