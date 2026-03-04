"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import styled from "styled-components";
import { Input, Button, ColorPicker, Upload, Select } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { businessService, uploadService } from "@/services/apiService";
import message from "@/lib/message";

const DEFAULT_BRANDING = {
  logo_url: "",
  primary_color: "",
  footer_text: "",
  confirmation_message: "",
};

const PREVIEW_OPTIONS = [
  { value: "booking_confirmation", label: "Booking confirmation" },
  { value: "booking_reminder", label: "Booking reminder" },
  { value: "booking_cancelled_by_host", label: "Cancelled by host" },
  { value: "booking_rescheduled", label: "Rescheduled by business" },
  { value: "booking_cancellation_confirmed", label: "Cancellation confirmed (guest cancelled)" },
];

function normalizeHex(val) {
  if (val == null || typeof val !== "string") return null;
  const s = val.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const r = s[1] + s[1], g = s[2] + s[2], b = s[3] + s[3];
    return "#" + r + g + b;
  }
  const m = s.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (m) {
    const hex = (n) => Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, "0");
    return "#" + hex(m[1]) + hex(m[2]) + hex(m[3]);
  }
  return null;
}

function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

function esc(s) {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildEmailPreviewHtml(branding, previewType) {
  const logoUrl = (branding?.logo_url || "").trim();
  const primaryColor = normalizeHex(branding?.primary_color) || "#f81e3e";
  const footerText = (branding?.footer_text || "").trim();
  const confirmationMessage = (branding?.confirmation_message || "").trim();
  const buttonBg = primaryColor;
  const cardTimeColor = primaryColor;

  const logoBlock = logoUrl
    ? `<p style="margin-bottom: 16px;"><img src="${logoUrl.replace(/"/g, "&quot;")}" alt="" style="max-width: 160px; max-height: 60px; height: auto;" /></p>`
    : "";

  let content = "";
  switch (previewType) {
    case "booking_confirmation": {
      content = `
    <div style="text-align: center; font-family: 'Proxima Soft', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      ${logoBlock || '<div style="font-size: 48px; margin-bottom: 16px; line-height: 1;">🎉</div>'}
      <h1 style="margin-bottom: 8px; font-size: 32px; color: #1D1D1F;">Get ready for something great.</h1>
      ${confirmationMessage ? `<p style="font-size: 14px; color: #484848; margin-bottom: 16px;">${esc(confirmationMessage)}</p>` : ""}
      <p style="font-size: 16px; color: #484848; margin-bottom: 24px;">Hi Alex, your spot is secured for <strong>Morning Yoga Flow</strong>.</p>
      <div style="background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 24px; max-width: 480px; margin-left: auto; margin-right: auto;">
        <div style="background: #F5F5F7; padding: 20px 24px; border-bottom: 1px solid #E5E7EB;">
          <div style="font-size: 11px; color: #86868B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Date & time</div>
          <div style="font-size: 22px; font-weight: 700; color: #1D1D1F;">Monday, March 10</div>
          <div style="font-size: 16px; color: ${cardTimeColor}; font-weight: 600; margin-top: 4px;">9:00 AM - 10:00 AM</div>
          <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">60 min</div>
        </div>
        <div style="padding: 20px 24px; text-align: left;">
          <div style="display: table; width: 100%; border-collapse: collapse;">
            <div style="display: table-row;"><div style="display: table-cell; font-size: 11px; color: #86868B; text-transform: uppercase; padding: 6px 12px 6px 0; white-space: nowrap;">Location</div><div style="display: table-cell; font-size: 14px; color: #1D1D1F;">123 Studio Lane</div></div>
            <div style="display: table-row;"><div style="display: table-cell; font-size: 11px; color: #86868B; text-transform: uppercase; padding: 6px 12px 6px 0;">Provider</div><div style="display: table-cell; font-size: 14px; color: #1D1D1F;">Your Business Name</div></div>
            <div style="display: table-row;"><div style="display: table-cell; font-size: 11px; color: #86868B; text-transform: uppercase; padding: 6px 12px 6px 0;">Reference</div><div style="display: table-cell; font-size: 14px; font-family: monospace; color: #1D1D1F;">BK-ABC123</div></div>
          </div>
        </div>
      </div>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
        <a href="#" style="background-color: ${buttonBg}; color: #ffffff; border-radius: 980px; padding: 16px 36px; display: inline-block; font-weight: 600; font-size: 16px; text-decoration: none;">View Ticket &amp; Details</a>
      </td></tr></table>
      <p style="margin-top: 24px; font-size: 13px; color: #86868B;">View directions and manage your booking in your account.</p>
    </div>`;
      break;
    }
    case "booking_reminder": {
      content = `
    <div style="text-align: center; font-family: 'Proxima Soft', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      ${logoBlock || '<div style="font-size: 48px; margin-bottom: 16px; line-height: 1;">⏰</div>'}
      <h1 style="margin-bottom: 8px; font-size: 32px; color: #1D1D1F;">Your class is coming up</h1>
      ${confirmationMessage ? `<p style="font-size: 14px; color: #484848; margin-bottom: 16px;">${esc(confirmationMessage)}</p>` : ""}
      <p style="font-size: 16px; color: #484848; margin-bottom: 24px;">Hi Alex, <strong>Morning Yoga Flow</strong> is coming up.</p>
      <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 16px; overflow: hidden; margin-bottom: 24px; max-width: 480px; margin-left: auto; margin-right: auto;">
        <div style="padding: 20px 24px; border-bottom: 1px solid #E5E7EB;">
          <div style="font-size: 11px; color: #86868B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Date & time</div>
          <div style="font-size: 20px; font-weight: 700; color: #1D1D1F;">Monday, March 10</div>
          <div style="font-size: 15px; color: #484848;">9:00 AM – 10:00 AM</div>
        </div>
        <div style="padding: 16px 24px; background: #fff; text-align: left;">
          <div style="font-size: 11px; color: #86868B; text-transform: uppercase; margin-bottom: 4px;">Location</div>
          <div style="font-size: 14px; color: #1D1D1F;">123 Studio Lane</div>
          <div style="font-size: 11px; color: #86868B; text-transform: uppercase; margin: 12px 0 4px;">Attendees</div>
          <div style="font-size: 14px; color: #1D1D1F;">2 people</div>
        </div>
      </div>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
        <a href="#" style="background-color: ${buttonBg}; color: #ffffff; border-radius: 980px; padding: 16px 36px; display: inline-block; font-weight: 600; font-size: 16px; text-decoration: none;">View details</a>
      </td></tr></table>
    </div>`;
      break;
    }
    case "booking_cancelled_by_host": {
      content = `
    <div style="text-align: center; font-family: 'Proxima Soft', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      ${logoBlock || '<div style="font-size: 48px; margin-bottom: 24px; line-height: 1;">📣</div>'}
      <h1 style="margin-bottom: 8px; font-size: 28px; color: #1D1D1F;">We have an update.</h1>
      <p style="font-size: 18px; color: #1D1D1F; margin-bottom: 32px;">Hi Alex,<br>Your booking for <strong>Morning Yoga Flow</strong> has been cancelled by the host.</p>
      <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 16px; padding: 24px; text-align: left; margin-bottom: 24px; max-width: 480px; margin-left: auto; margin-right: auto;">
        <div style="margin-bottom: 16px;">
          <div style="font-size: 14px; color: #86868B;">Reason provided</div>
          <div style="font-size: 16px; color: #1D1D1F;">Host unavailable</div>
        </div>
        <div style="background-color: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 12px; padding: 12px;">
          <span style="font-size: 20px; margin-right: 12px;">💸</span>
          <div style="display: inline-block; vertical-align: top;">
            <div style="font-size: 13px; color: #86868B; text-transform: uppercase; letter-spacing: 0.05em;">Refund Issued</div>
            <div style="font-size: 16px; font-weight: 600; color: #1D1D1F;">$29.00 to your original payment method.</div>
          </div>
        </div>
      </div>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
        <a href="#" style="background-color: ${buttonBg}; color: #ffffff; border-radius: 980px; padding: 16px 36px; display: inline-block; font-weight: 600; font-size: 16px; text-decoration: none;">Find another class</a>
      </td></tr></table>
    </div>`;
      break;
    }
    case "booking_rescheduled": {
      content = `
    <div style="text-align: center; font-family: 'Proxima Soft', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      ${logoBlock || '<div style="font-size: 48px; margin-bottom: 24px; line-height: 1;">🗓️</div>'}
      <h1 style="margin-bottom: 8px; font-size: 28px; color: #1D1D1F;">New time, same great experience.</h1>
      <p style="font-size: 18px; color: #1D1D1F; margin-bottom: 32px;">Hi Alex,<br>The host has rescheduled <strong>your booking</strong> for <em>Morning Yoga Flow</em>.</p>
      <div style="background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 20px; overflow: hidden; margin-bottom: 32px; max-width: 480px; margin-left: auto; margin-right: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="padding: 16px; background-color: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #86868B; font-weight: 700; margin-bottom: 4px;">Previous Time</div>
          <div style="font-size: 16px; text-decoration: line-through; color: #9CA3AF;">Monday, March 10 at 9:00 AM</div>
        </div>
        <div style="padding: 24px;">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: ${cardTimeColor}; font-weight: 700; margin-bottom: 8px;">New Time</div>
          <div style="font-size: 20px; font-weight: 700; color: #1D1D1F;">Wednesday, March 12</div>
          <div style="font-size: 18px; font-weight: 500; color: #1D1D1F;">10:00 AM</div>
        </div>
      </div>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
        <a href="#" style="background-color: ${buttonBg}; color: #ffffff; border-radius: 980px; padding: 16px 36px; display: inline-block; font-weight: 600; font-size: 16px; text-decoration: none;">View updated booking</a>
      </td></tr></table>
    </div>`;
      break;
    }
    case "booking_cancellation_confirmed": {
      content = `
    <div style="text-align: center; font-family: 'Proxima Soft', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      ${logoBlock || '<div style="font-size: 48px; margin-bottom: 24px; line-height: 1;">🗓️</div>'}
      <h1 style="margin-bottom: 8px; font-size: 28px; color: #1D1D1F;">Your schedule is clear.</h1>
      <p style="font-size: 18px; color: #1D1D1F; margin-bottom: 32px;">Hi Alex,<br>We've processed the cancellation for your upcoming experience.</p>
      <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 16px; padding: 24px; text-align: left; margin-bottom: 32px; max-width: 480px; margin-left: auto; margin-right: auto;">
        <h2 style="font-size: 16px; text-transform: uppercase; color: #86868B; letter-spacing: 0.05em; margin-bottom: 16px; margin-top: 0;">Cancellation Summary</h2>
        <div style="margin-bottom: 12px;"><div style="font-size: 14px; color: #86868B;">Experience</div><div style="font-size: 16px; font-weight: 600; color: #1D1D1F;">Morning Yoga Flow</div></div>
        <div style="margin-bottom: 12px;"><div style="font-size: 14px; color: #86868B;">Original Date</div><div style="font-size: 16px; color: #1D1D1F;">Monday, March 10 at 9:00 AM</div></div>
        <div style="border-top: 1px dashed #D1D5DB; padding-top: 12px; margin-top: 16px;"><div style="font-size: 14px; color: #86868B;">Refund Status</div><div style="font-size: 16px; color: #1D1D1F;">Processed according to the host's policy.</div></div>
      </div>
      <p style="color: #484848; margin-bottom: 32px;">Whenever you're ready to book your next adventure, we'll be here.</p>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
        <a href="#" style="background-color: ${buttonBg}; color: #ffffff; border-radius: 980px; padding: 16px 36px; display: inline-block; font-weight: 600; font-size: 16px; text-decoration: none;">Browse classes</a>
      </td></tr></table>
    </div>`;
      break;
    }
    default:
      content = `<div style="text-align: center; padding: 24px;">Select a preview type.</div>`;
  }

  const reportHeightScript = `
(function() {
  function reportHeight() {
    try {
      var h = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'email-preview-height', height: h }, '*');
    } catch (e) {}
  }
  if (document.readyState === 'complete') reportHeight();
  else window.addEventListener('load', reportHeight);
})();
  `.trim();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Preview</title>
  <style>
    @font-face { font-family: 'Proxima Soft'; src: url('/fonts/ProximaSoft-Regular.ttf') format('truetype'); }
    body { margin: 0; padding: 0; background-color: #F5F5F7; color: #1D1D1F; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card-wrap { background: #fff; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.04); overflow: hidden; }
    .content-pad { padding: 50px 50px; }
  </style>
</head>
<body>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F5F7;">
    <tr><td align="center" style="padding: 40px 0;">
      <table class="container" role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr><td class="card-wrap"><div class="content-pad">${content}</div></td></tr>
        <tr><td style="padding: 32px 20px; text-align: center; font-family: 'Proxima Soft', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          ${footerText ? `<p style="font-size: 11px; color: #86868B; margin-bottom: 8px;">${esc(footerText)}</p>` : ""}
          <p style="font-size: 11px; color: #86868B; margin: 0;">© ClassEasily. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
  <script>${reportHeightScript}<\\/script>
</body>
</html>
  `.trim();
}


/* ─── Layout & styled components ───────────────────────────────────────────── */

const PageWrap = styled.div`
  display: flex;
  flex-direction: column;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 400px 1fr;
  align-items: start;
  min-height: calc(100vh - 120px);

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    min-height: unset;
  }
`;

const LeftPanel = styled.div`
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;

  @media (max-width: 960px) {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
`;

const PanelHeader = styled.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f3f4f6;
`;

const PanelTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
`;

const PanelSub = styled.div`
  font-size: 12px;
  color: #9ca3af;
  margin-top: 3px;
  line-height: 1.5;
`;

const FieldsWrap = styled.div`
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const FieldLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  letter-spacing: 0.01em;
  display: block;
`;

const FieldHint = styled.div`
  font-size: 11px;
  color: #9ca3af;
  line-height: 1.4;
`;

const SectionDivider = styled.div`
  height: 1px;
  background: #f3f4f6;
  margin: 0 -24px;
`;

const SaveRow = styled.div`
  padding: 14px 24px;
  border-top: 1px solid #f3f4f6;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const SaveHint = styled.div`
  font-size: 11.5px;
  color: #9ca3af;
`;

const RightPanel = styled.div`
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  background: #f5f5f7;
  min-height: 400px;
  align-self: start;

  @media (max-width: 960px) {
    position: static;
    min-height: 400px;
  }
`;

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  gap: 12px;
`;

const PreviewTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '';
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 2px #dcfce7;
  }
`;

const PreviewIframeWrap = styled.div`
  position: relative;
  overflow: hidden;

  iframe {
    width: 100%;
    height: ${({ $height }) => $height}px;
    min-height: 200px;
    border: none;
    display: block;
    vertical-align: top;
  }
`;

/* ─── Main component ─────────────────────────────────────────────── */

const DEBOUNCE_MS = 350;

export default function EmailBrandingSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [branding, setBranding] = useState({ ...DEFAULT_BRANDING });
  const [draftFooterText, setDraftFooterText] = useState("");
  const [draftConfirmationMessage, setDraftConfirmationMessage] = useState("");
  const [draftPrimaryColor, setDraftPrimaryColor] = useState("");
  const [previewType, setPreviewType] = useState("booking_confirmation");
  const [iframeHeight, setIframeHeight] = useState(400);
  const previewIframeRef = useRef(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    businessService.getWidgetConfig()
      .then((res) => {
        if (res.success && res.data) {
          const data = { ...DEFAULT_BRANDING, ...(res.data.marketplace_email_branding || {}) };
          setBranding(data);
          setDraftFooterText(data.footer_text ?? "");
          setDraftConfirmationMessage(data.confirmation_message ?? "");
          setDraftPrimaryColor(data.primary_color ?? "");
          hasLoadedRef.current = true;
        }
      })
      .catch(() => message.error("Failed to load email branding settings"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const t = setTimeout(() => {
      setBranding((b) => ({
        ...b,
        footer_text: draftFooterText,
        confirmation_message: draftConfirmationMessage,
        primary_color: draftPrimaryColor || b.primary_color,
      }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [draftFooterText, draftConfirmationMessage, draftPrimaryColor]);

  const previewHtml = useMemo(
    () => buildEmailPreviewHtml(branding, previewType),
    [branding, previewType]
  );

  useEffect(() => {
    const iframe = previewIframeRef.current;
    if (iframe && previewHtml) {
      setIframeHeight(400);
      try {
        iframe.srcdoc = previewHtml;
      } catch (e) {
        // ignore
      }
    }
  }, [previewHtml]);

  useEffect(() => {
    const onMessage = (e) => {
      if (e.data?.type === "email-preview-height" && typeof e.data.height === "number") {
        setIframeHeight(Math.max(200, e.data.height));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const handleSave = () => {
    setSaving(true);
    const payload = {
      marketplace_email_branding: {
        logo_url: (branding.logo_url || "").trim() || undefined,
        primary_color: (draftPrimaryColor || branding.primary_color || "").trim() || undefined,
        footer_text: (draftFooterText || "").trim() || undefined,
        confirmation_message: (draftConfirmationMessage || "").trim() || undefined,
      },
    };
    businessService.updateWidgetConfig(payload)
      .then((res) => {
        if (res.success) {
          message.success("Email branding saved.");
        } else {
          message.error(res.error || "Failed to save.");
        }
      })
      .catch(() => message.error("Failed to save."))
      .finally(() => setSaving(false));
  };

  const handleLogoUpload = async (file) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      message.error("Please upload a JPG, PNG, WEBP or GIF image.");
      return Upload.LIST_IGNORE;
    }
    if (file.size / 1024 / 1024 >= 5) {
      message.error("Image must be smaller than 5 MB.");
      return Upload.LIST_IGNORE;
    }
    setLogoUploading(true);
    try {
      const result = await uploadService.uploadFile(file, "email_branding_logo");
      if (result.success && (result.public_url || result.s3_key)) {
        const url = result.public_url || (typeof window !== "undefined" && process.env.NEXT_PUBLIC_CDN_URL
          ? `${process.env.NEXT_PUBLIC_CDN_URL.replace(/\/$/, "")}/${result.s3_key}`
          : null);
        if (url) {
          setBranding((b) => ({ ...b, logo_url: url }));
          message.success("Logo uploaded.");
        } else {
          message.error("Upload succeeded but could not get image URL.");
        }
      } else {
        message.error(result.error || "Upload failed.");
      }
    } catch (e) {
      message.error("Upload failed.");
    } finally {
      setLogoUploading(false);
    }
    return false;
  };

  const primaryHex = normalizeHex(draftPrimaryColor || branding.primary_color) || "#f81e3e";

  if (loading) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: "#6b7280", fontSize: 13 }}>
        Loading email settings…
      </div>
    );
  }

  return (
    <PageWrap>
      <TwoCol>

        {/* ── Left: fields panel ── */}
        <LeftPanel>
          <PanelHeader>
            <PanelTitle>Marketplace email branding</PanelTitle>
            <PanelSub>Customize emails sent through the ClassEasily marketplace — confirmations, reminders, and updates.</PanelSub>
          </PanelHeader>

          <FieldsWrap>

            {/* Logo */}
            <FieldGroup>
              <FieldLabel>Logo</FieldLabel>
              <Upload
                listType="picture"
                maxCount={1}
                fileList={branding.logo_url
                  ? [{ uid: "logo", name: "Logo", status: "done", url: branding.logo_url }]
                  : []}
                beforeUpload={handleLogoUpload}
                onRemove={() => setBranding((b) => ({ ...b, logo_url: "" }))}
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={logoUploading}
              >
                <Button type="primary" icon={<UploadOutlined />} loading={logoUploading}>
                  Upload
                </Button>
              </Upload>
              <FieldHint>PNG, JPG or WEBP · max 5 MB · displayed at up to 160 × 60 px</FieldHint>
            </FieldGroup>

            <SectionDivider />

            {/* Primary color */}
            <FieldGroup>
              <FieldLabel>Primary color</FieldLabel>
              <ColorPicker
                value={primaryHex}
                onChange={(color) => {
                  const next = color?.toHexString?.() ?? (typeof color === "string" ? color : primaryHex);
                  setDraftPrimaryColor(normalizeHex(next) || next);
                }}
                size="middle"
                showText
                format="hex"
                disabledAlpha
              />
              <FieldHint>Used for buttons, accent text and highlights in all marketplace emails.</FieldHint>
            </FieldGroup>

            <SectionDivider />

            {/* Footer text */}
            <FieldGroup>
              <FieldLabel>Footer text</FieldLabel>
              <Input.TextArea
                value={draftFooterText}
                onChange={(e) => setDraftFooterText(e.target.value)}
                placeholder="e.g. Questions? Email us at hello@yourstudio.com"
                rows={2}
                size="middle"
                maxLength={300}
                showCount
              />
              <FieldHint>Appears below the main content in every email.</FieldHint>
            </FieldGroup>

            <SectionDivider />

            {/* Custom message */}
            <FieldGroup>
              <FieldLabel>Custom message</FieldLabel>
              <Input.TextArea
                value={draftConfirmationMessage}
                onChange={(e) => setDraftConfirmationMessage(e.target.value)}
                placeholder="e.g. We can't wait to see you — bring water and a mat!"
                rows={3}
                size="middle"
                maxLength={500}
                showCount
              />
              <FieldHint>Added near the top of confirmation and reminder emails.</FieldHint>
            </FieldGroup>

          </FieldsWrap>

          <SaveRow>
            <SaveHint>Changes apply to future emails only.</SaveHint>
            <Button type="primary" onClick={handleSave} loading={saving} style={{ fontWeight: 600 }}>
              {saving ? "Saving…" : "Save branding"}
            </Button>
          </SaveRow>
        </LeftPanel>

        {/* ── Right: live preview panel ── */}
        <RightPanel>
          <PreviewHeader>
            <PreviewTitle>Live preview</PreviewTitle>
            <Select
              value={previewType}
              onChange={setPreviewType}
              options={PREVIEW_OPTIONS}
              size="small"
              style={{ width: 220 }}
            />
          </PreviewHeader>
          <PreviewIframeWrap $height={iframeHeight}>
            <iframe
              ref={previewIframeRef}
              title="Email preview"
              sandbox="allow-same-origin"
            />
          </PreviewIframeWrap>
        </RightPanel>

      </TwoCol>
    </PageWrap>
  );
}