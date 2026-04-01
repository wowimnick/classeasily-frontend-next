/**
 * HTML fragment for email footer preview (mirrors backend _footer_html shape).
 */

const HEX_RE = /^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/;

export function sanitizeMarketingHexColor(c) {
  const v = (c || "").trim();
  return HEX_RE.test(v) ? v : "#6366f1";
}

export function sanitizeFooterAlignment(a) {
  const v = String(a || "").trim().toLowerCase();
  if (v === "center" || v === "right") return v;
  return "left";
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {object} opts
 * @param {string} [opts.physical_address_footer]
 * @param {string} [opts.unsubscribe_text]
 * @param {'link'|'button'} [opts.unsubscribe_style]
 * @param {string} [opts.unsubscribe_color]
 * @param {string} [opts.preview_business_name]
 * @param {'left'|'center'|'right'} [opts.footer_alignment]
 */
export function buildMarketingFooterPreviewHtml(opts = {}) {
  const {
    physical_address_footer: footerRaw = "",
    unsubscribe_text = "Unsubscribe",
    unsubscribe_style = "link",
    unsubscribe_color = "#6366f1",
    preview_business_name = "Your business",
    footer_alignment: footerAlignRaw = "left",
  } = opts;

  const align = sanitizeFooterAlignment(footerAlignRaw);
  const color = sanitizeMarketingHexColor(unsubscribe_color);
  const label = escapeHtml((unsubscribe_text || "Unsubscribe").trim().slice(0, 50) || "Unsubscribe");
  const biz = escapeHtml(preview_business_name || "Your business");
  const addr =
    footerRaw.trim() ||
    '<em style="color:#9ca3af">Your business address will appear here.</em>';
  const addrBlock = footerRaw.trim()
    ? `<p style="font-size:12px;color:#6b7280;margin:0;line-height:1.5;">${escapeHtml(footerRaw).replace(
        /\n/g,
        "<br/>",
      )}</p>`
    : `<p style="font-size:12px;color:#d1d5db;margin:0;font-style:italic;line-height:1.5;">${addr}</p>`;

  let unsubEl;
  if (unsubscribe_style === "button") {
    unsubEl = `<a href="#" onclick="return false;" style="display:inline-block;background-color:${color};color:#ffffff;text-decoration:none;padding:9px 18px;border-radius:8px;font-size:12px;font-weight:600;letter-spacing:0.01em;box-shadow:0 1px 2px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.04) inset;">${label}</a>`;
  } else {
    unsubEl = `<a href="#" style="color:${color};text-decoration:underline;text-underline-offset:2px;font-weight:500;" onclick="return false;">${label}</a>`;
  }

  const bodyMock = `
    <div style="padding:14px 16px 12px;background:#ffffff;">
      <div style="height:5px;width:72%;background:linear-gradient(90deg,#e5e7eb,#f3f4f6);border-radius:3px;margin-bottom:10px;opacity:0.9"></div>
      <div style="height:5px;width:100%;background:#f3f4f6;border-radius:3px;margin-bottom:8px"></div>
      <div style="height:5px;width:88%;background:#f3f4f6;border-radius:3px;margin-bottom:8px"></div>
      <div style="height:5px;width:40%;background:#f3f4f6;border-radius:3px"></div>
    </div>
  `;

  return `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      ${bodyMock}
      <div style="padding:14px 16px 16px;background:linear-gradient(180deg,#f9fafb 0%,#f3f4f6 100%);border-top:1px solid #e5e7eb;text-align:${align};">
        <p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;margin:0 0 10px 0;">
          Email footer
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 12px 0;" />
        <p style="font-size:12px;color:#666;line-height:1.55;margin:0 0 10px 0;">
          ${unsubEl}<span style="color:#6b7280;"> from marketing emails from ${biz}.</span>
        </p>
        ${addrBlock}
      </div>
    </div>
  `;
}
