/**
 * Marketing HTML: Prettier formatting + html-validate checks (browser bundle).
 */

/** Wrap fragment so validators see a full document. */
export function wrapMarketingHtmlForValidation(fragment) {
  const f = (fragment || "").trim();
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>email</title></head><body>${f}</body></html>`;
}

/**
 * Pretty-print HTML using Prettier (standalone + HTML plugin).
 * @throws {Error} when Prettier cannot parse the input
 */
export async function formatMarketingHtml(html) {
  const trimmed = (html || "").trim();
  if (!trimmed) return "";
  const prettier = await import("prettier/standalone");
  const pluginHtml = await import("prettier/plugins/html");
  const plugins = [pluginHtml.default ?? pluginHtml];
  const out = await prettier.format(trimmed, {
    parser: "html",
    plugins,
    printWidth: 100,
    htmlWhitespaceSensitivity: "ignore",
  });
  return out.trim();
}

/**
 * Run html-validate on wrapped fragment. Email-friendly: inline styles and
 * missing optional attributes are allowed where possible.
 * @returns {{ ok: boolean, errorCount: number, warningCount: number, items: Array<{line:number,column:number,ruleId:string,message:string,severity:number}> }}
 */
export async function checkMarketingHtml(html) {
  if (!(html || "").trim()) {
    return { ok: true, errorCount: 0, warningCount: 0, items: [] };
  }
  const wrapped = wrapMarketingHtmlForValidation(html);
  const { HtmlValidate } = await import("html-validate/browser");
  const htmlvalidate = new HtmlValidate({
    extends: ["html-validate:document"],
    rules: {
      "no-inline-style": "off",
      "element-required-attributes": "off",
      "prefer-native-element": "off",
      "no-trailing-whitespace": "off",
      "no-raw-characters": "off",
      "void-style": "off",
    },
  });
  const report = await htmlvalidate.validateString(wrapped, "marketing-email.html");
  const items = [];
  for (const r of report.results) {
    for (const m of r.messages) {
      items.push({
        line: m.line,
        column: m.column,
        ruleId: m.ruleId,
        message: m.message,
        severity: m.severity,
      });
    }
  }
  const cap = 25;
  return {
    ok: report.errorCount === 0,
    errorCount: report.errorCount,
    warningCount: report.warningCount,
    items: items.slice(0, cap),
  };
}
