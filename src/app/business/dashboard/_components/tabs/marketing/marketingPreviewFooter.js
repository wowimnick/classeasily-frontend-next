/**
 * HTML fragment for email compliance footer preview (physical address only).
 * Unsubscribe lives in the message body via {{unsubscribe_url}}.
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
 * Minimal compliance footer: physical address only (CAN-SPAM).
 * @param {object} opts
 * @param {string} [opts.physical_address_footer]
 * @param {'left'|'center'|'right'} [opts.footer_alignment]
 */
export function buildMarketingFooterPreviewHtml(opts = {}) {
  const {
    physical_address_footer: footerRaw = "",
    footer_alignment: footerAlignRaw = "left",
  } = opts;

  const align = sanitizeFooterAlignment(footerAlignRaw);
  const addr =
    footerRaw.trim() ||
    '<em style="color:#9ca3af">Your business address will appear here.</em>';
  const addrBlock = footerRaw.trim()
    ? `<p style="font-size:12px;color:#6b7280;margin:0;line-height:1.5;">${escapeHtml(footerRaw).replace(
        /\n/g,
        "<br/>",
      )}</p>`
    : `<p style="font-size:12px;color:#d1d5db;margin:0;font-style:italic;line-height:1.5;">${addr}</p>`;

  return `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="padding:14px 16px 16px;background:linear-gradient(180deg,#f9fafb 0%,#f3f4f6 100%);border-top:1px solid #e5e7eb;text-align:${align};">
        <p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;margin:0 0 10px 0;">
          Mailing address
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 12px 0;" />
        ${addrBlock}
      </div>
    </div>
  `;
}
