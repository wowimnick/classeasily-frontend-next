/**
 * Normalize / serialize campaign audience for API (single type, or multi + rules[]).
 */

function normalizeSavedSegmentFilter(flt) {
  if (!flt || typeof flt !== "object") return {};
  const out = { ...flt };
  if (out.segment_id && (!Array.isArray(out.segment_ids) || out.segment_ids.length === 0)) {
    out.segment_ids = [out.segment_id];
    delete out.segment_id;
  }
  return out;
}

/**
 * @returns {{ audienceTypes: string[], audienceFilterByType: Record<string, object> }}
 */
export function campaignAudienceFromApi(audience_type, audience_filter) {
  const flt = audience_filter && typeof audience_filter === "object" ? audience_filter : {};
  if (audience_type === "multi" && Array.isArray(flt.rules) && flt.rules.length > 0) {
    const audienceTypes = [];
    const audienceFilterByType = {};
    for (const r of flt.rules) {
      if (!r || typeof r !== "object" || !r.type) continue;
      const t = String(r.type);
      if (!audienceTypes.includes(t)) audienceTypes.push(t);
      const raw = r.filter && typeof r.filter === "object" ? r.filter : {};
      audienceFilterByType[t] =
        t === "saved_segment" ? normalizeSavedSegmentFilter(raw) : { ...raw };
    }
    if (audienceTypes.length === 0) {
      return { audienceTypes: ["all_contacts"], audienceFilterByType: {} };
    }
    return { audienceTypes, audienceFilterByType };
  }
  const at = audience_type || "all_contacts";
  const filter =
    at === "saved_segment" ? normalizeSavedSegmentFilter(flt) : { ...flt };
  return {
    audienceTypes: [at],
    audienceFilterByType: { [at]: filter },
  };
}

/**
 * @param {string[]} audienceTypes
 * @param {Record<string, object>} audienceFilterByType
 * @returns {{ audience_type: string, audience_filter: object }}
 */
export function campaignAudienceToApi(audienceTypes, audienceFilterByType) {
  const types = [...new Set((audienceTypes || []).filter(Boolean))];
  if (types.length === 0) {
    return { audience_type: "all_contacts", audience_filter: {} };
  }
  if (types.length === 1 && types[0] === "all_contacts") {
    return { audience_type: "all_contacts", audience_filter: {} };
  }
  if (types.length === 1) {
    const t = types[0];
    const raw =
      audienceFilterByType && typeof audienceFilterByType[t] === "object"
        ? audienceFilterByType[t]
        : {};
    if (t === "saved_segment") {
      const ids = raw.segment_ids || [];
      if (Array.isArray(ids) && ids.length === 1) {
        return {
          audience_type: "saved_segment",
          audience_filter: { segment_id: ids[0] },
        };
      }
      return { audience_type: "saved_segment", audience_filter: { ...raw } };
    }
    return { audience_type: t, audience_filter: { ...raw } };
  }
  const rules = types.map((t) => ({
    type: t,
    filter:
      audienceFilterByType && typeof audienceFilterByType[t] === "object"
        ? { ...audienceFilterByType[t] }
        : {},
  }));
  return { audience_type: "multi", audience_filter: { rules } };
}
