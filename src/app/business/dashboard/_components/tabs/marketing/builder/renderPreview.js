/**
 * Client-side HTML preview for marketing builder (keep in sync with
 * backend quickstart/services/marketing_builder.py).
 */
function esc(s) {
  if (s == null || s === "") return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderBlock(block) {
  if (!block || typeof block !== "object") return "";
  const type = (block.type || "text").toLowerCase();
  const props = block.props && typeof block.props === "object" ? block.props : {};

  if (type === "text") {
    const align = esc(props.align || "left");
    const fs = props.fontSize ? `font-size:${Number(props.fontSize)}px;` : "";
    const color = props.color ? `color:${esc(props.color)};` : "";
    const inner = typeof props.content === "string" ? props.content : "";
    return `<div class="ce-mk-text" style="text-align:${align};${fs}${color}">${inner}</div>`;
  }
  if (type === "image") {
    const src = props.src;
    if (!src) return "";
    const align = esc(props.align || "center");
    const imgSt = "max-width:100%;height:auto;";
    return `<div style="text-align:${align};"><img src="${esc(src)}" alt="${esc(props.alt || "")}" style="${imgSt}" onerror="this.style.opacity='0.35';this.alt='(image failed to load)';" /></div>`;
  }
  if (type === "button") {
    const align = esc(props.align || "center");
    const bg = esc(props.backgroundColor || "#111827");
    const fg = esc(props.textColor || "#ffffff");
    const label = esc(props.label || "Click");
    const href = esc(props.href || "#");
    return `<div style="text-align:${align};margin:16px 0;"><a href="${href}" style="display:inline-block;padding:12px 24px;background:${bg};color:${fg};text-decoration:none;border-radius:6px;font-weight:600;">${label}</a></div>`;
  }
  if (type === "divider") {
    const color = esc(props.color || "#e5e7eb");
    const t = Number(props.thickness) || 1;
    return `<div style="margin:20px 0;"><hr style="border:none;border-top:${t}px solid ${color};" /></div>`;
  }
  if (type === "spacer") {
    const h = Number(props.height) || 24;
    return `<div style="height:${h}px;line-height:${h}px;">&nbsp;</div>`;
  }
  if (type === "section") {
    const bg = esc(props.backgroundColor || "#ffffff");
    const py = Number(props.paddingY) || 24;
    const px = Number(props.paddingX) || 16;
    const kids = Array.isArray(block.children) ? block.children.map(renderBlock).join("") : "";
    return `<div style="background:${bg};padding:${py}px ${px}px;border-radius:8px;">${kids}</div>`;
  }
  if (type === "columns") {
    const cols = Array.isArray(block.children) ? block.children : [];
    const gap = Number(props.gap) || 16;
    const widths = Array.isArray(props.widths) && props.widths.length === cols.length ? props.widths : cols.map(() => 100 / Math.max(cols.length, 1));
    const cells = cols
      .map((col, i) => {
        const inner = Array.isArray(col) ? col.map(renderBlock).join("") : "";
        const w = widths[i] || 0;
        return `<td style="vertical-align:top;width:${w}%;padding:0 ${gap / 2}px;">${inner}</td>`;
      })
      .join("");
    return `<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;"><tr>${cells}</tr></table>`;
  }
  return "";
}

/**
 * @param {import('./schema.js').MarketingBuilderDocument | Record<string, unknown>} doc
 */
export function renderBuilderPreviewHtml(doc) {
  const blocks = doc && Array.isArray(doc.blocks) ? doc.blocks : [];
  const inner = blocks.map(renderBlock).join("");
  return `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#333;max-width:600px;margin:0 auto;">${inner}</div>`;
}
