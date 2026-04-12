/**
 * Ensures help copy and dashboard snippets stay aligned with the embed repo.
 * Run: node --test src/__tests__/widget-docs-accuracy.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, "..", "..");
const widgetRoot =
  process.env.BOOKING_WIDGET_ROOT || join(frontendRoot, "..", "booking-widget-embed");

const helpPath = join(frontendRoot, "src", "components", "common", "_pages", "docs", "helpCenterData.js");
const customizerPath = join(
  frontendRoot,
  "src",
  "app",
  "business",
  "dashboard",
  "_components",
  "tabs",
  "widget",
  "WidgetCustomizer.jsx"
);
const loaderPath = join(widgetRoot, "public", "loader.js");
const embedPath = join(widgetRoot, "src", "embed.jsx");

test("booking-widget-embed repo is reachable (set BOOKING_WIDGET_ROOT if this fails)", () => {
  assert.ok(existsSync(loaderPath), `Missing ${loaderPath}`);
  assert.ok(existsSync(embedPath), `Missing ${embedPath}`);
});

test("loader.js postMessage protocol matches App.jsx expectations", () => {
  const loader = readFileSync(loaderPath, "utf8");
  assert.match(loader, /CE_OPEN_BOOKING/);
  assert.match(loader, /CE_OPEN_MEMBERSHIP/);
  assert.match(loader, /CE_MODAL_OPENED/);
  assert.match(loader, /CE_MODAL_CLOSED/);
  assert.match(loader, /CE_PONG/);
  assert.match(loader, /openClasseasilyBooking/);
  assert.match(loader, /openClasseasilyMembership/);
});

test("embed.jsx exposes ClasseasilyWidget IIFE exports", () => {
  const embed = readFileSync(embedPath, "utf8");
  assert.match(embed, /export function open\b/);
  assert.match(embed, /export function openMembership\b/);
  assert.match(embed, /export \{ init \}/);
});

test("helpCenterData documents ClasseasilyWidget and Wix helpers", () => {
  const help = readFileSync(helpPath, "utf8");
  assert.match(help, /ClasseasilyWidget\.open\(\)/);
  assert.match(help, /openClasseasilyBooking\(\)/);
  assert.match(help, /openClasseasilyMembership/);
});

test("WidgetCustomizer popup snippet uses loader.js and data-api-key", () => {
  const src = readFileSync(customizerPath, "utf8");
  assert.match(src, /replace\(\/\\\/widget\\\.js\$\/i, "\/loader\.js"\)/);
  assert.match(src, /data-api-key=/);
  assert.match(src, /openClasseasilyBooking/);
});

test("WidgetCustomizer inline snippet uses data-widget-api-key", () => {
  const src = readFileSync(customizerPath, "utf8");
  assert.match(src, /data-widget-api-key=/);
});
