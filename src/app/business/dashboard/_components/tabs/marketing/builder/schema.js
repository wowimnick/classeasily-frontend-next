/**
 * Canonical marketing email builder document (mirrors backend
 * quickstart/services/marketing_builder.py).
 * @typedef {Object} MarketingBuilderBlockBase
 * @property {string} id
 * @property {string} type
 * @property {Record<string, unknown>} [props]
 * @property {MarketingBuilderBlock[][]} [children] — for columns: array of column arrays
 * @property {MarketingBuilderBlock[]} [children] — for section: flat block list
 */

export const MARKETING_BUILDER_SCHEMA_VERSION = 1;

export const BLOCK_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  BUTTON: "button",
  DIVIDER: "divider",
  SPACER: "spacer",
  SECTION: "section",
  COLUMNS: "columns",
  UNSUBSCRIBE: "unsubscribe",
};

/**
 * @returns {import('./schema').MarketingBuilderDocument}
 */
const DEFAULT_INTRO_HTML =
  '<p>Hi {{first_name}},</p><p>Your message here.</p><p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>';

export function createEmptyDocument() {
  return {
    schema_version: MARKETING_BUILDER_SCHEMA_VERSION,
    blocks: [
      createTextBlock({
        props: {
          content: DEFAULT_INTRO_HTML,
        },
      }),
    ],
  };
}

/**
 * @param {object} [unsubDefaults]
 * @param {string} [unsubDefaults.unsubscribe_text]
 * @param {'link'|'button'} [unsubDefaults.unsubscribe_style]
 * @param {string} [unsubDefaults.unsubscribe_color]
 * @param {string} [unsubDefaults.footer_alignment]
 */
export function createUnsubscribeBlock(overrides = {}, unsubDefaults = {}) {
  const style =
    unsubDefaults.unsubscribe_style === "button" ? "button" : "link";
  return {
    id: crypto.randomUUID(),
    type: BLOCK_TYPES.UNSUBSCRIBE,
    props: {
      label: unsubDefaults.unsubscribe_text || "Unsubscribe",
      style,
      color: unsubDefaults.unsubscribe_color || "#6366f1",
      align: unsubDefaults.footer_alignment || "center",
      ...overrides.props,
    },
    ...overrides,
  };
}

export function createTextBlock(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    type: BLOCK_TYPES.TEXT,
    props: {
      content: DEFAULT_INTRO_HTML,
      align: "left",
      fontSize: 16,
      color: "#333333",
      ...overrides.props,
    },
    ...overrides,
  };
}

export function createImageBlock(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    type: BLOCK_TYPES.IMAGE,
    props: {
      src: "",
      alt: "",
      align: "center",
      width: null,
      ...overrides.props,
    },
    ...overrides,
  };
}

export function createButtonBlock(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    type: BLOCK_TYPES.BUTTON,
    props: {
      label: "Book a class",
      href: "https://",
      align: "center",
      backgroundColor: "#111827",
      textColor: "#ffffff",
      ...overrides.props,
    },
    ...overrides,
  };
}

export function createDividerBlock(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    type: BLOCK_TYPES.DIVIDER,
    props: {
      color: "#e5e7eb",
      thickness: 1,
      ...overrides.props,
    },
    ...overrides,
  };
}

export function createSpacerBlock(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    type: BLOCK_TYPES.SPACER,
    props: {
      height: 24,
      ...overrides.props,
    },
    ...overrides,
  };
}

export function createSectionBlock(childBlocks = [], overrides = {}) {
  return {
    ...overrides,
    id: overrides.id ?? crypto.randomUUID(),
    type: BLOCK_TYPES.SECTION,
    props: {
      backgroundColor: "#ffffff",
      paddingY: 24,
      paddingX: 16,
      ...overrides.props,
    },
    children:
      overrides.children ??
      (childBlocks.length ? childBlocks : [createTextBlock()]),
  };
}

export function createColumnsBlock(overrides = {}) {
  return {
    ...overrides,
    id: overrides.id ?? crypto.randomUUID(),
    type: BLOCK_TYPES.COLUMNS,
    props: {
      gap: 16,
      widths: [50, 50],
      ...overrides.props,
    },
    children: overrides.children ?? [[createTextBlock()], [createTextBlock()]],
  };
}

function stripHtml(html) {
  if (typeof html !== "string") return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** True when the doc is a single text block with no meaningful content. */
export function isBuilderDocumentVisuallyEmpty(doc) {
  const blocks = doc?.blocks;
  if (!Array.isArray(blocks) || blocks.length !== 1) return false;
  const b = blocks[0];
  if (!b || b.type !== BLOCK_TYPES.TEXT) return false;
  const content = b.props?.content;
  return stripHtml(content).length === 0;
}
