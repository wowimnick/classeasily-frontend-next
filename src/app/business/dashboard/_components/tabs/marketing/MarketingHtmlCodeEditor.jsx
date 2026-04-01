"use client";

import React, { useCallback, useState } from "react";
import { Alert, Button, Input, Space, message } from "antd";
import { checkMarketingHtml, formatMarketingHtml } from "./marketingHtmlTools";

/**
 * HTML body editor (dark monospace) with Prettier formatting and html-validate checks.
 */
export default function MarketingHtmlCodeEditor({ value, onChange, minRows = 18 }) {
  const [formatting, setFormatting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkSummary, setCheckSummary] = useState(null);

  const runFormat = useCallback(async () => {
    setFormatting(true);
    setCheckSummary(null);
    try {
      const next = await formatMarketingHtml(value || "");
      onChange(next);
      message.success("HTML formatted.");
    } catch (e) {
      message.error(e?.message || "Could not format HTML. Fix syntax issues and try again.");
    } finally {
      setFormatting(false);
    }
  }, [value, onChange]);

  const runCheck = useCallback(async () => {
    setChecking(true);
    setCheckSummary(null);
    try {
      const r = await checkMarketingHtml(value || "");
      setCheckSummary(r);
      if (r.ok && r.warningCount === 0) {
        message.success("No issues reported.");
      } else if (r.ok) {
        message.warning(`${r.warningCount} warning(s) — see details below.`);
      } else {
        message.error(`${r.errorCount} error(s) — see details below.`);
      }
    } catch (e) {
      message.error(e?.message || "Validation could not run.");
    } finally {
      setChecking(false);
    }
  }, [value]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
        <Space size="small" wrap>
          <Button size="small" type="link" loading={formatting} onClick={runFormat}>
            Format HTML
          </Button>
          <Button size="small" type="link" loading={checking} onClick={runCheck}>
            Check HTML
          </Button>
        </Space>
      </div>
      <Input.TextArea
        value={value}
        onChange={(e) => {
          setCheckSummary(null);
          onChange(e.target.value);
        }}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        rows={minRows}
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
          fontSize: 13,
          lineHeight: 1.55,
          tabSize: 2,
          background: "#0d1117",
          color: "#e6edf3",
          borderColor: "#30363d",
          resize: "vertical",
        }}
      />
      {checkSummary && checkSummary.items.length > 0 && (
        <Alert
          style={{ marginTop: 10 }}
          type={checkSummary.ok ? "warning" : "error"}
          showIcon
          message={
            checkSummary.ok
              ? `Warnings only (${checkSummary.warningCount})`
              : `Errors: ${checkSummary.errorCount}` +
                (checkSummary.warningCount ? ` · Warnings: ${checkSummary.warningCount}` : "")
          }
          description={
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12, maxHeight: 200, overflow: "auto" }}>
              {checkSummary.items.map((m, i) => (
                <li key={`${m.line}-${m.column}-${m.ruleId}-${i}`}>
                  L{m.line}:{m.column} — <code>{m.ruleId}</code>: {m.message}
                </li>
              ))}
            </ul>
          }
        />
      )}
      {checkSummary && checkSummary.items.length === 0 && !checkSummary.ok && (
        <Alert style={{ marginTop: 10 }} type="error" showIcon message="Validation failed." />
      )}
    </div>
  );
}
