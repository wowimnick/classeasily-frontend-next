/**
 * Single source of truth for audience type options, labels, and help text.
 * Used by both the Audiences saved-segment panel and the CampaignEditorScreen.
 */

export const AUDIENCE_TYPES = {
  ALL_CONTACTS:       "all_contacts",
  TAGS:               "tags",
  BOOKING_CHANNEL:    "booking_channel",
  BOOKED_CLASS:       "booked_class",
  BOOKED_ANY:         "booked_any",
  HAS_NO_BOOKINGS:    "has_no_bookings",
  CONTACT_SOURCE_IN:  "contact_source_in",
  SAVED_SEGMENT:      "saved_segment",
};

/** Options available to all tiers */
const BASE_OPTIONS = [
  {
    value: AUDIENCE_TYPES.ALL_CONTACTS,
    label: "All mailable contacts",
    help: "Every contact who hasn't unsubscribed.",
  },
  {
    value: AUDIENCE_TYPES.BOOKING_CHANNEL,
    label: "Widget bookers",
    help: "Target contacts who booked through your embedded widget.",
  },
];

/** Additional options for Growth+ (advanced_segmentation) */
const ADVANCED_OPTIONS = [
  {
    value: AUDIENCE_TYPES.BOOKED_CLASS,
    label: "Booked a specific class",
    help: "Target contacts who have at least one booking for a chosen class.",
  },
  {
    value: AUDIENCE_TYPES.BOOKED_ANY,
    label: "Has any booking",
    help: "Contacts with at least one booking (can filter by date range).",
  },
  {
    value: AUDIENCE_TYPES.CONTACT_SOURCE_IN,
    label: "Contact source",
    help: "Filter by how the contact originally entered your system.",
  },
];

/** Option for saved audiences (requires saved_segments_enabled) */
const SAVED_SEGMENT_OPTION = {
  value: AUDIENCE_TYPES.SAVED_SEGMENT,
  label: "Saved audience",
  help: "Use a pre-built audience segment from the Audiences tab.",
};

/** Shown only when resolving labels for older saved data */
const LEGACY_OPTIONS = [
  {
    value: AUDIENCE_TYPES.TAGS,
    label: "Tags (legacy)",
    help: "This rule type is no longer available for new audiences.",
  },
  {
    value: AUDIENCE_TYPES.HAS_NO_BOOKINGS,
    label: "No bookings yet (legacy)",
    help: "This rule type is no longer available for new audiences.",
  },
];

/**
 * Returns the audience type option list for the given tier.
 * @param {object|null} tier - effective marketing tier object
 * @param {{ includeSavedSegment?: boolean }} opts
 */
export function getAudienceOptions(tier, { includeSavedSegment = false } = {}) {
  const advanced = tier?.advanced_segmentation ? ADVANCED_OPTIONS : [];
  const saved = includeSavedSegment && tier?.saved_segments_enabled ? [SAVED_SEGMENT_OPTION] : [];
  return [...BASE_OPTIONS, ...advanced, ...saved];
}

/** Lookup a single option config by value */
export function getAudienceOption(value) {
  return (
    [...BASE_OPTIONS, ...ADVANCED_OPTIONS, SAVED_SEGMENT_OPTION, ...LEGACY_OPTIONS].find(
      (o) => o.value === value,
    ) || null
  );
}

/**
 * Known human-readable source labels. Keys are raw Contact.source strings from the backend.
 * Used to populate the contact_source_in multi-select.
 */
export const KNOWN_SOURCE_LABELS = {
  widget:               "Booking widget",
  platform_booking:     "Marketplace",
  manual:               "Added manually",
  import:               "Imported",
};

/** Map legacy / duplicate API source keys to one canonical value for the picker. */
export const SOURCE_VALUE_ALIASES = {
  widget_booking: "widget",
  member_widget: "widget",
};

export function canonicalSourceValue(raw) {
  return SOURCE_VALUE_ALIASES[raw] || raw;
}

/**
 * Build the select options for the contact source picker,
 * merging known labels with any extra sources returned from the facets API.
 * Aliases (e.g. widget_booking) collapse to a single option.
 */
export function buildSourceOptions(apiSources = []) {
  const seen = new Set();
  const opts = [];
  const add = (raw) => {
    const value = canonicalSourceValue(raw);
    if (seen.has(value)) return;
    seen.add(value);
    opts.push({
      value,
      label: KNOWN_SOURCE_LABELS[value] || value,
    });
  };
  Object.keys(KNOWN_SOURCE_LABELS).forEach(add);
  (apiSources || []).forEach(add);
  opts.sort((a, b) => a.label.localeCompare(b.label));
  return opts;
}
