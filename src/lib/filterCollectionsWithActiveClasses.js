/**
 * Curated collection rows that have at least one active class.
 * When `active_class_count` is absent (older API responses), keep the row.
 */
export function filterCollectionsWithActiveClasses(collections) {
  if (!Array.isArray(collections)) return [];
  return collections.filter((c) => {
    if (!c || c.is_all) return true;
    const raw = c.active_class_count ?? c.class_count;
    if (raw === undefined || raw === null) return true;
    return Number(raw) > 0;
  });
}
