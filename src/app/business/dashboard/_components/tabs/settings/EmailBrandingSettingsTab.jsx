"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { Input, Button, Upload } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { businessService, uploadService } from "@/services/apiService";
import message from "@/lib/message";
import {
  EDITOR_MODE_HTML,
  EDITOR_MODE_VISUAL,
  PREVIEW_TYPE_TO_EMAIL_KEY,
  PLACEHOLDER_GROUPS,
  applySamplePlaceholders,
  checkMarketingHtml,
  checkRequiredPlaceholdersForType,
  formatMarketingHtml,
  starterHtmlTemplate,
} from "./emailBrandingHtmlTools";

/* ─── Constants ─────────────────────────────────────────────────────────────── */

const DEFAULT_BRANDING = {
  logo_url: "",
  primary_color: "",
  footer_text: "",
  confirmation_message: "",
  card_border_width: "",
  card_border_radius: "",
  logo_max_width: "",
  logo_max_height: "",
  mode: "builder",
  custom_html: {},
  button_text: "",
  button_text_guest: "",
  button_style: "pill",
  font_family: "",
  background_color: "",
  visible_sections: {
    cancellation_policy: true,
    contact_info: true,
    equipment: true,
    participants: true,
  },
};

const PREVIEW_OPTIONS = [
  { value: "booking_confirmation",          label: "Booking confirmation",    icon: "🎉" },
  { value: "booking_reminder",              label: "Booking reminder",        icon: "⏰" },
  { value: "booking_cancelled_by_host",     label: "Cancelled by host",       icon: "📣" },
  { value: "booking_rescheduled",           label: "Rescheduled",             icon: "🗓️" },
  { value: "booking_cancellation_confirmed",label: "Guest cancellation",      icon: "🗓️" },
];

const LOGO_SIZE_PRESETS = [
  { value: "small",  label: "Small",  width: 120, height: 45, desc: "120 × 45 px" },
  { value: "medium", label: "Medium", width: 160, height: 60, desc: "160 × 60 px" },
  { value: "large",  label: "Large",  width: 200, height: 75, desc: "200 × 75 px" },
];

const CARD_STYLE_PRESETS = [
  { value: "rounded", label: "Rounded",   border: 1, radius: 16, preview: "16px" },
  { value: "soft",    label: "Soft",      border: 1, radius: 24, preview: "24px" },
  { value: "sharp",   label: "Sharp",     border: 1, radius: 0,  preview: "0px"  },
  { value: "minimal", label: "Minimal",   border: 0, radius: 12, preview: "12px", noLine: true },
];

const BUTTON_STYLE_PRESETS = [
  { value: "pill", label: "Pill" },
  { value: "rounded_rect", label: "Rounded" },
  { value: "square", label: "Square" },
];

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function logoSizeToPreset(w, h) {
  const W = Number(w), H = Number(h);
  return LOGO_SIZE_PRESETS.find((x) => x.width === W && x.height === H)?.value ?? "medium";
}

function cardStyleToPreset(border, radius) {
  const b = Number(border), r = Number(radius);
  return CARD_STYLE_PRESETS.find((x) => x.border === b && x.radius === r)?.value ?? "rounded";
}

function normalizeHex(val) {
  if (val == null || typeof val !== "string") return null;
  const s = val.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    return "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
  }
  const m = s.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (m) {
    const hex = (n) => Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, "0");
    return "#" + hex(m[1]) + hex(m[2]) + hex(m[3]);
  }
  return null;
}

function esc(s) {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function parseNum(val, defaultVal) {
  if (val == null || val === "") return defaultVal;
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : defaultVal;
}

/* ─── Email preview HTML builder ─────────────────────────────────────────────── */

function buildEmailPreviewHtml(branding, previewType) {
  const logoUrl = (branding?.logo_url || "").trim();
  const primaryColor = normalizeHex(branding?.primary_color) || "#f81e3e";
  const footerText = (branding?.footer_text || "").trim();
  const confirmationMessage = (branding?.confirmation_message || "").trim();
  const cardBorderWidth = parseNum(branding?.card_border_width, 1);
  const cardBorderRadius = parseNum(branding?.card_border_radius, 16);
  const logoMaxWidth = parseNum(branding?.logo_max_width, 160);
  const logoMaxHeight = parseNum(branding?.logo_max_height, 60);
  const bg = normalizeHex(branding?.background_color) || "#F5F5F7";
  const ff =
    branding?.font_family === "arial"
      ? "Arial,Helvetica,sans-serif"
      : branding?.font_family === "georgia"
        ? "Georgia,'Times New Roman',serif"
        : branding?.font_family === "trebuchet"
          ? "'Trebuchet MS',Helvetica,sans-serif"
          : branding?.font_family === "verdana"
            ? "Verdana,Geneva,sans-serif"
            : "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
  const br =
    branding?.button_style === "rounded_rect"
      ? "12px"
      : branding?.button_style === "square"
        ? "4px"
        : "980px";
  const btnLabel =
    esc((branding?.button_text || "").trim()) || "View Ticket &amp; Details";
  const vs = branding?.visible_sections || {};
  const showPart = (k) => vs[k] !== false;

  const headerLogoRow = logoUrl
    ? `<tr><td align="center" style="padding-bottom: 32px;"><img src="${logoUrl.replace(/"/g, "&quot;")}" alt="" style="max-width: ${logoMaxWidth}px; max-height: ${logoMaxHeight}px; width: auto; height: auto; display: block; object-fit: contain;" /></td></tr>`
    : "";

  let content = "";
  switch (previewType) {
    case "booking_confirmation":
      content = `<div style="text-align:center;font-family:${ff};">
        <div style="font-size:48px;margin-bottom:16px;line-height:1;">🎉</div>
        <h1 style="margin-bottom:8px;font-size:28px;color:#1D1D1F;font-weight:700;">Get ready for something great.</h1>
        <p style="font-size:16px;color:#484848;margin-bottom:${confirmationMessage?"8":"24"}px;">Hi Alex, your spot is secured for <strong>Morning Yoga Flow</strong>.</p>
        ${confirmationMessage?`<p style="font-size:14px;color:#484848;margin-bottom:24px;">${esc(confirmationMessage)}</p>`:""}
        <div style="background:#fff;border:${cardBorderWidth}px solid #E5E7EB;border-radius:${cardBorderRadius}px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);margin-bottom:24px;max-width:480px;margin-left:auto;margin-right:auto;">
          <div style="background:#F5F5F7;padding:20px 24px;border-bottom:1px solid #E5E7EB;">
            <div style="font-size:11px;color:#86868B;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Date &amp; time</div>
            <div style="font-size:22px;font-weight:700;color:#1D1D1F;">Monday, March 10</div>
            <div style="font-size:16px;color:${primaryColor};font-weight:600;margin-top:4px;">9:00 AM – 10:00 AM</div>
            <div style="font-size:12px;color:#6B7280;margin-top:2px;">60 min</div>
          </div>
          <div style="padding:20px 24px;text-align:left;">
            <div style="display:table;width:100%;border-collapse:collapse;">
              <div style="display:table-row;"><div style="display:table-cell;font-size:11px;color:#86868B;text-transform:uppercase;padding:6px 12px 6px 0;white-space:nowrap;">Location</div><div style="display:table-cell;font-size:14px;color:#1D1D1F;">123 Studio Lane</div></div>
              <div style="display:table-row;"><div style="display:table-cell;font-size:11px;color:#86868B;text-transform:uppercase;padding:6px 12px 6px 0;">Provider</div><div style="display:table-cell;font-size:14px;color:#1D1D1F;">Your Business Name</div></div>
              <div style="display:table-row;"><div style="display:table-cell;font-size:11px;color:#86868B;text-transform:uppercase;padding:6px 12px 6px 0;">Reference</div><div style="display:table-cell;font-size:14px;font-family:monospace;color:#1D1D1F;">BK-ABC123</div></div>
              ${showPart("contact_info")?`<div style="display:table-row;"><div style="display:table-cell;font-size:11px;color:#86868B;text-transform:uppercase;padding:6px 12px 6px 0;">Contact</div><div style="display:table-cell;font-size:14px;color:#1D1D1F;">hello@studio.com · (555) 010-0000</div></div>`:""}
              ${showPart("equipment")?`<div style="display:table-row;"><div style="display:table-cell;font-size:11px;color:#86868B;text-transform:uppercase;padding:6px 12px 6px 0;vertical-align:top;">Note from host</div><div style="display:table-cell;font-size:14px;color:#1D1D1F;">Bring a mat.</div></div>`:""}
            </div>
            ${showPart("participants")?`<div style="margin-top:16px;padding-top:16px;border-top:1px dashed #E5E7EB;"><span style="display:inline-block;background:#F5F5F7;border-radius:99px;padding:4px 10px;font-size:13px;color:#1D1D1F;">Booked by Alex Guest</span> <span style="display:inline-block;background:#F5F5F7;border-radius:99px;padding:4px 10px;font-size:13px;color:#1D1D1F;">2 participants</span></div>`:""}
          </div>
        </div>
        ${showPart("cancellation_policy")?`<div style="margin-bottom:24px;padding:12px 16px;background:#F9FAFB;border-radius:12px;border:1px solid #E5E7EB;text-align:left;max-width:480px;margin-left:auto;margin-right:auto;"><div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;font-weight:600;">Cancellation policy</div><div style="font-size:13px;color:#374151;line-height:1.45;">Cancel up to 24 hours before for a full refund.</div></div>`:""}
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
          <a href="#" style="background-color:${primaryColor};color:#fff;border-radius:${br};padding:16px 36px;display:inline-block;font-weight:600;font-size:16px;text-decoration:none;">${btnLabel}</a>
        </td></tr></table>
      </div>`;
      break;
    case "booking_reminder":
      content = `<div style="text-align:center;font-family:${ff};">
        <div style="font-size:48px;margin-bottom:16px;line-height:1;">⏰</div>
        <h1 style="margin-bottom:8px;font-size:28px;color:#1D1D1F;">Your class is coming up</h1>
        <p style="font-size:16px;color:#484848;margin-bottom:${confirmationMessage?"8":"24"}px;">Hi Alex, <strong>Morning Yoga Flow</strong> is coming up.</p>
        ${confirmationMessage?`<p style="font-size:14px;color:#484848;margin-bottom:24px;">${esc(confirmationMessage)}</p>`:""}
        <div style="background:#F9FAFB;border:${cardBorderWidth}px solid #E5E7EB;border-radius:${cardBorderRadius}px;overflow:hidden;margin-bottom:24px;max-width:480px;margin-left:auto;margin-right:auto;">
          <div style="padding:20px 24px;border-bottom:1px solid #E5E7EB;">
            <div style="font-size:11px;color:#86868B;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Date &amp; time</div>
            <div style="font-size:20px;font-weight:700;color:#1D1D1F;">Monday, March 10</div>
            <div style="font-size:15px;color:${primaryColor};">9:00 AM – 10:00 AM</div>
          </div>
          <div style="padding:16px 24px;background:#fff;text-align:left;">
            <div style="font-size:11px;color:#86868B;text-transform:uppercase;margin-bottom:4px;">Location</div>
            <div style="font-size:14px;color:#1D1D1F;">123 Studio Lane</div>
          </div>
        </div>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
          <a href="#" style="background-color:${primaryColor};color:#fff;border-radius:${br};padding:16px 36px;display:inline-block;font-weight:600;font-size:16px;text-decoration:none;">${btnLabel}</a>
        </td></tr></table>
      </div>`;
      break;
    case "booking_cancelled_by_host":
      content = `<div style="text-align:center;font-family:${ff};">
        <div style="font-size:48px;margin-bottom:24px;line-height:1;">📣</div>
        <h1 style="margin-bottom:8px;font-size:28px;color:#1D1D1F;">We have an update.</h1>
        <p style="font-size:18px;color:#1D1D1F;margin-bottom:32px;">Hi Alex,<br>Your booking for <strong>Morning Yoga Flow</strong> has been cancelled by the host.</p>
        <div style="background:#F9FAFB;border:${cardBorderWidth}px solid #E5E7EB;border-radius:${cardBorderRadius}px;padding:24px;text-align:left;margin-bottom:24px;max-width:480px;margin-left:auto;margin-right:auto;">
          <div style="margin-bottom:16px;"><div style="font-size:14px;color:#86868B;">Reason</div><div style="font-size:16px;color:#1D1D1F;">Host unavailable</div></div>
          <div style="background:#fff;border:1px solid #D1D5DB;border-radius:12px;padding:12px;">
            <span style="font-size:20px;margin-right:12px;">💸</span>
            <div style="display:inline-block;vertical-align:top;"><div style="font-size:13px;color:#86868B;text-transform:uppercase;letter-spacing:.05em;">Refund Issued</div><div style="font-size:16px;font-weight:600;color:#1D1D1F;">$29.00 to your original payment method.</div></div>
          </div>
        </div>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
          <a href="#" style="background-color:${primaryColor};color:#fff;border-radius:${br};padding:16px 36px;display:inline-block;font-weight:600;font-size:16px;text-decoration:none;">Find another class</a>
        </td></tr></table>
      </div>`;
      break;
    case "booking_rescheduled":
      content = `<div style="text-align:center;font-family:${ff};">
        <div style="font-size:48px;margin-bottom:24px;line-height:1;">🗓️</div>
        <h1 style="margin-bottom:8px;font-size:28px;color:#1D1D1F;">New time, same great experience.</h1>
        <p style="font-size:18px;color:#1D1D1F;margin-bottom:32px;">Hi Alex,<br>The host has rescheduled <strong>Morning Yoga Flow</strong>.</p>
        <div style="background:#fff;border:${cardBorderWidth}px solid #E5E7EB;border-radius:${cardBorderRadius}px;overflow:hidden;margin-bottom:32px;max-width:480px;margin-left:auto;margin-right:auto;">
          <div style="padding:16px;background:#F9FAFB;border-bottom:1px solid #E5E7EB;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#86868B;font-weight:700;margin-bottom:4px;">Previous Time</div>
            <div style="font-size:16px;text-decoration:line-through;color:#9CA3AF;">Monday, March 10 at 9:00 AM</div>
          </div>
          <div style="padding:24px;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:${primaryColor};font-weight:700;margin-bottom:8px;">New Time</div>
            <div style="font-size:20px;font-weight:700;color:#1D1D1F;">Wednesday, March 12</div>
            <div style="font-size:18px;font-weight:500;color:#1D1D1F;">10:00 AM</div>
          </div>
        </div>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
          <a href="#" style="background-color:${primaryColor};color:#fff;border-radius:${br};padding:16px 36px;display:inline-block;font-weight:600;font-size:16px;text-decoration:none;">${btnLabel}</a>
        </td></tr></table>
      </div>`;
      break;
    case "booking_cancellation_confirmed":
      content = `<div style="text-align:center;font-family:${ff};">
        <div style="font-size:48px;margin-bottom:24px;line-height:1;">🗓️</div>
        <h1 style="margin-bottom:8px;font-size:28px;color:#1D1D1F;">Your schedule is clear.</h1>
        <p style="font-size:18px;color:#1D1D1F;margin-bottom:32px;">Hi Alex,<br>We've processed your cancellation for <strong>Morning Yoga Flow</strong>.</p>
        <div style="background:#F9FAFB;border:${cardBorderWidth}px solid #E5E7EB;border-radius:${cardBorderRadius}px;padding:24px;text-align:left;margin-bottom:32px;max-width:480px;margin-left:auto;margin-right:auto;">
          <h2 style="font-size:11px;text-transform:uppercase;color:#86868B;letter-spacing:.05em;margin-bottom:16px;margin-top:0;">Cancellation Summary</h2>
          <div style="margin-bottom:12px;"><div style="font-size:14px;color:#86868B;">Experience</div><div style="font-size:16px;font-weight:600;color:#1D1D1F;">Morning Yoga Flow</div></div>
          <div style="border-top:1px dashed #D1D5DB;padding-top:12px;margin-top:16px;"><div style="font-size:14px;color:#86868B;">Refund Status</div><div style="font-size:16px;color:#1D1D1F;">Processed per the host's policy.</div></div>
        </div>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
          <a href="#" style="background-color:${primaryColor};color:#fff;border-radius:${br};padding:16px 36px;display:inline-block;font-weight:600;font-size:16px;text-decoration:none;">Browse classes</a>
        </td></tr></table>
      </div>`;
      break;
    default:
      content = `<div style="text-align:center;padding:24px;">Select a preview type.</div>`;
  }

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;border-collapse:collapse;background:${bg};font-family:${ff};">
    ${headerLogoRow}
    <tr><td style="background:#fff;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.04);overflow:hidden;"><div style="padding:32px 24px;box-sizing:border-box;">${content}</div></td></tr>
    <tr><td style="padding:24px 20px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      ${footerText?`<p style="font-size:11px;color:#86868B;margin-bottom:8px;">${esc(footerText)}</p>`:""}
      <p style="font-size:11px;color:#86868B;margin:0;">© ClassEasily. All rights reserved.</p>
    </td></tr>
  </table>`.trim();
}

function buildHtmlModePreviewHtml(branding, previewType, customHtmlByType) {
  const key = PREVIEW_TYPE_TO_EMAIL_KEY[previewType];
  const raw = (customHtmlByType && customHtmlByType[key]) || "";
  const inner = applySamplePlaceholders(raw);
  const bg = normalizeHex(branding?.background_color) || "#F5F5F7";
  if (!inner.trim()) {
    return `<div style="padding:40px;text-align:center;color:#98A2B3;font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:${bg};border-radius:12px;">No HTML for this email yet. Switch to the template above, use “Starter template”, or paste your own.</div>`;
  }
  return `<div style="background:${bg};padding:24px;max-width:600px;margin:0 auto;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${inner}</div>`;
}

/* ─── Animations ─────────────────────────────────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

/* ─── Styled Components ──────────────────────────────────────────────────────── */

const Root = styled.div`
  display: grid;
  grid-template-columns: 420px 1fr;
  min-height: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
`;

/* ── Left panel ── */
const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  border-right: 1px solid #EAECF0;
  background: #FFFFFF;
  overflow: hidden;

  @media (max-width: 1200px) {
    border-right: none;
    border-bottom: 1px solid #EAECF0;
    display: flex; /* Always show settings on mobile; no tab switch */
  }
`;

const PanelHeader = styled.div`
  padding: 28px 28px 24px;
  border-bottom: 1px solid #F2F4F7;
`;

const PanelTitle = styled.h2`
  font-size: 15px;
  font-weight: 700;
  color: #101828;
  letter-spacing: -0.02em;
  margin: 0 0 4px;
`;

const PanelSub = styled.p`
  font-size: 12.5px;
  color: #667085;
  margin: 0;
  line-height: 1.55;
`;

const ModeToggleWrap = styled.div`
  padding: 28px 20px;
  border-bottom: 1px solid #F2F4F7;
`;

const ModeToggleLabel = styled.div`
  font-size: 10.5px;
  font-weight: 700;
  color: #98A2B3;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 10px;
`;

const ModeToggleGroup = styled.div`
  display: flex;
  gap: 0;
  border-radius: 10px;
  border: 1.5px solid #E4E7EC;
  background: #F9FAFB;
  padding: 3px;
`;

const ModeToggleBtn = styled.button`
  flex: 1;
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => p.$active ? "#101828" : "#667085"};
  background: ${(p) => p.$active ? "#fff" : "transparent"};
  box-shadow: ${(p) => p.$active ? "0 1px 3px rgba(0,0,0,0.06)" : "none"};
  cursor: pointer;
  transition: color 0.15s, background 0.15s, box-shadow 0.15s;
  font-family: inherit;

  &:hover {
    color: #101828;
  }
`;

const FieldsWrap = styled.div`
  padding: 0;
  flex: 1;
  overflow-y: auto;
`;

const Section = styled.div`
  padding: 22px 28px;
  border-bottom: 1px solid #F2F4F7;
  animation: ${fadeIn} 0.3s ease both;
  animation-delay: ${(p) => p.$delay ?? "0s"};

  &:last-of-type {
    border-bottom: none;
  }

  @media (max-width: 480px) {
    padding: 18px 16px;
  }
`;

const SectionLabel = styled.div`
  font-size: 10.5px;
  font-weight: 700;
  color: #98A2B3;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 14px;
`;

const FieldLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #344054;
  display: block;
  margin-bottom: 6px;
`;

const FieldHint = styled.p`
  font-size: 11.5px;
  color: #98A2B3;
  margin: 6px 0 0;
  line-height: 1.5;
`;

/* ── Logo zone ── */
const LogoPreviewCard = styled.div`
  border: 1px solid #EAECF0;
  border-radius: 14px;
  padding: 16px;
  background: #FAFAFA;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;

  .logo-img-wrap {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border-radius: 10px;
    border: 1px solid #EAECF0;
    overflow: hidden;
    flex-shrink: 0;
  }
  .logo-img-wrap img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
  }
`;

const LogoActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 100px;
`;

const UploadZone = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 16px;
  border: 1.5px dashed #D0D5DD;
  border-radius: 14px;
  background: #FAFAFA;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;

  &:hover {
    border-color: #667085;
    background: #F5F7FA;
    box-shadow: 0 0 0 3px rgba(102,112,133,0.06);
  }

  input[type="file"] { display: none; }
`;

const UploadIconWrap = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #EAECF0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(16,24,40,0.06);
  font-size: 16px;
  color: #667085;
`;

const UploadZoneText = styled.div`
  text-align: center;
  .primary { font-size: 13px; font-weight: 600; color: #344054; }
  .secondary { font-size: 11px; color: #98A2B3; margin-top: 2px; }
`;

/* ── Visual preset grid ── */
const PresetGrid = styled.div`
  display: grid;
  grid-template-columns: ${(p) => p.$cols ? `repeat(${p.$cols}, 1fr)` : "repeat(3, 1fr)"};
  gap: 8px;

  @media (max-width: 480px) {
    grid-template-columns: ${(p) =>
      p.$cols === 4 ? "repeat(2, 1fr)" :
      p.$cols === 3 ? "repeat(3, 1fr)" :
      "repeat(2, 1fr)"};
  }
`;

const PresetCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 10px;
  border-radius: 12px;
  border: 1.5px solid ${(p) => p.$active ? "#101828" : "#E4E7EC"};
  background: ${(p) => p.$active ? "#F9FAFB" : "#FFFFFF"};
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  font-family: inherit;

  &:hover {
    border-color: ${(p) => p.$active ? "#101828" : "#98A2B3"};
    background: #F9FAFB;
  }

  ${(p) => p.$active && css`
    box-shadow: 0 0 0 3px rgba(16,24,40,0.08);
  `}

  @media (max-width: 480px) {
    padding: 10px 6px;
    gap: 6px;
  }
`;

const PresetCardLabel = styled.div`
  font-size: 11.5px;
  font-weight: ${(p) => p.$active ? "700" : "500"};
  color: ${(p) => p.$active ? "#101828" : "#667085"};
  white-space: nowrap;
`;

const PresetCardDesc = styled.div`
  font-size: 10px;
  color: #98A2B3;
  margin-top: -4px;
`;

/* Size preset visual */
const SizePreviewBox = styled.div`
  width: 64px;
  height: 32px;
  border-radius: 6px;
  background: #F2F4F7;
  border: 1px solid #E4E7EC;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const SizePreviewBar = styled.div`
  border-radius: 3px;
  background: linear-gradient(90deg, #D0D5DD 0%, #98A2B3 100%);
  width: ${(p) => p.$w}px;
  height: ${(p) => p.$h}px;
`;

/* Card style visual */
const CardPreviewBox = styled.div`
  width: 64px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardPreviewRect = styled.div`
  width: 52px;
  height: 28px;
  background: #F2F4F7;
  border-radius: ${(p) => p.$radius};
  border: ${(p) => p.$noBorder ? "none" : "1.5px solid #D0D5DD"};
`;

/* ── Color row ── */
const ColorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ColorSwatchBtn = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: ${(p) => p.$color};
  border: 1.5px solid rgba(0,0,0,0.12);
  flex-shrink: 0;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2), 0 1px 3px rgba(0,0,0,0.08);
  transition: transform 0.12s, box-shadow 0.12s;
  position: relative;
  overflow: hidden;

  input[type="color"] {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    border: none;
    padding: 0;
  }

  &:hover {
    transform: scale(1.06);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2), 0 3px 8px rgba(0,0,0,0.14);
  }
`;

const ColorHexInput = styled.input`
  flex: 1;
  height: 44px;
  border: 1.5px solid #E4E7EC;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: #344054;
  font-family: 'SF Mono', 'Fira Code', monospace;
  background: #FAFAFA;
  letter-spacing: 0.02em;
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;

  &:focus {
    border-color: #344054;
    box-shadow: 0 0 0 3px rgba(52,64,84,0.08);
    background: #fff;
  }

  &::placeholder { color: #C0C9D8; font-weight: 400; }
`;

/* ── Character count textarea wrapper ── */
const TextAreaWrap = styled.div`
  position: relative;

  .ant-input {
    font-size: 13.5px;
    line-height: 1.6;
    border-radius: 10px;
    border-color: #E4E7EC;
    resize: none;
    padding: 10px 14px;
    padding-bottom: 24px;
    color: #344054;
    background: #FAFAFA;
    transition: border-color 0.15s, box-shadow 0.15s;

    &:focus, &:focus-within {
      border-color: #344054;
      box-shadow: 0 0 0 3px rgba(52,64,84,0.08);
      background: #fff;
    }

    &::placeholder { color: #C0C9D8; }
  }

  .ant-input-data-count {
    position: absolute;
    right: 10px;
    bottom: 7px;
    font-size: 10.5px;
    color: #C0C9D8;
    pointer-events: none;
  }
`;

/* ── Save bar ── */
const SaveBar = styled.div`
  padding: 16px 28px;
  border-top: 1px solid #F2F4F7;
  background: #FAFAFA;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
`;

const SaveHint = styled.div`
  font-size: 11.5px;
  color: #98A2B3;
  display: flex;
  align-items: center;
  gap: 5px;

  &::before {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #98A2B3;
    flex-shrink: 0;
  }
`;

const SaveBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 20px;
  background: #101828;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: ${(p) => p.disabled ? "not-allowed" : "pointer"};
  opacity: ${(p) => p.disabled ? 0.65 : 1};
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
  font-family: inherit;
  letter-spacing: -0.01em;

  &:hover:not(:disabled) {
    background: #1D2939;
    box-shadow: 0 4px 12px rgba(16,24,40,0.2);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

const RemoveLogoBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  width: fit-content;
  padding: 6px 12px;
  background: transparent;
  color: #F04438;
  border: 1.5px solid #FEE4E2;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  font-family: inherit;

  &:hover {
    background: #FEF3F2;
    border-color: #FDA29B;
  }
`;

const ReplaceLogoBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: transparent;
  color: #344054;
  border: 1.5px solid #E4E7EC;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  font-family: inherit;

  &:hover { background: #F2F4F7; }
`;

/* ── Right panel (preview) ── */
const RightPanel = styled.div`
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  background: #F2F4F7;
  min-height: 400px;
  align-self: start;
  max-height: 100vh;

  @media (max-width: 1200px) {
    display: none; /* Preview hidden on mobile */
    position: static;
    max-height: none;
    min-height: 0;
  }
`;

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #fff;
  border-bottom: 1px solid #EAECF0;
  gap: 12px;
  flex-shrink: 0;
  flex-wrap: wrap;

  @media (max-width: 1280px) {
    padding: 10px 12px;
    gap: 8px;
  }
`;

const PreviewBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  font-weight: 700;
  color: #344054;

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #17B26A;
    box-shadow: 0 0 0 2.5px #DCFAE6;
    flex-shrink: 0;
  }
`;

const PreviewTypeTabs = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  background: #F2F4F7;
  border-radius: 10px;
  padding: 3px;
  flex-shrink: 0;
  overflow-x: auto;
`;

const PreviewTab = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 7px;
  border: none;
  background: ${(p) => p.$active ? "#fff" : "transparent"};
  color: ${(p) => p.$active ? "#101828" : "#667085"};
  font-size: 12px;
  font-weight: ${(p) => p.$active ? "600" : "400"};
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
  font-family: inherit;
  box-shadow: ${(p) => p.$active ? "0 1px 3px rgba(16,24,40,0.08)" : "none"};

  &:hover:not([data-active]) { color: #344054; }

  .tab-icon { font-size: 13px; }
`;

const PreviewBodyWrap = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 32px 24px;
  background: #F2F4F7;

  @media (max-width: 1200px) {
    padding: 20px 12px;
  }

  .email-preview-root {
    min-width: 0;
    width: 100%;
    max-width: 560px;
    overflow-x: hidden;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1d1d1f;
    -webkit-font-smoothing: antialiased;
    box-sizing: border-box;
    word-wrap: break-word;
    overflow-wrap: break-word;
    animation: ${fadeIn} 0.25s ease;
    /* Scale handled by ScaledPreviewWrap JS wrapper */
    transform-origin: top left;
  }

  .email-preview-root table { max-width: 100% !important; }
  .email-preview-root img   { max-width: 100% !important; height: auto !important; object-fit: contain; }
  .email-preview-root a     { pointer-events: none; cursor: default; }
`;

const ScaledPreviewWrap = styled.div`
  width: 100%;
  overflow: visible;
`;

const HtmlLintPanel = styled.div`
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$hasErrors ? "#FDA29B" : "#E4E7EC")};
  background: ${(p) => (p.$hasErrors ? "#FEF3F2" : "#F9FAFB")};
  max-height: 220px;
  overflow: auto;
  font-size: 11px;
  line-height: 1.45;
`;

/* Mobile floating preview button — kept for backward compat but hidden */
const MobilePreviewBtn = styled.button`
  display: none;
`;

const FullScreenOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  background: #F2F4F7;
  display: flex;
  flex-direction: column;

  @media (min-width: 961px) { display: none; }
`;

const FullScreenHeader = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #EAECF0;
`;

const FullScreenClose = styled.button`
  padding: 8px 16px;
  background: #101828;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
`;

/* Loading skeleton */
const SkeletonPulse = styled.div`
  background: linear-gradient(90deg, #F2F4F7 25%, #E4E7EC 50%, #F2F4F7 75%);
  background-size: 400px 100%;
  animation: ${shimmer} 1.4s infinite linear;
  border-radius: 8px;
`;

/* ─── Main Component ─────────────────────────────────────────────────────────── */

const DEBOUNCE_MS = 350;

const EMAIL_MODE_MARKETPLACE = "marketplace";
const EMAIL_MODE_WIDGET = "widget";

function applyBrandingToForm(data, setters) {
  const d = { ...DEFAULT_BRANDING, ...(data || {}) };
  const mergedVs = { ...DEFAULT_BRANDING.visible_sections, ...(d.visible_sections || {}) };
  const d2 = { ...d, visible_sections: mergedVs };
  setters.setBranding(d2);
  setters.setDraftFooterText(d.footer_text ?? "");
  setters.setDraftConfirmMsg(d.confirmation_message ?? "");
  setters.setDraftPrimaryColor(d.primary_color ?? "");
  setters.setColorInputValue(normalizeHex(d.primary_color) || "#f81e3e");
  setters.setDraftLogoSize(logoSizeToPreset(d.logo_max_width, d.logo_max_height));
  setters.setDraftCardStyle(cardStyleToPreset(d.card_border_width, d.card_border_radius));
  setters.setEditorMode(d.mode === "html" ? EDITOR_MODE_HTML : EDITOR_MODE_VISUAL);
  const ch = typeof d.custom_html === "object" && d.custom_html ? d.custom_html : {};
  setters.setCustomHtmlByType({ ...ch });
}

function formToBrandingPayload(
  branding,
  draftFooterText,
  draftConfirmMessage,
  draftPrimaryColor,
  draftLogoSize,
  draftCardStyle,
  editorMode,
  customHtmlByType,
) {
  const logoPreset = LOGO_SIZE_PRESETS.find((p) => p.value === draftLogoSize) || LOGO_SIZE_PRESETS[1];
  const cardPreset = CARD_STYLE_PRESETS.find((p) => p.value === draftCardStyle) || CARD_STYLE_PRESETS[0];
  const bgHex = normalizeHex(branding.background_color);
  return {
    logo_url: (branding.logo_url || "").trim() || undefined,
    primary_color: (draftPrimaryColor || branding.primary_color || "").trim() || undefined,
    footer_text: (draftFooterText || "").trim() || undefined,
    confirmation_message: (draftConfirmMessage || "").trim() || undefined,
    card_border_width: cardPreset.border,
    card_border_radius: cardPreset.radius,
    logo_max_width: logoPreset.width,
    logo_max_height: logoPreset.height,
    mode: editorMode === EDITOR_MODE_HTML ? "html" : "builder",
    custom_html: editorMode === EDITOR_MODE_HTML ? { ...customHtmlByType } : {},
    button_text: (branding.button_text || "").trim() || undefined,
    button_text_guest: (branding.button_text_guest || "").trim() || undefined,
    button_style: branding.button_style || "pill",
    font_family: (branding.font_family || "").trim() || undefined,
    background_color: bgHex || undefined,
    visible_sections: {
      ...DEFAULT_BRANDING.visible_sections,
      ...(branding.visible_sections || {}),
    },
  };
}

export default function EmailBrandingSettingsTab() {
  const [loading, setLoading]                     = useState(true);
  const [saving, setSaving]                       = useState(false);
  const [logoUploading, setLogoUploading]         = useState(false);
  const [emailMode, setEmailMode]                 = useState(EMAIL_MODE_MARKETPLACE);
  const [brandingByMode, setBrandingByMode]       = useState({ [EMAIL_MODE_MARKETPLACE]: { ...DEFAULT_BRANDING }, [EMAIL_MODE_WIDGET]: { ...DEFAULT_BRANDING } });
  const [canUseWidgetBranding, setCanUseWidgetBranding] = useState(false);
  const [branding, setBranding]                   = useState({ ...DEFAULT_BRANDING });
  const [draftFooterText, setDraftFooterText]     = useState("");
  const [draftConfirmMessage, setDraftConfirmMsg] = useState("");
  const [draftPrimaryColor, setDraftPrimaryColor] = useState("");
  const [draftLogoSize, setDraftLogoSize]         = useState("medium");
  const [draftCardStyle, setDraftCardStyle]       = useState("rounded");
  const [previewType, setPreviewType]             = useState("booking_confirmation");
  const [editorMode, setEditorMode]               = useState(EDITOR_MODE_VISUAL);
  const [customHtmlByType, setCustomHtmlByType]   = useState({});
  const [htmlCheckSummary, setHtmlCheckSummary] = useState(null);
  const [htmlFormatting, setHtmlFormatting]     = useState(false);
  const [htmlChecking, setHtmlChecking]           = useState(false);
  const [fullScreenOpen, setFullScreenOpen]       = useState(false);
  const hasLoadedRef = useRef(false);
  const logoUploadRef = useRef(null);
  const [colorInputValue, setColorInputValue] = useState("");
  const previewWrapRef = useRef(null);
  const previewInnerRef = useRef(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewSpacerH, setPreviewSpacerH] = useState(0);

  // Scale the email preview to always fit the container width
  useEffect(() => {
    const wrap = previewWrapRef.current;
    if (!wrap) return;
    const EMAIL_WIDTH = 560;
    const obs = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width;
      const scale = available < EMAIL_WIDTH ? available / EMAIL_WIDTH : 1;
      setPreviewScale(scale);
    });
    obs.observe(wrap);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    businessService.getWidgetConfig()
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          const marketplace = { ...DEFAULT_BRANDING, ...(d.marketplace_email_branding || {}) };
          const widget = { ...DEFAULT_BRANDING, ...(d.widget_email_branding || {}) };
          setBrandingByMode({ [EMAIL_MODE_MARKETPLACE]: marketplace, [EMAIL_MODE_WIDGET]: widget });
          const planId = (d.widget_subscription?.planId || "").toLowerCase();
          setCanUseWidgetBranding(planId === "growth" || planId === "advanced");
          applyBrandingToForm(marketplace, {
            setBranding, setDraftFooterText, setDraftConfirmMsg, setDraftPrimaryColor,
            setColorInputValue, setDraftLogoSize, setDraftCardStyle,
            setEditorMode, setCustomHtmlByType,
          });
          hasLoadedRef.current = true;
        }
      })
      .catch(() => message.error("Failed to load email branding settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleModeChange = (mode) => {
    if (mode === emailMode) return;
    const payload = formToBrandingPayload(
      branding,
      draftFooterText,
      draftConfirmMessage,
      draftPrimaryColor,
      draftLogoSize,
      draftCardStyle,
      editorMode,
      customHtmlByType,
    );
    const currentFull = { ...branding, ...payload };
    setBrandingByMode((prev) => ({ ...prev, [emailMode]: currentFull }));
    setEmailMode(mode);
    const nextData = mode === EMAIL_MODE_MARKETPLACE
      ? brandingByMode[EMAIL_MODE_MARKETPLACE]
      : brandingByMode[EMAIL_MODE_WIDGET];
    applyBrandingToForm(nextData, {
      setBranding, setDraftFooterText, setDraftConfirmMsg, setDraftPrimaryColor,
      setColorInputValue, setDraftLogoSize, setDraftCardStyle,
      setEditorMode, setCustomHtmlByType,
    });
  };

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const t = setTimeout(() => {
      const logoPreset = LOGO_SIZE_PRESETS.find((p) => p.value === draftLogoSize) || LOGO_SIZE_PRESETS[1];
      const cardPreset = CARD_STYLE_PRESETS.find((p) => p.value === draftCardStyle) || CARD_STYLE_PRESETS[0];
      setBranding((b) => ({
        ...b,
        footer_text:          draftFooterText,
        confirmation_message: draftConfirmMessage,
        primary_color:        draftPrimaryColor || b.primary_color,
        card_border_width:    cardPreset.border,
        card_border_radius:   cardPreset.radius,
        logo_max_width:       logoPreset.width,
        logo_max_height:      logoPreset.height,
      }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [draftFooterText, draftConfirmMessage, draftPrimaryColor, draftLogoSize, draftCardStyle]);

  const previewHtml = useMemo(() => {
    if (editorMode === EDITOR_MODE_HTML) {
      return buildHtmlModePreviewHtml(branding, previewType, customHtmlByType);
    }
    return buildEmailPreviewHtml(branding, previewType);
  }, [branding, previewType, editorMode, customHtmlByType]);

  useLayoutEffect(() => {
    if (loading) return;
    const el = previewInnerRef.current;
    if (!el) return;
    const sync = () => {
      const h = el.scrollHeight;
      if (!Number.isFinite(h) || h <= 0) {
        setPreviewSpacerH(0);
        return;
      }
      setPreviewSpacerH(Math.max(0, h * (1 - previewScale)));
    };
    sync();
    const ro = new ResizeObserver(() => sync());
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading, previewHtml, previewScale]);

  const emailKeyForPreview = PREVIEW_TYPE_TO_EMAIL_KEY[previewType];
  const requiredCheck = useMemo(
    () => checkRequiredPlaceholdersForType(
      emailKeyForPreview,
      customHtmlByType[emailKeyForPreview] || "",
    ),
    [emailKeyForPreview, customHtmlByType],
  );

  const liveHtmlForPreview = customHtmlByType[emailKeyForPreview] || "";

  useEffect(() => {
    if (editorMode !== EDITOR_MODE_HTML) return undefined;
    const html = (liveHtmlForPreview || "").trim();
    if (!html) {
      setHtmlCheckSummary(null);
      return undefined;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const r = await checkMarketingHtml(liveHtmlForPreview);
        if (!cancelled) setHtmlCheckSummary(r);
      } catch {
        if (!cancelled) setHtmlCheckSummary(null);
      }
    }, 550);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [editorMode, emailKeyForPreview, liveHtmlForPreview]);

  const handleSave = () => {
    if (editorMode === EDITOR_MODE_HTML) {
      for (const [k, html] of Object.entries(customHtmlByType)) {
        if (!html || !String(html).trim()) continue;
        const chk = checkRequiredPlaceholdersForType(k, html);
        if (!chk.ok) {
          message.error(
            `Template “${k}” is missing: ${chk.missing.map((m) => `{{${m}}}`).join(", ")}`,
          );
          return;
        }
      }
    }
    setSaving(true);
    const payload = formToBrandingPayload(
      branding,
      draftFooterText,
      draftConfirmMessage,
      draftPrimaryColor,
      draftLogoSize,
      draftCardStyle,
      editorMode,
      customHtmlByType,
    );
    const key = emailMode === EMAIL_MODE_MARKETPLACE ? "marketplace_email_branding" : "widget_email_branding";
    businessService.updateWidgetConfig({ [key]: payload })
      .then((res) => {
        if (res.success) {
          setBrandingByMode((prev) => ({ ...prev, [emailMode]: { ...branding, ...payload } }));
          message.success("Email branding saved.");
        } else message.error(res.error || "Failed to save.");
      })
      .catch(() => message.error("Failed to save."))
      .finally(() => setSaving(false));
  };

  const handleLogoUpload = async (file) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) { message.error("Please upload a JPG, PNG, WEBP or GIF image."); return Upload.LIST_IGNORE; }
    if (file.size / 1024 / 1024 >= 5) { message.error("Image must be smaller than 5 MB."); return Upload.LIST_IGNORE; }
    setLogoUploading(true);
    try {
      const result = await uploadService.uploadFile(file, "email_branding_logo");
      if (result.success && (result.public_url || result.s3_key)) {
        const url = result.public_url || (typeof window !== "undefined" && process.env.NEXT_PUBLIC_CDN_URL
          ? `${process.env.NEXT_PUBLIC_CDN_URL.replace(/\/$/, "")}/${result.s3_key}` : null);
        if (url) { setBranding((b) => ({ ...b, logo_url: url })); message.success("Logo uploaded."); }
        else message.error("Upload succeeded but could not get image URL.");
      } else {
        message.error(result.error || "Upload failed.");
      }
    } catch { message.error("Upload failed."); }
    finally { setLogoUploading(false); }
    return false;
  };

  const primaryHex = normalizeHex(draftPrimaryColor || branding.primary_color) || "#f81e3e";

  if (loading) {
    return (
      <Root>
        <LeftPanel>
          <PanelHeader>
            <SkeletonPulse style={{ height: 16, width: 180, marginBottom: 8 }} />
            <SkeletonPulse style={{ height: 12, width: 260 }} />
          </PanelHeader>
          {[1, 2, 3, 4].map((i) => (
            <Section key={i} $delay={`${i * 0.05}s`}>
              <SkeletonPulse style={{ height: 11, width: 80, marginBottom: 14 }} />
              <SkeletonPulse style={{ height: 80, width: "100%", borderRadius: 14 }} />
            </Section>
          ))}
        </LeftPanel>
        <RightPanel />
      </Root>
    );
  }

  const EMAIL_NATURAL_WIDTH = 560;

  const previewPanel = (
    <PreviewBodyWrap ref={previewWrapRef}>
      <ScaledPreviewWrap>
        <div
          ref={previewInnerRef}
          className="email-preview-root"
          style={{
            width: EMAIL_NATURAL_WIDTH,
            transform: `scale(${previewScale})`,
            transformOrigin: "top left",
            marginLeft: previewScale < 1
              ? `${((previewWrapRef.current?.clientWidth ?? EMAIL_NATURAL_WIDTH) - EMAIL_NATURAL_WIDTH * previewScale) / 2}px`
              : "auto",
            marginBottom: previewSpacerH ? -previewSpacerH : undefined,
          }}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
          role="article"
          aria-label="Email preview"
        />
      </ScaledPreviewWrap>
    </PreviewBodyWrap>
  );

  return (
    <Root>
      {/* ────────────────── LEFT: Settings ────────────────── */}
      <LeftPanel>
        <PanelHeader>
          <PanelTitle>Email branding</PanelTitle>
          <PanelSub>
            {emailMode === EMAIL_MODE_MARKETPLACE
              ? "Customize emails sent through the ClassEasily marketplace — confirmations, reminders, and updates."
              : "Customize emails sent for widget bookings — confirmations, reminders, and updates."}
          </PanelSub>
        </PanelHeader>

        <ModeToggleWrap>
          <ModeToggleLabel>Email type</ModeToggleLabel>
          <ModeToggleGroup>
            <ModeToggleBtn type="button" $active={emailMode === EMAIL_MODE_MARKETPLACE} onClick={() => handleModeChange(EMAIL_MODE_MARKETPLACE)}>
              Marketplace bookings
            </ModeToggleBtn>
            <ModeToggleBtn type="button" $active={emailMode === EMAIL_MODE_WIDGET} onClick={() => handleModeChange(EMAIL_MODE_WIDGET)} disabled={!canUseWidgetBranding}>
              Widget booking
            </ModeToggleBtn>
          </ModeToggleGroup>
          {!canUseWidgetBranding && (
            <FieldHint style={{ marginTop: 8 }}>Widget booking emails require a Growth or Advanced widget plan.</FieldHint>
          )}
        </ModeToggleWrap>

        <ModeToggleWrap>
          <ModeToggleLabel>Editor</ModeToggleLabel>
          <ModeToggleGroup>
            <ModeToggleBtn type="button" $active={editorMode === EDITOR_MODE_VISUAL} onClick={() => { setEditorMode(EDITOR_MODE_VISUAL); setHtmlCheckSummary(null); }}>
              Visual builder
            </ModeToggleBtn>
            <ModeToggleBtn type="button" $active={editorMode === EDITOR_MODE_HTML} onClick={() => { setEditorMode(EDITOR_MODE_HTML); setHtmlCheckSummary(null); }}>
              HTML code
            </ModeToggleBtn>
          </ModeToggleGroup>
          <FieldHint style={{ marginTop: 8 }}>
            Visual mode styles ClassEasily templates. HTML mode uses your markup with {"{{placeholders}}"}; required tokens are checked before save.
          </FieldHint>
        </ModeToggleWrap>

        <FieldsWrap>
          {editorMode === EDITOR_MODE_HTML ? (
            <>
              <Section $delay="0s">
                <SectionLabel>
                  HTML — {PREVIEW_OPTIONS.find((o) => o.value === previewType)?.label || previewType}
                </SectionLabel>
                <FieldHint style={{ marginBottom: 10 }}>
                  Switch email types with the tabs in the preview. Each type can have its own HTML. Use placeholders exactly like {"{{class_title}}"}.
                </FieldHint>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  <Button
                    size="small"
                    type="default"
                    onClick={() => {
                      setCustomHtmlByType((prev) => ({
                        ...prev,
                        [emailKeyForPreview]: starterHtmlTemplate(emailKeyForPreview),
                      }));
                      message.info("Starter template inserted for this email type.");
                    }}
                  >
                    Starter template
                  </Button>
                  <Button
                    size="small"
                    type="default"
                    loading={htmlFormatting}
                    onClick={async () => {
                      setHtmlFormatting(true);
                      setHtmlCheckSummary(null);
                      try {
                        const cur = customHtmlByType[emailKeyForPreview] || "";
                        const next = await formatMarketingHtml(cur);
                        setCustomHtmlByType((prev) => ({ ...prev, [emailKeyForPreview]: next }));
                        message.success("HTML formatted.");
                      } catch (e) {
                        message.error(e?.message || "Could not format HTML.");
                      } finally {
                        setHtmlFormatting(false);
                      }
                    }}
                  >
                    Format HTML
                  </Button>
                  <Button
                    size="small"
                    type="default"
                    loading={htmlChecking}
                    onClick={async () => {
                      setHtmlChecking(true);
                      try {
                        const r = await checkMarketingHtml(customHtmlByType[emailKeyForPreview] || "");
                        setHtmlCheckSummary(r);
                        if (r.ok && r.warningCount === 0) message.success("No HTML issues reported.");
                        else if (r.ok) message.warning(`${r.warningCount} warning(s).`);
                        else message.error(`${r.errorCount} HTML error(s).`);
                      } catch (e) {
                        message.error(e?.message || "Check failed.");
                      } finally {
                        setHtmlChecking(false);
                      }
                    }}
                  >
                    Check HTML
                  </Button>
                </div>
                <Input.TextArea
                  value={customHtmlByType[emailKeyForPreview] || ""}
                  onChange={(e) => {
                    setCustomHtmlByType((prev) => ({ ...prev, [emailKeyForPreview]: e.target.value }));
                  }}
                  rows={16}
                  placeholder="Paste HTML here…"
                  style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}
                />
                <div
                  role="status"
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    lineHeight: 1.55,
                    color: requiredCheck.ok ? "#344054" : "#D92D20",
                    textDecoration: requiredCheck.ok ? "none" : "underline",
                    textDecorationColor: requiredCheck.ok ? "transparent" : "#D92D20",
                    textUnderlineOffset: "4px",
                    textDecorationThickness: "2px",
                  }}
                >
                  <strong>Required placeholders</strong> for this email:{" "}
                  {requiredCheck.ok ? (
                    <span style={{ color: "#059669", fontWeight: 600 }}>All present.</span>
                  ) : (
                    <span style={{ color: "#D92D20", fontWeight: 600 }}>
                      Missing {requiredCheck.missing.map((m) => `{{${m}}}`).join(", ")}
                    </span>
                  )}
                </div>
                {htmlCheckSummary && htmlCheckSummary.items?.length > 0 && (
                  <HtmlLintPanel $hasErrors={!htmlCheckSummary.ok}>
                    {htmlCheckSummary.items.slice(0, 20).map((it, i) => {
                      const sev = Number(it.severity);
                      const isWarning = sev === 1;
                      const color = isWarning ? "#B54708" : "#B42318";
                      return (
                        <div key={i} style={{ marginBottom: 6, color }}>
                          <span style={{ fontWeight: 700 }}>{isWarning ? "Warning" : "Error"}</span>
                          {" "}
                          L{it.line}:{it.column != null ? `:${it.column}` : ""} — {it.message}
                          {it.ruleId ? (
                            <span style={{ color: "#667085", fontWeight: 500 }}> ({it.ruleId})</span>
                          ) : null}
                        </div>
                      );
                    })}
                  </HtmlLintPanel>
                )}
              </Section>
              <Section $delay="0.05s">
                <SectionLabel>Placeholder reference</SectionLabel>
                <FieldHint style={{ marginBottom: 10 }}>Click to copy into clipboard.</FieldHint>
                {PLACEHOLDER_GROUPS.map((g) => (
                  <div key={g.label} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#98A2B3", textTransform: "uppercase", marginBottom: 6 }}>{g.label}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {g.keys.map((k) => (
                        <Button
                          key={k}
                          size="small"
                          type="link"
                          style={{ padding: "0 4px", height: "auto", fontFamily: "monospace", fontSize: 11 }}
                          onClick={() => {
                            const token = `{{${k}}}`;
                            void navigator.clipboard?.writeText(token);
                            message.success(`Copied ${token}`);
                          }}
                        >
                          {`{{${k}}}`}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </Section>
            </>
          ) : (
          <>
          {/* Logo */}
          <Section $delay="0s">
            <SectionLabel>Logo</SectionLabel>
            {branding.logo_url ? (
              <LogoPreviewCard>
                <div className="logo-img-wrap">
                  <img src={branding.logo_url} alt="Your logo" />
                </div>
                <LogoActions>
                  <Upload beforeUpload={handleLogoUpload} showUploadList={false} accept="image/png,image/jpeg,image/webp,image/gif" disabled={logoUploading}>
                    <ReplaceLogoBtn type="button" disabled={logoUploading}>
                      <UploadOutlined style={{ fontSize: 11 }} />
                      {logoUploading ? "Uploading…" : "Replace"}
                    </ReplaceLogoBtn>
                  </Upload>
                  <RemoveLogoBtn type="button" onClick={() => setBranding((b) => ({ ...b, logo_url: "" }))}>
                    <DeleteOutlined style={{ fontSize: 11 }} />
                    Remove
                  </RemoveLogoBtn>
                </LogoActions>
              </LogoPreviewCard>
            ) : (
              <Upload beforeUpload={handleLogoUpload} showUploadList={false} accept="image/png,image/jpeg,image/webp,image/gif" disabled={logoUploading}>
                <UploadZone as="div" style={{ pointerEvents: logoUploading ? "none" : "auto" }}>
                  <UploadIconWrap>
                    {logoUploading ? "⏳" : <UploadOutlined />}
                  </UploadIconWrap>
                  <UploadZoneText>
                    <div className="primary">{logoUploading ? "Uploading…" : "Upload your logo"}</div>
                    <div className="secondary">PNG, JPG or WEBP · max 5 MB</div>
                  </UploadZoneText>
                </UploadZone>
              </Upload>
            )}
            <FieldHint>Appears at the top of every email you send.</FieldHint>
          </Section>

          {/* Logo size */}
          <Section $delay="0.04s">
            <SectionLabel>Logo size in emails</SectionLabel>
            <PresetGrid $cols={3}>
              {LOGO_SIZE_PRESETS.map((p) => {
                const active = draftLogoSize === p.value;
                const scale = { small: 0.6, medium: 0.8, large: 1 }[p.value];
                return (
                  <PresetCard key={p.value} $active={active} onClick={() => setDraftLogoSize(p.value)} type="button">
                    <SizePreviewBox>
                      <SizePreviewBar $w={Math.round(40 * scale)} $h={Math.round(14 * scale)} />
                    </SizePreviewBox>
                    <PresetCardLabel $active={active}>{p.label}</PresetCardLabel>
                    <PresetCardDesc>{p.desc}</PresetCardDesc>
                  </PresetCard>
                );
              })}
            </PresetGrid>
          </Section>

          {/* Primary color */}
          <Section $delay="0.08s">
            <SectionLabel>Brand color</SectionLabel>
            <ColorRow>
              <ColorSwatchBtn $color={primaryHex} title="Click to pick a color">
                <input
                  type="color"
                  value={primaryHex}
                  onChange={(e) => {
                    const hex = e.target.value;
                    setDraftPrimaryColor(hex);
                    setColorInputValue(hex.toUpperCase());
                  }}
                />
              </ColorSwatchBtn>
              <ColorHexInput
                type="text"
                value={colorInputValue}
                placeholder="#F81E3E"
                maxLength={7}
                onChange={(e) => {
                  const raw = e.target.value;
                  setColorInputValue(raw);
                  const norm = normalizeHex(raw);
                  if (norm) setDraftPrimaryColor(norm);
                }}
                onBlur={() => {
                  setColorInputValue(primaryHex.toUpperCase());
                }}
              />
            </ColorRow>
            <FieldHint>Used for buttons, highlights, and accents throughout your emails.</FieldHint>
          </Section>

          {/* Card style */}
          <Section $delay="0.12s">
            <SectionLabel>Info card style</SectionLabel>
            <PresetGrid $cols={4}>
              {CARD_STYLE_PRESETS.map((p) => {
                const active = draftCardStyle === p.value;
                return (
                  <PresetCard key={p.value} $active={active} onClick={() => setDraftCardStyle(p.value)} type="button">
                    <CardPreviewBox>
                      <CardPreviewRect $radius={p.preview} $noBorder={p.noLine} />
                    </CardPreviewBox>
                    <PresetCardLabel $active={active}>{p.label}</PresetCardLabel>
                  </PresetCard>
                );
              })}
            </PresetGrid>
            <FieldHint>Shape of the info boxes (date, time, location) in your emails.</FieldHint>
          </Section>

          {/* Page background */}
          <Section $delay="0.13s">
            <SectionLabel>Email background</SectionLabel>
            <ColorRow>
              <ColorSwatchBtn $color={normalizeHex(branding.background_color) || "#F5F5F7"} title="Background">
                <input
                  type="color"
                  value={normalizeHex(branding.background_color) || "#F5F5F7"}
                  onChange={(e) => setBranding((b) => ({ ...b, background_color: e.target.value }))}
                />
              </ColorSwatchBtn>
              <Input
                value={branding.background_color || ""}
                onChange={(e) => setBranding((b) => ({ ...b, background_color: e.target.value }))}
                placeholder="#F5F5F7"
                maxLength={7}
                style={{ flex: 1, height: 44, borderRadius: 10 }}
              />
            </ColorRow>
            <FieldHint>Outer background behind the email card (default light gray).</FieldHint>
          </Section>

          {/* Button shape */}
          <Section $delay="0.137s">
            <SectionLabel>Button shape</SectionLabel>
            <PresetGrid $cols={3}>
              {BUTTON_STYLE_PRESETS.map((p) => {
                const active = (branding.button_style || "pill") === p.value;
                return (
                  <PresetCard key={p.value} $active={active} onClick={() => setBranding((b) => ({ ...b, button_style: p.value }))} type="button">
                    <PresetCardLabel $active={active}>{p.label}</PresetCardLabel>
                  </PresetCard>
                );
              })}
            </PresetGrid>
          </Section>

          {/* CTA labels */}
          <Section $delay="0.138s">
            <FieldLabel>Button text (signed-in guests)</FieldLabel>
            <Input
              value={branding.button_text || ""}
              onChange={(e) => setBranding((b) => ({ ...b, button_text: e.target.value }))}
              placeholder="e.g. View ticket & details"
              maxLength={80}
              showCount
            />
            <FieldLabel style={{ marginTop: 12 }}>Button text (guest checkout)</FieldLabel>
            <Input
              value={branding.button_text_guest || ""}
              onChange={(e) => setBranding((b) => ({ ...b, button_text_guest: e.target.value }))}
              placeholder="e.g. Manage booking"
              maxLength={80}
              showCount
            />
          </Section>

          {/* Section visibility */}
          <Section $delay="0.139s">
            <SectionLabel>Show in confirmation &amp; reminder</SectionLabel>
            {[
              { key: "cancellation_policy", label: "Cancellation policy block" },
              { key: "contact_info", label: "Host contact row" },
              { key: "equipment", label: "Note from host / equipment" },
              { key: "participants", label: "Participants / attendees row" },
            ].map(({ key, label }) => {
              const on = branding.visible_sections?.[key] !== false;
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: "#344054" }}>{label}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setBranding((b) => ({
                        ...b,
                        visible_sections: {
                          ...DEFAULT_BRANDING.visible_sections,
                          ...b.visible_sections,
                          [key]: !on,
                        },
                      }))}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      border: "none",
                      background: on ? "#101828" : "#E4E7EC",
                      cursor: "pointer",
                      position: "relative",
                    }}
                    aria-pressed={on}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        left: on ? 22 : 2,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.15s",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                      }}
                    />
                  </button>
                </div>
              );
            })}
          </Section>

          {/* Footer text */}
          <Section $delay="0.16s">
            <FieldLabel>Footer text</FieldLabel>
            <TextAreaWrap>
              <Input.TextArea
                value={draftFooterText}
                onChange={(e) => setDraftFooterText(e.target.value)}
                placeholder="e.g. Questions? Email us at hello@yourstudio.com"
                rows={2}
                maxLength={300}
                showCount
              />
            </TextAreaWrap>
            <FieldHint>Optional line below the main content in every email.</FieldHint>
          </Section>

          {/* Custom message */}
          <Section $delay="0.2s">
            <FieldLabel>Custom message</FieldLabel>
            <TextAreaWrap>
              <Input.TextArea
                value={draftConfirmMessage}
                onChange={(e) => setDraftConfirmMsg(e.target.value)}
                placeholder="e.g. We can't wait to see you — bring water and a mat!"
                rows={3}
                maxLength={500}
                showCount
              />
            </TextAreaWrap>
            <FieldHint>Shown just below the booking details in confirmation and reminder emails.</FieldHint>
          </Section>
          </>
          )}
        </FieldsWrap>

        <SaveBar>
          <SaveHint>Changes apply to future emails only</SaveHint>
          <SaveBtn onClick={handleSave} disabled={saving} type="button">
            {saving ? "Saving…" : "Save branding"}
          </SaveBtn>
        </SaveBar>
      </LeftPanel>

      {/* ────────────────── RIGHT: Preview ────────────────── */}
      <RightPanel>
        <PreviewHeader>
          
          <PreviewTypeTabs>
            {PREVIEW_OPTIONS.map((opt) => (
              <PreviewTab
                key={opt.value}
                $active={previewType === opt.value}
                onClick={() => setPreviewType(opt.value)}
                type="button"
              >
                <span className="tab-icon">{opt.icon}</span>
                {opt.label}
              </PreviewTab>
            ))}
          </PreviewTypeTabs>
        </PreviewHeader>
        {previewPanel}
      </RightPanel>

      {/* Legacy mobile overlay — unused but kept for safety */}
      <MobilePreviewBtn type="button" aria-hidden="true" />
    </Root>
  );
}