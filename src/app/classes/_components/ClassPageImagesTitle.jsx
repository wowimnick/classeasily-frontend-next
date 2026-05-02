"use client";

import React, { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Modal } from "antd";
import { Drawer } from "vaul";
import message from "@/lib/message";
import styled, { css, keyframes } from "styled-components";
import {
  Heart,
  Share2,
  Copy,
  X,
  Star,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Facebook,
  Twitter,
  Phone,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { LordIcon } from "@/services/ReactUtils";

const HERO_TEXT = "#111111";
const HERO_MUTED = "#717171";

/** Soft elevation under hero / modal icons (Lucide, LordIcon wrappers, inline SVG). */
const iconDropShadow = css`
  filter: drop-shadow(0 3px 8px rgba(15, 23, 42, 0.18))
    drop-shadow(0 2px 4px rgba(15, 23, 42, 0.1));
`;

/** Toronto / homepage suggested-area marker (SearchContext LORDICON_TORONTO). */
const LOCATION_LORD_ICON = "https://cdn.lordicon.com/bpmglzll.json";
/** Partner & Premium pills (legacy class page). */
const PARTNER_LORD_ICON = "https://cdn.lordicon.com/zopdjjjs.json";

const calculateHostingDuration = (dateString) => {
  if (!dateString) return "";
  const startDate = new Date(dateString);
  const now = new Date();
  if (Number.isNaN(startDate.getTime()) || startDate > now) return "";
  const years = now.getFullYear() - startDate.getFullYear();
  const months = now.getMonth() - startDate.getMonth();
  const totalMonths =
    years * 12 + months + (now.getDate() < startDate.getDate() ? -1 : 0);
  if (totalMonths >= 12) {
    const totalYears = Math.floor(totalMonths / 12);
    return `${totalYears} year${totalYears > 1 ? "s" : ""}`;
  }
  if (totalMonths > 0)
    return `${totalMonths} month${totalMonths > 1 ? "s" : ""}`;
  const totalDays = Math.max(
    1,
    Math.floor((now - startDate) / (1000 * 3600 * 24)),
  );
  return `${totalDays} day${totalDays > 1 ? "s" : ""}`;
};

// --- Constants & Placeholders ---
const CLASSEASILY_RED_ACCESSIBLE = "#E63151";
const PLACEHOLDER_IMAGES = [
  "https://i.imgur.com/vL2za35.png",
  "https://i.imgur.com/Kned4kE.png",
  "https://i.imgur.com/X3SVGsv.png",
  "https://i.imgur.com/tdUN3iQ.png",
  "https://i.imgur.com/vL2za35.png",
];

// --- Styled Components ---
const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const HeroFullBleed = styled.section`
  width: 100%;
  background: #ffffff;
`;

const HeroDesktopRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: clamp(8px, 1.2vw, 18px);
  max-width: 1360px;
  margin: 0 auto;
  padding: clamp(12px, 1.5vw, 20px) clamp(12px, 2.5vw, 28px) 28px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 0;
    max-width: none;
    margin: 0;
  }
`;

const HeroPhotoColumn = styled.div`
  flex: 0 1 60%;
  min-width: 0;
  max-width: 60%;
  position: relative;

  @media (min-width: 769px) {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  @media (max-width: 768px) {
    flex: none;
    width: 100%;
    max-width: 100%;
  }
`;

const MobileTopNav = styled.nav`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
    background: #ffffff;
  }
`;

const MobileNavBack = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-left: -8px;
  border: none;
  background: transparent;
  color: ${HERO_TEXT};
  cursor: pointer;
  border-radius: 50%;
  &:hover {
    background: #f7f7f7;
  }
  svg {
    ${iconDropShadow}
  }
`;

const MobileNavTitle = styled.span`
  flex: 1;
  min-width: 0;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: ${HERO_TEXT};
  padding: 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MobileNavIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-right: -4px;
`;

const StrokeIconBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  background: transparent;
  color: #222;
  cursor: pointer;
  border-radius: 8px;
  &:hover:not(:disabled) {
    background: #f7f7f7;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  svg {
    ${iconDropShadow}
  }
`;

const HeroBentoWrap = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: flex-start;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 0 16px 12px;
  }

  @media (min-width: 769px) {
    max-width: min(92dvh, 100%);
    justify-content: flex-end;
  }
`;

const HeroBentoGrid = styled.div`
  display: grid;
  width: 100%;
  gap: 5px;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
  border-radius: 26px;

  @media (max-width: 768px) {
    border-radius: 22px;
    aspect-ratio: 1;
    height: auto;
    min-height: 0;
  }

  /* Tablet portrait / large “mobile” layout (~756px): square was nearly full-width — cap size */
  @media (max-width: 768px) and (min-width: 540px) {
    max-width: min(520px, calc(100vw - 32px));
    margin-left: auto;
    margin-right: auto;
  }

  @media (min-width: 769px) {
    width: min(92dvh, 100%);
    aspect-ratio: 1;
    height: auto;
    min-height: 0;
    flex-shrink: 0;
  }

  ${({ $count }) =>
    $count <= 1 &&
    css`
      grid-template-columns: 1fr;
      grid-template-rows: 1fr;
    `}

  ${({ $count }) =>
    $count === 2 &&
    css`
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr;
    `}

  ${({ $count }) =>
    $count === 3 &&
    css`
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      & > *:nth-child(1) {
        grid-row: span 2;
      }
    `}

  ${({ $count }) =>
    $count >= 4 &&
    css`
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
    `}
`;

const BentoCell = styled.div`
  position: relative;
  min-height: 0;
  overflow: hidden;
  background: #f0f0f0;
  border-radius: 8px;
  cursor: pointer;

  @media (min-width: 769px) {
    border-radius: 9px;
  }
`;

const BentoImageInner = styled.div`
  position: absolute;
  inset: 0;
`;

const HeroContentColumn = styled.div`
  flex: 1 1 0;
  min-width: 0;
  max-width: 40%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 12px clamp(16px, 2.2vw, 24px);
  box-sizing: border-box;

  @media (min-width: 769px) {
    padding: 12px clamp(14px, 2vw, 22px) 12px clamp(4px, 0.75vw, 11px);
  }

  @media (max-width: 768px) {
    flex: none;
    width: 100%;
    max-width: 100%;
    align-items: stretch;
    padding: 20px 18px 12px;
  }
`;

const HeroContentInner = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  text-align: center;

  @media (max-width: 768px) {
    max-width: none;
    margin: 0;
    text-align: center;
  }
`;

const HeroTitle = styled.h1`
  order: 1;
  margin: 0 0 16px;
  font-size: clamp(28px, 2.6vw, 35px);
  font-weight: 700;
  color: ${HERO_TEXT};
  line-height: 1.12;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: clamp(26px, 7vw, 30px);
    margin: 0 0 12px;
    text-align: center;
  }
`;

const HeroSummary = styled.p`
  order: 4;
  margin: 0 auto 20px;
  font-size: 15px;
  line-height: 1.5;
  color: ${HERO_MUTED};
  font-weight: 400;
  max-width: 20rem;

  @media (max-width: 768px) {
    order: 3;
    margin: 0 auto 10px;
    max-width: 22rem;
    text-align: center;
  }
`;

const TagsRowDesktop = styled.p`
  order: 2;
  margin: 0 0 10px;
  font-size: 13px;
  color: ${HERO_MUTED};
  line-height: 1.4;

  @media (max-width: 768px) {
    display: none;
  }
`;

/** Premium partner: compact rating under title / tags, above summary (matches review row stats). */
const HeroPremiumRatingStrip = styled.div`
  order: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin: 0 auto 10px;
  font-size: 13px;
  font-weight: 500;
  color: ${HERO_MUTED};
  line-height: 1.3;

  @media (max-width: 768px) {
    order: 2;
    margin: 0 auto 10px;
  }

  svg {
    flex-shrink: 0;
  }
`;

const HeroTagsDivider = styled.hr`
  display: none;
  border: none;
  border-top: 1px solid #ebebeb;
  margin: 0 auto 14px;
  width: 100%;
  max-width: 20rem;

  @media (min-width: 769px) {
    display: block;
    order: 3;
  }
`;

const TagsRowDot = styled.span`
  font-weight: 700;
  margin: 0 2px;
`;

const IconRowDesktop = styled.div`
  order: 5;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin-bottom: 0;

  @media (max-width: 768px) {
    display: none;
  }
`;

/** Desktop: below share/favorite icons + Ask the host row, before Hosted by / detail rows */
const DividerAfterHeroActionsDesktop = styled.hr`
  display: none;
  border: none;
  border-top: 1px solid #ebebeb;
  margin: 12px 0 14px;
  width: 100%;
  max-width: 22rem;

  @media (min-width: 769px) {
    display: block;
    order: 7;
    margin-inline: auto;
  }
`;

const MobileDividerAfterHero = styled.hr`
  display: none;
  border: none;
  border-top: 1px solid #ebebeb;
  margin: 22px 0 20px;

  @media (max-width: 768px) {
    display: block;
    order: 5;
    margin: 16px 0 18px;
  }
`;

const MobileDividerBeforeDescription = styled.hr`
  display: none;
  border: none;
  border-top: 1px solid #ebebeb;
  margin: 22px 0 20px;

  @media (max-width: 768px) {
    display: block;
    order: 7;
    margin: 20px 0 0;
  }
`;

const InfoRowsStack = styled.div`
  order: 8;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  text-align: left;

  @media (max-width: 768px) {
    order: 6;
  }
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const InfoRowIcon = styled.div`
  flex-shrink: 0;
  width: 54px;
  height: 54px;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;

  & > *,
  lord-icon {
    ${iconDropShadow}
  }
`;

/** Hero info row: elevation for emoji/sticker only (does not swap icon assets). */
const InfoRowEmojiWrap = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  line-height: 1;
  ${iconDropShadow}
`;

const InfoRowBody = styled.div`
  min-width: 0;
  flex: 1;
`;

const InfoRowTitle = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${HERO_TEXT};
  line-height: 1.35;
`;

const InfoRowSub = styled.div`
  font-size: 15px;
  color: ${HERO_MUTED};
  line-height: 1.1;
  margin-top: 1px;
`;

const HostAvatar = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #eaeaea;
  background: #f4f4f4;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HostAvatarImg = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AskRow = styled.div`
  order: 6;
  margin-top: 6px;
  text-align: center;

  @media (max-width: 768px) {
    order: 4;
    margin-top: 0;
    margin-bottom: 4px;
    display: flex;
    justify-content: center;
    text-align: center;
  }
`;

const AskLink = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 4px 0;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: #444;
  cursor: pointer;
  border-radius: 8px;
  text-decoration: underline;
  text-underline-offset: 3px;
  &:hover {
    color: #111;
  }
  &:focus-visible {
    outline: 2px solid ${CLASSEASILY_RED_ACCESSIBLE};
    outline-offset: 2px;
  }
  @media (max-width: 768px) {
    width: fit-content;
    max-width: calc(100% - 24px);
    margin: 0 auto;
    justify-content: center;
    padding: 6px 12px;
    min-height: 0;
    font-size: 13px;
    border: 1px solid #e8e8e8;
    border-radius: 999px;
    background: #fafafa;
  }
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 0.625rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: #222;
  transition: all 0.2s ease;
  text-decoration: underline;
  text-underline-offset: 2px;
  span {
    @media (max-width: 768px) {
      display: none;
    }
  }
  &:hover:not(:disabled) {
    background: #f7f7f7;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;
const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 24px;
    overflow: hidden;
    padding: 0;
  }
  .ant-modal-header {
    display: none;
  }
  .ant-modal-body {
    padding: 0;
  }
  .ant-modal-close {
    display: none;
  }
`;

// --- Share: Vaul drawer (mobile) ---
const ShareDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 999;
`;
const ShareDrawerContent = styled(Drawer.Content)`
  background: #fff;
  border-radius: 20px 20px 0 0;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  outline: none;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
`;
const ShareDrawerHandle = styled.div`
  width: 40px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

// --- Share: desktop modal & shared content ---
const ShareModalWrapper = styled.div`
  padding: 0;
  display: flex;
  flex-direction: column;
  max-height: 85vh;
`;
const ShareModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: #111;
    margin: 0;
    letter-spacing: -0.02em;
  }
`;
const ShareModalBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;
const CloseButton = styled.button`
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #555;
  transition: background-color 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
  &:hover {
    background-color: #f5f5f5;
    color: #111;
  }
  svg {
    ${iconDropShadow}
  }
`;
const ShareCopySection = styled.div`
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: #f8f8f8;
  border-radius: 12px;
  padding: 0.25rem;
  border: 1px solid #eee;
`;
const ShareCopyInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #222;
  font-family: inherit;
  min-width: 0;
  &::placeholder {
    color: #888;
  }
`;
const ShareCopyBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  border: none;
  background: #111;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.15s ease;
  white-space: nowrap;
  &:hover {
    opacity: 0.9;
    transform: scale(1.02);
  }
  &:active {
    transform: scale(0.98);
  }
  svg {
    ${iconDropShadow}
  }
`;
const ShareSectionLabel = styled.p`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #717171;
  margin: 0 0 0.75rem 0;
`;
const PlaceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  img {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    object-fit: cover;
  }
  p {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #111;
  }
`;
const ShareGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
`;
const ShareOptionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #222;
  text-decoration: none;
  font-weight: 500;
  background: #fff;
  width: 100%;
  text-align: left;
  font-family: inherit;
  font-size: 0.875rem;
  &:hover {
    background: #f8f8f8;
    border-color: #ddd;
  }
  svg {
    ${iconDropShadow}
  }
`;
const EmbedModalContent = styled.div`
  padding: 1rem;
  textarea {
    width: 100%;
    min-height: 120px;
    font-family: monospace;
  }
`;
const PlaceMeta = styled.div`
  font-size: 0.875rem;
  color: #717171;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  margin-top: 4px;
`;
const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;

  svg {
    ${iconDropShadow}
  }
`;

const HostRowButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin: 0;
  padding: 4px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  border-radius: 12px;
  transition: background 0.15s ease;
  &:hover:not(:disabled) {
    background: #fafafa;
  }
  &:focus-visible {
    outline: 2px solid ${CLASSEASILY_RED_ACCESSIBLE};
    outline-offset: 2px;
  }
  &:disabled {
    cursor: default;
    opacity: 0.75;
  }
`;

// --- Lightbox keyframes ---
const lbBgFadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const lbBgFadeOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`;

const lbClipShrink = keyframes`
  0%   { padding: 0px; }
  40%  { padding: 14px; }
  100% { padding: 0px; }
`;

const lbImgZoom = keyframes`
  0%   { transform: scale(1); }
  40%  { transform: scale(1.08); }
  100% { transform: scale(1); }
`;

// --- Lightbox styled components ---
const LightboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* Separate background layer — fades in on mount, fades out on close.
   Kept independent so the image container is never opacity-affected. */
const LightboxBg = styled.div`
  position: absolute;
  inset: 0;
  background: #ffffff;
  pointer-events: none;
  animation: ${lbBgFadeIn} 0.35s ease both;

  ${({ $fading }) =>
    $fading &&
    css`
      animation: ${lbBgFadeOut} 0.5s ease both;
    `}
`;

const LightboxImgContainer = styled.div`
  position: relative;
  flex-shrink: 0;
  will-change: transform, width, height;
  transform: translateZ(0);
  backface-visibility: hidden;
  /* Width/height transition only enabled when animating to/from the class-page bento grid */
  ${({ $resizeTransition }) =>
    $resizeTransition &&
    css`
      transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                  height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    `}

  ${({ $hiddenForGallery }) =>
    $hiddenForGallery &&
    css`
      opacity: 0;
    `}

  ${({ $fadeOnly }) =>
    $fadeOnly &&
    css`
      animation: ${lbBgFadeOut} 0.5s ease both;
    `}
`;

const LightboxImgClip = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 32px;
  overflow: hidden;
  box-sizing: border-box;
  transform: translateZ(0);
  backface-visibility: hidden;

  ${({ $navBurst }) =>
    $navBurst &&
    css`
      animation: ${lbClipShrink} 0.38s cubic-bezier(0.4, 0, 0.2, 1) both;
    `}
`;

const LightboxImgEl = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;

  ${({ $navBurst }) =>
    $navBurst &&
    css`
      animation: ${lbImgZoom} 0.38s cubic-bezier(0.4, 0, 0.2, 1) both;
    `}
`;

const lbUiFade = css`
  animation: ${lbBgFadeIn} 0.35s ease both;
  ${({ $fading }) =>
    $fading &&
    css`
      animation: ${lbBgFadeOut} 0.5s ease both;
    `}
`;

const LightboxCloseBtn = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: background 0.2s;
  ${lbUiFade}
  &:hover {
    background: rgba(0, 0, 0, 0.08);
  }
  svg {
    ${iconDropShadow}
  }
`;

const LightboxNavBtn = styled.button`
  position: fixed;
  top: 50%;
  ${({ $side }) =>
    $side === "left"
      ? css`
          left: clamp(8px, 2vw, 24px);
        `
      : css`
          right: clamp(8px, 2vw, 24px);
        `}
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: background 0.2s, transform 0.2s;
  ${lbUiFade}
  ${({ $busy }) =>
    $busy
      ? css`
          pointer-events: none;
          cursor: default;
          &:hover,
          &:active {
            background: transparent;
            transform: translateY(-50%);
          }
        `
      : css`
          &:hover {
            background: rgba(0, 0, 0, 0.08);
            transform: translateY(-50%) scale(1.08);
          }
          &:active {
            transform: translateY(-50%) scale(0.95);
          }
        `}
  transform: translateY(-50%);

  svg {
    ${iconDropShadow}
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

/* Row that holds [prev] [image] [next] side by side */
const LightboxRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
  max-width: calc(min(88vw, 82vh) + 120px);
  width: 100%;
  justify-content: center;

  /* During gallery→single FLIP the gallery stays mounted but hidden — paint on top */
  ${({ $elevate }) =>
    $elevate &&
    css`
      z-index: 4;
    `}

  ${({ $noPointer }) =>
    $noPointer &&
    css`
      pointer-events: none;
    `}
`;

const LightboxDots = styled.div`
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  align-items: center;
  z-index: 10;
  ${lbUiFade}
  ${({ $busy }) =>
    $busy &&
    css`
      pointer-events: none;
    `}
`;

const LightboxDot = styled.button`
  width: ${({ $active }) => ($active ? "22px" : "8px")};
  height: 8px;
  border-radius: 4px;
  border: none;
  background: ${({ $active }) => ($active ? "#111" : "rgba(0,0,0,0.2)")};
  cursor: pointer;
  padding: 0;
  transition: width 0.25s ease, background 0.25s ease;
  &:hover {
    background: ${({ $active }) =>
      $active ? "#111" : "rgba(0,0,0,0.35)"};
  }
`;

const LightboxCounter = styled.div`
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  font-weight: 500;
  color: #555;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 12px;
  border-radius: 20px;
  z-index: 10;
  ${lbUiFade}
  ${({ $busy }) =>
    $busy &&
    css`
      pointer-events: none;
    `}
`;

const AllImagesBtn = styled.button`
  position: fixed;
  top: 20px;
  left: 20px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 16px;
  border-radius: 24px;
  border: none;
  background: transparent;
  color: #111;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  z-index: 10;
  letter-spacing: -0.01em;
  transition: background 0.2s;
  ${lbUiFade}
  ${({ $locked }) =>
    $locked
      ? css`
          pointer-events: none;
          cursor: default;
          &:hover {
            background: transparent;
          }
        `
      : css`
          &:hover {
            background: rgba(0, 0, 0, 0.08);
          }
        `}
  svg {
    ${iconDropShadow}
  }
`;

/* --- Gallery view --- */
/* z-index: 2 so it sits above the always-rendered LightboxRow (z-index: 1).
   No fade-in animation — appears instantly so only the FLIP cell is seen flying. */
const GalleryScrollArea = styled.div`
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 76px 12px 48px;
  box-sizing: border-box;
  z-index: 2;
  background: #ffffff;

  @media (min-width: 769px) {
    padding: 76px 24px 48px;
  }

  /* Block all interaction during FLIP / stagger / exit-to-single */
  ${({ $inputLocked }) =>
    $inputLocked &&
    css`
      pointer-events: none;
    `}

  /* Fade out quickly when a gallery cell is tapped so the FLIP
     animation feels instant; 200ms is fast enough to not feel abrupt. */
  ${({ $exitPending }) =>
    $exitPending &&
    css`
      animation: ${lbBgFadeOut} 0.2s ease both;
      pointer-events: none;
    `}

  ${({ $fading }) =>
    $fading &&
    css`
      animation: ${lbBgFadeOut} 0.5s ease both;
      pointer-events: none;
    `}
`;

/* CSS-columns masonry: each cell flows naturally based on its image's aspect ratio.
   Images different sizes → no empty gaps as they pack vertically per column. */
const GalleryGrid = styled.div`
  column-count: 3;
  column-gap: 6px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 900px) {
    column-count: 2;
  }

  @media (max-width: 500px) {
    column-count: 2;
    column-gap: 4px;
  }
`;

const GalleryCell = styled.div`
  display: block;
  width: 100%;
  margin: 0 0 6px;
  overflow: hidden;
  border-radius: 14px;
  cursor: pointer;
  background: #f0f0f0;
  position: relative;
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  page-break-inside: avoid;
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
  /* aspect-ratio applied inline from loaded image dims — falls back to 1:1 pre-load */
  aspect-ratio: 1 / 1;
  /* Hidden by default — FLIP cell overrides to opacity:1, others reveal via stagger */
  opacity: 0;

  @media (max-width: 500px) {
    margin: 0 0 4px;
  }

  ${({ $hidden }) =>
    $hidden &&
    css`
      visibility: hidden;
    `}

  ${({ $isFlipCell }) =>
    $isFlipCell &&
    css`
      opacity: 1;
    `}

  ${({ $reveal, $animDelay, $isFlipCell }) =>
    $reveal &&
    !$isFlipCell &&
    css`
      animation: ${lbBgFadeIn} 0.3s ease both;
      animation-delay: ${$animDelay}s;
    `}

  ${({ $locked }) =>
    $locked
      ? css`
          cursor: default;
          pointer-events: none;
          &:hover {
            transform: none;
          }
        `
      : css`
          &:hover {
            transform: scale(0.98);
            transition: transform 0.15s;
          }
        `}
`;

const GalleryImg = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  transform: translateZ(0);
  backface-visibility: hidden;
`;

const OpeningFlipProxy = styled.div`
  position: fixed;
  z-index: 6;
  pointer-events: none;
  overflow: hidden;
  will-change: left, top, width, height, border-radius;
  transform: translateZ(0);
  backface-visibility: hidden;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
  }
`;

// Isolated so lightbox state changes don't re-render the bento images.
// gridRef is forwarded to HeroBentoGrid so the parent can look up cell elements by index.
const BentoGridInner = React.memo(
  React.forwardRef(function BentoGridInner(
    { imagesToDisplay, usePlaceholders, title, onImageClick },
    gridRef,
  ) {
    const bentoRaw =
      imagesToDisplay.length >= 4
        ? imagesToDisplay.slice(0, 4)
        : imagesToDisplay;
    const count = bentoRaw.length;
    return (
      <HeroBentoWrap>
        <HeroBentoGrid ref={gridRef} $count={count}>
          {bentoRaw.map((image, index) => {
          const imageUrl = usePlaceholders
            ? image
            : image?.large_url ||
              image?.medium_url ||
              image?.thumbnail_url ||
              (typeof image === "string" ? image : undefined);
          const isLcp = index === 0;
          return (
            <BentoCell
              key={index}
              onClick={(e) => onImageClick(index, e.currentTarget)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  onImageClick(index, e.currentTarget);
              }}
              aria-label={`View image ${index + 1} full screen`}
            >
              <BentoImageInner>
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={
                      isLcp
                        ? `${title || "Class"} - image 1`
                        : `Class image ${index + 1}`
                    }
                    fill
                    sizes="(max-width: 768px) 50vw, 42vw"
                    priority={isLcp}
                    style={{ objectFit: "cover" }}
                  />
                ) : null}
              </BentoImageInner>
            </BentoCell>
          );
          })}
        </HeroBentoGrid>
      </HeroBentoWrap>
    );
  }),
);

const ClassPageImagesTitle = React.memo(
  ({
    images,
    title,
    rating,
    business_name,
    location,
    isShareModalVisible,
    onShareModalClose,
    isFavorite,
    isTogglingFavorite,
    onFavoriteClick,
    onShareClick,
    /** If set, merged into the copied/shared URL (e.g. optionId & date deep links). */
    shareUrlQueryString = "",
    descriptionSummary = "",
    /** Under summary + mobile nav: city, state / province (same as location row title). */
    heroTagsLine = "",
    businessData = null,
    onBusinessClick,
    onContactHost,
    partnerTierName,
    reviewCount = 0,
    averageRating = 0,
    /** Location row: title = city/state; subtitle = supporting place line (mirrors other rows). */
    locationHeadline = "",
    locationSubline = "",
  }) => {
    const [isEmbedModalVisible, setIsEmbedModalVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [currentUrl, setCurrentUrl] = useState("");
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [isClosingLightbox, setIsClosingLightbox] = useState(false);
    const [closeFadeOnly, setCloseFadeOnly] = useState(false);
    const [navBurst, setNavBurst] = useState(false);
    const lightboxContainerRef = useRef(null);
    const lightboxClipRef = useRef(null);
    const lightboxImgInnerRef = useRef(null);
    const navBurstTimeout = useRef(null);
    const lightboxOpenedRef = useRef(false);
    const originCellRef = useRef(null);
    const bentoGridRef = useRef(null);
    const lightboxIndexRef = useRef(0);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryPhase, setGalleryPhase] = useState("idle"); // 'idle' | 'revealed'
    const [galleryOpening, setGalleryOpening] = useState(false);
    const [openingFlipProxy, setOpeningFlipProxy] = useState(null);
    const [galleryExitPending, setGalleryExitPending] = useState(false);
    const [lightboxFlipKey, setLightboxFlipKey] = useState(0);
    const galleryItemRefs = useRef([]);
    const preSingleRect = useRef(null);
    const lightboxFlipSourceRect = useRef(null);
    const galleryFlipDoneRef = useRef(false);
    const galleryFlipIdxRef = useRef(0);
    // Locked-in src for the flip cell so it never changes during exit (prevents flash).
    const galleryFlipSrcRef = useRef(null);
    const galleryExitTimerRef = useRef(null);
    const galleryExitSourceIdxRef = useRef(null); // which gallery cell triggered the exit
    const touchStartRef = useRef(null);
    const [lightboxResized, setLightboxResized] = useState(false);
    const [resizeTransition, setResizeTransition] = useState(false);
    const lightboxResizeTimerRef = useRef(null);
    const pendingOpenResizeIdxRef = useRef(null);
    const [imageDims, setImageDims] = useState({});
    const imageDimsRef = useRef({});
    const [windowDim, setWindowDim] = useState(() =>
      typeof window === "undefined"
        ? { w: 1280, h: 800 }
        : { w: window.innerWidth, h: window.innerHeight },
    );

    useEffect(() => {
      if (typeof window === "undefined") return;
      if (!shareUrlQueryString) {
        setCurrentUrl(window.location.href);
        return;
      }
      const u = new URL(window.location.href);
      const extra = new URLSearchParams(shareUrlQueryString);
      extra.forEach((v, k) => {
        if (v) u.searchParams.set(k, v);
      });
      setCurrentUrl(u.toString());
    }, [shareUrlQueryString]);
    useEffect(() => {
      const check = () => {
        setIsMobile(window.innerWidth <= 768);
        setWindowDim({ w: window.innerWidth, h: window.innerHeight });
      };
      check();
      window.addEventListener("resize", check);
      return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
      imageDimsRef.current = imageDims;
    }, [imageDims]);

    const classImages =
      Array.isArray(images) && images.length > 0 ? images : [];
    const usePlaceholders = classImages.length === 0;

    const imagesToDisplay = usePlaceholders ? PLACEHOLDER_IMAGES : classImages;

    const resolveImageUrl = (img, preferSmaller = false) => {
      if (!img) return "";
      if (typeof img === "string") return img;
      if (preferSmaller) {
        return img.thumbnail_url || img.medium_url || img.large_url || "";
      }
      return img.large_url || img.medium_url || img.thumbnail_url || "";
    };

    const lightboxImageUrl = resolveImageUrl(imagesToDisplay[lightboxIndex]);

    const preloadImage = useCallback((src) => {
      if (typeof window === "undefined" || !src) return Promise.resolve();
      return new Promise((resolve) => {
        const img = new window.Image();
        const done = () => resolve();
        img.onload = done;
        img.onerror = done;
        img.src = src;
        if (img.complete) done();
      });
    }, []);

    const preloadImageWithSize = useCallback((src) => {
      if (typeof window === "undefined" || !src) return Promise.resolve(null);
      return new Promise((resolve) => {
        const img = new window.Image();
        const getDim = () =>
          img.naturalWidth && img.naturalHeight
            ? { width: img.naturalWidth, height: img.naturalHeight }
            : null;
        img.onload = () => resolve(getDim());
        img.onerror = () => resolve(null);
        img.src = src;
        if (img.complete && img.naturalWidth) resolve(getDim());
      });
    }, []);

    const ensureImageDim = useCallback(
      async (idx) => {
        const existing = imageDimsRef.current[idx];
        if (existing) return existing;
        const imgObj = imagesToDisplay[idx];
        const src =
          typeof imgObj === "string"
            ? imgObj
            : imgObj?.thumbnail_url ||
              imgObj?.medium_url ||
              imgObj?.large_url ||
              "";
        if (!src) return null;
        const dim = await preloadImageWithSize(src);
        if (dim) {
          imageDimsRef.current = { ...imageDimsRef.current, [idx]: dim };
          setImageDims((prev) =>
            prev[idx] ? prev : { ...prev, [idx]: dim },
          );
        }
        return dim;
      },
      [imagesToDisplay, preloadImageWithSize],
    );

    /* Compute single-lightbox container sizes.
       squareSize: used during open/close FLIP (keeps origin-cell aspect).
       naturalSize: transitioned to AFTER FLIP lands (or during index change). */
    const { squareSize, naturalSize } = (() => {
      const dim = imageDims[lightboxIndex];
      const { w: winW, h: winH } = windowDim;
      const maxW = Math.min(winW * 0.92, 1200);
      const maxH = winH * 0.82;
      const sq = Math.min(maxW, maxH);
      const square = { width: sq, height: sq };
      if (!dim) return { squareSize: square, naturalSize: square };
      const ar = dim.width / dim.height;
      const natural =
        maxW / ar <= maxH
          ? { width: maxW, height: maxW / ar }
          : { width: maxH * ar, height: maxH };
      return { squareSize: square, naturalSize: natural };
    })();
    const lightboxBoxSize = lightboxResized ? naturalSize : squareSize;

    const triggerNavBurst = useCallback(() => {
      [lightboxClipRef, lightboxImgInnerRef].forEach((ref) => {
        if (!ref.current) return;
        ref.current.style.animation = "none";
        void ref.current.offsetWidth;
        ref.current.style.animation = "";
      });
      setNavBurst(true);
      if (navBurstTimeout.current) clearTimeout(navBurstTimeout.current);
      navBurstTimeout.current = setTimeout(() => setNavBurst(false), 420);
    }, []);

    const kickoffOpenNaturalResize = useCallback((targetIdx) => {
      setResizeTransition(true);
      const startedAt =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const maxWaitMs = 1800;

      const applyNaturalResize = () => {
        // Give React one full paint with transition enabled before size change.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setLightboxResized(true);
            // Disable transition once resize settles so nav remains instant.
            setTimeout(() => setResizeTransition(false), 420);
          });
        });
      };

      const waitForDimThenResize = () => {
        if (!lightboxContainerRef.current) {
          setResizeTransition(false);
          return;
        }
        if (lightboxIndexRef.current !== targetIdx) {
          setResizeTransition(false);
          return;
        }
        if (imageDimsRef.current[targetIdx]) {
          applyNaturalResize();
          return;
        }
        const now =
          typeof performance !== "undefined" ? performance.now() : Date.now();
        if (now - startedAt >= maxWaitMs) {
          // Fallback: don't hang forever on broken/missing images.
          applyNaturalResize();
          return;
        }
        requestAnimationFrame(waitForDimThenResize);
      };

      waitForDimThenResize();
    }, []);

    const openLightbox = useCallback(
      async (index, cellEl) => {
        originCellRef.current = cellEl;
        setLightboxIndex(index);
        setIsClosingLightbox(false);
        setCloseFadeOnly(false);
        setLightboxResized(false);
        if (lightboxResizeTimerRef.current) {
          clearTimeout(lightboxResizeTimerRef.current);
          lightboxResizeTimerRef.current = null;
        }
        pendingOpenResizeIdxRef.current = null;
        if (!imageDimsRef.current[index]) {
          await Promise.race([
            ensureImageDim(index),
            new Promise((r) => setTimeout(r, 600)),
          ]);
        }
        setLightboxOpen(true);
        // Resize after open FLIP fully settles (triggered from open FLIP effect).
        pendingOpenResizeIdxRef.current = index;
      },
      [ensureImageDim],
    );

    const closeLightbox = useCallback(() => {
      if (galleryExitTimerRef.current) {
        clearTimeout(galleryExitTimerRef.current);
        galleryExitTimerRef.current = null;
      }
      if (lightboxResizeTimerRef.current) {
        clearTimeout(lightboxResizeTimerRef.current);
        lightboxResizeTimerRef.current = null;
      }
      pendingOpenResizeIdxRef.current = null;
      setResizeTransition(false);
      setGalleryExitPending(false);

      const el = lightboxContainerRef.current;
      const idx = lightboxIndexRef.current;
      const bentoLen = Math.min(imagesToDisplay.length, 4);
      const matchingBento =
        idx < bentoLen ? bentoGridRef.current?.children[idx] : null;

      // Fade-only when: gallery is open, no matching bento cell, or refs missing.
      const fadeOnly = galleryOpen || !el || !matchingBento;

      setCloseFadeOnly(fadeOnly);
      setIsClosingLightbox(true);

      if (fadeOnly) {
        setLightboxResized(false);
        setTimeout(() => {
          setLightboxOpen(false);
          lightboxOpenedRef.current = false;
          setIsClosingLightbox(false);
          setCloseFadeOnly(false);
        }, 500);
        return;
      }

      // Step 1: if container is at natural aspect, shrink back to square first
      // so the FLIP uses uniform scale (no distortion on the way out).
      const doFlip = () => {
        const originRect = matchingBento.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const scale = Math.min(
          originRect.width / elRect.width,
          originRect.height / elRect.height,
        );
        const dx =
          originRect.left + originRect.width / 2 -
          (elRect.left + elRect.width / 2);
        const dy =
          originRect.top + originRect.height / 2 -
          (elRect.top + elRect.height / 2);
        el.style.transition =
          "transform 0.45s cubic-bezier(0.4,0,0.6,1), border-radius 0.45s cubic-bezier(0.4,0,0.6,1)";
        el.style.transform = `translate(${dx}px,${dy}px) scale(${scale})`;
        el.style.borderRadius = "9px";
        setTimeout(() => {
          setLightboxOpen(false);
          lightboxOpenedRef.current = false;
          setIsClosingLightbox(false);
          setCloseFadeOnly(false);
          setLightboxResized(false);
        }, 460);
      };

      if (lightboxResized) {
        // Enable transition, shrink to square, then FLIP
        setResizeTransition(true);
        setLightboxResized(false);
        setTimeout(() => {
          setResizeTransition(false);
          doFlip();
        }, 320);
      } else {
        doFlip();
      }
    }, [galleryOpen, imagesToDisplay.length, lightboxResized]);

    // Keep a ref in sync so goNext/goPrev can read current index without adding it to deps
    useEffect(() => {
      lightboxIndexRef.current = lightboxIndex;
    }, [lightboxIndex]);

    const goNext = useCallback(() => {
      const newIdx =
        (lightboxIndexRef.current + 1) % imagesToDisplay.length;
      const cell = bentoGridRef.current?.children[newIdx];
      if (cell) originCellRef.current = cell;
      triggerNavBurst();
      setLightboxIndex(newIdx);
      // Keep lightboxResized=true so container instantly snaps to new natural size
      ensureImageDim(newIdx);
    }, [triggerNavBurst, imagesToDisplay.length, ensureImageDim]);

    const goPrev = useCallback(() => {
      const newIdx =
        (lightboxIndexRef.current - 1 + imagesToDisplay.length) %
        imagesToDisplay.length;
      const cell = bentoGridRef.current?.children[newIdx];
      if (cell) originCellRef.current = cell;
      triggerNavBurst();
      setLightboxIndex(newIdx);
      ensureImageDim(newIdx);
    }, [triggerNavBurst, imagesToDisplay.length, ensureImageDim]);

    useLayoutEffect(() => {
      if (!lightboxOpen) {
        lightboxOpenedRef.current = false;
        return;
      }
      if (lightboxOpenedRef.current) return;
      lightboxOpenedRef.current = true;
      const el = lightboxContainerRef.current;
      const originEl = originCellRef.current;
      if (!el || !originEl) return;
      const originRect = originEl.getBoundingClientRect();
      const finalRect = el.getBoundingClientRect();
      // Uniform scale: container is square on open FLIP so no distortion
      const scale = Math.min(
        originRect.width / finalRect.width,
        originRect.height / finalRect.height,
      );
      const dx =
        originRect.left + originRect.width / 2 -
        (finalRect.left + finalRect.width / 2);
      const dy =
        originRect.top + originRect.height / 2 -
        (finalRect.top + finalRect.height / 2);
      el.style.transition = "none";
      el.style.transform = `translate(${dx}px,${dy}px) scale(${scale})`;
      el.style.borderRadius = "9px";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition =
            "transform 0.65s cubic-bezier(0.4,0,0.2,1), border-radius 0.65s cubic-bezier(0.4,0,0.2,1)";
          el.style.transform = "";
          el.style.borderRadius = "32px";
          // Clear inline transition after FLIP so the CSS rule
          // (width/height 0.35s) takes over for the aspect-ratio resize.
          setTimeout(() => {
            el.style.transition = "";
            const pendingIdx = pendingOpenResizeIdxRef.current;
            if (
              pendingIdx != null &&
              pendingIdx === lightboxIndexRef.current
            ) {
              pendingOpenResizeIdxRef.current = null;
              kickoffOpenNaturalResize(pendingIdx);
            }
          }, 680);
        });
      });
    }, [lightboxOpen, kickoffOpenNaturalResize]);

    useEffect(() => {
      if (!lightboxOpen) return;
      const handleKey = (e) => {
        const galleryBlocked =
          galleryExitPending ||
          (galleryOpen && galleryPhase !== "revealed");
        if (galleryBlocked && e.key !== "Escape") return;
        if (e.key === "Escape") closeLightbox();
        else if (e.key === "ArrowRight") goNext();
        else if (e.key === "ArrowLeft") goPrev();
      };
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }, [
      lightboxOpen,
      galleryOpen,
      galleryPhase,
      galleryExitPending,
      closeLightbox,
      goNext,
      goPrev,
    ]);

    useEffect(() => {
      if (!lightboxOpen) {
        setGalleryOpening(false);
        setOpeningFlipProxy(null);
      }
    }, [lightboxOpen]);

    useEffect(() => {
      if (galleryPhase === "revealed" || galleryExitPending || !galleryOpen) {
        setOpeningFlipProxy(null);
      }
    }, [galleryPhase, galleryExitPending, galleryOpen]);

    /* Gallery masonry reflows as its images load and column heights change,
       so the FLIP target cell can move. Whenever any gallery image finishes
       loading, re-measure the target and update the proxy endpoint so the
       transition smoothly tracks to its final resting position. */
    const recalibrateOpeningFlipTarget = useCallback(
      (loadedIdx) => {
        if (galleryPhase === "revealed" || galleryExitPending) return;
        const idx = galleryFlipIdxRef.current;
        const galleryEl = galleryItemRefs.current[idx];
        if (!galleryEl) return;
        const finalRect = galleryEl.getBoundingClientRect();
        setOpeningFlipProxy((prev) => {
          if (!prev || !prev.transitioning) return prev;
          if (
            prev.left === finalRect.left &&
            prev.top === finalRect.top &&
            prev.width === finalRect.width &&
            prev.height === finalRect.height
          ) {
            return prev;
          }
          return {
            ...prev,
            left: finalRect.left,
            top: finalRect.top,
            width: finalRect.width,
            height: finalRect.height,
          };
        });
      },
      [galleryPhase, galleryExitPending],
    );

    // Preload natural dimensions for all images when the lightbox opens,
    // so single-view sizing and masonry aspect ratios are instantly correct.
    useEffect(() => {
      if (!lightboxOpen) return;
      imagesToDisplay.forEach((_, i) => {
        ensureImageDim(i);
      });
    }, [lightboxOpen, imagesToDisplay, ensureImageDim]);

    // Scroll lock while lightbox is open (desktop + mobile, iOS-safe).
    // Uses position: fixed so iOS Safari actually stops the page from scrolling.
    useEffect(() => {
      if (!lightboxOpen || typeof window === "undefined") return;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const { body, documentElement: html } = document;
      const prev = {
        bodyOverflow: body.style.overflow,
        bodyPosition: body.style.position,
        bodyTop: body.style.top,
        bodyWidth: body.style.width,
        htmlOverflow: html.style.overflow,
        htmlOverscroll: html.style.overscrollBehavior,
      };
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.width = "100%";
      html.style.overflow = "hidden";
      html.style.overscrollBehavior = "none";
      return () => {
        body.style.overflow = prev.bodyOverflow;
        body.style.position = prev.bodyPosition;
        body.style.top = prev.bodyTop;
        body.style.width = prev.bodyWidth;
        html.style.overflow = prev.htmlOverflow;
        html.style.overscrollBehavior = prev.htmlOverscroll;
        window.scrollTo(0, scrollY);
      };
    }, [lightboxOpen]);

    // Swipe navigation for the single image view (touch only; mouse uses arrows).
    const onLightboxTouchStart = useCallback(
      (e) => {
        if (galleryOpen) return;
        if (!e.touches || e.touches.length !== 1) return;
        const t = e.touches[0];
        touchStartRef.current = {
          x: t.clientX,
          y: t.clientY,
          time: Date.now(),
        };
      },
      [galleryOpen],
    );

    const onLightboxTouchEnd = useCallback(
      (e) => {
        const start = touchStartRef.current;
        touchStartRef.current = null;
        if (!start || galleryOpen) return;
        if (galleryExitPending || isClosingLightbox) return;
        const end = e.changedTouches?.[0];
        if (!end) return;
        const dx = end.clientX - start.x;
        const dy = end.clientY - start.y;
        const dt = Date.now() - start.time;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (dt > 700) return;
        if (absDx < 40 || absDx < absDy) return;
        if (imagesToDisplay.length <= 1) return;
        if (dx < 0) goNext();
        else goPrev();
      },
      [
        galleryOpen,
        galleryExitPending,
        isClosingLightbox,
        imagesToDisplay.length,
        goNext,
        goPrev,
      ],
    );

    // Reusable helper: apply a FLIP from sourceRect to the lightbox container's current position.
    // Uses uniform scale so there's no image distortion (container is square at this point).
    const flipLightboxContainerFrom = useCallback((sourceRect) => {
      const el = lightboxContainerRef.current;
      if (!el || !sourceRect) return;
      const finalRect = el.getBoundingClientRect();
      const scale = Math.min(
        sourceRect.width / finalRect.width,
        sourceRect.height / finalRect.height,
      );
      const dx =
        sourceRect.left + sourceRect.width / 2 -
        (finalRect.left + finalRect.width / 2);
      const dy =
        sourceRect.top + sourceRect.height / 2 -
        (finalRect.top + finalRect.height / 2);
      el.style.transition = "none";
      el.style.transform = `translate(${dx}px,${dy}px) scale(${scale})`;
      el.style.borderRadius = "14px";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition =
            "transform 0.6s cubic-bezier(0.4,0,0.2,1), border-radius 0.6s cubic-bezier(0.4,0,0.2,1)";
          el.style.transform = "";
          el.style.borderRadius = "32px";
          // After FLIP lands, clear inline transition and snap to natural size
          // (no width/height animation — user is already inside the lightbox).
          setTimeout(() => {
            el.style.transition = "";
            setLightboxResized(true);
          }, 620);
        });
      });
    }, []);

    // Reset gallery when lightbox fully closes
    useEffect(() => {
      if (lightboxOpen) return;
      if (galleryExitTimerRef.current) {
        clearTimeout(galleryExitTimerRef.current);
        galleryExitTimerRef.current = null;
      }
      setGalleryOpen(false);
      setGalleryExitPending(false);
      setGalleryPhase("idle");
      galleryFlipDoneRef.current = false;
    }, [lightboxOpen]);

    const finishGalleryExit = useCallback(() => {
      setGalleryOpen(false);
      setGalleryExitPending(false);
      setGalleryPhase("idle");
      galleryFlipDoneRef.current = false;
      galleryExitTimerRef.current = null;
      galleryExitSourceIdxRef.current = null;
    }, []);

    // Gallery open: snapshot lightbox position, record which cell will fly.
    // Ensures ALL gallery image dimensions are loaded first so every masonry
    // cell can render with its final aspect-ratio and the FLIP target rect
    // stays stable (doesn't drift off-screen as images load in).
    const openGallery = useCallback(async () => {
      if (galleryExitTimerRef.current) {
        clearTimeout(galleryExitTimerRef.current);
        galleryExitTimerRef.current = null;
      }
      if (galleryOpening) return;
      setGalleryExitPending(false);
      if (lightboxContainerRef.current) {
        preSingleRect.current =
          lightboxContainerRef.current.getBoundingClientRect();
      }
      galleryFlipDoneRef.current = false;
      const idx = lightboxIndexRef.current;
      galleryFlipIdxRef.current = idx;
      // Lock in the flip cell's src now so it never changes during exit.
      galleryFlipSrcRef.current = resolveImageUrl(imagesToDisplay[idx], true);
      setGalleryPhase("idle");
      setGalleryOpening(true);

      await Promise.race([
        Promise.all(imagesToDisplay.map((_, i) => ensureImageDim(i))),
        new Promise((r) => setTimeout(r, 1500)),
      ]);

      if (typeof window === "undefined") {
        setGalleryOpen(true);
        setGalleryOpening(false);
        return;
      }
      requestAnimationFrame(() => {
        setGalleryOpen(true);
        setGalleryOpening(false);
      });
    }, [galleryOpening, imagesToDisplay, ensureImageDim]);

    // Gallery close without selecting a new image (back button)
    const closeGallery = useCallback(() => {
      if (galleryExitTimerRef.current) return;
      // Don't interrupt the open FLIP / stagger
      if (galleryPhase !== "revealed") return;
      const idx = lightboxIndexRef.current;
      const galleryCell = galleryItemRefs.current[idx];
      if (galleryCell) {
        lightboxFlipSourceRect.current = galleryCell.getBoundingClientRect();
      }
      // Clear the opening proxy immediately so stale imagery can't flash on exit.
      setOpeningFlipProxy(null);
      setGalleryExitPending(true);
      setLightboxFlipKey((k) => k + 1);
      galleryExitTimerRef.current = setTimeout(finishGalleryExit, 680);
    }, [galleryPhase, finishGalleryExit]);

    // Select an image from the gallery — FLIP to single, then unmount gallery
    const selectFromGallery = useCallback(
      async (index) => {
        if (galleryExitTimerRef.current) return;
        if (galleryPhase !== "revealed") return;
        if (!imageDimsRef.current[index]) {
          await Promise.race([
            ensureImageDim(index),
            new Promise((r) => setTimeout(r, 400)),
          ]);
        }
        const galleryCell = galleryItemRefs.current[index];
        if (galleryCell) {
          lightboxFlipSourceRect.current = galleryCell.getBoundingClientRect();
        }
        const bentoCell = bentoGridRef.current?.children[index];
        if (bentoCell) originCellRef.current = bentoCell;
        // Record the source cell index BEFORE lightboxIndex updates so
        // hideForExit hides the right cell (the one that was clicked).
        galleryExitSourceIdxRef.current = index;
        // Exit FLIP should track the newly selected gallery cell, not the
        // previously selected image from gallery-open time.
        galleryFlipIdxRef.current = index;
        galleryFlipSrcRef.current = resolveImageUrl(imagesToDisplay[index], true);
        // Clear opening proxy in the same tick to prevent stale one-frame swaps.
        setOpeningFlipProxy(null);
        setGalleryExitPending(true);
        setLightboxIndex(index);
        setLightboxFlipKey((k) => k + 1);
        galleryExitTimerRef.current = setTimeout(finishGalleryExit, 680);
      },
      [
        galleryPhase,
        finishGalleryExit,
        ensureImageDim,
        imagesToDisplay,
        resolveImageUrl,
      ],
    );

    // After the FLIP animation finishes, reveal all other cells with stagger
    useEffect(() => {
      if (!galleryOpen) {
        setGalleryPhase("idle");
        return;
      }
      // FLIP duration is 0.6s — start reveals just after it completes
      const t = setTimeout(() => setGalleryPhase("revealed"), 640);
      return () => clearTimeout(t);
    }, [galleryOpen]);

    // FLIP: gallery cell → lightbox center (runs when lightboxFlipKey increments)
    useLayoutEffect(() => {
      if (!lightboxFlipKey) return;
      flipLightboxContainerFrom(lightboxFlipSourceRect.current);
    }, [lightboxFlipKey, flipLightboxContainerFrom]);

    // FLIP: lightbox center → gallery cell (runs when galleryOpen becomes true)
    useLayoutEffect(() => {
      if (!galleryOpen) {
        galleryFlipDoneRef.current = false;
        return;
      }
      if (galleryFlipDoneRef.current) return;
      galleryFlipDoneRef.current = true;
      const idx = lightboxIndexRef.current;
      const galleryEl = galleryItemRefs.current[idx];
      const sourceRect = preSingleRect.current;
      if (!galleryEl || !sourceRect) return;
      const finalRect = galleryEl.getBoundingClientRect();
      const proxySrc =
        lightboxImageUrl || resolveImageUrl(imagesToDisplay[idx], true);
      setOpeningFlipProxy({
        src: proxySrc,
        left: sourceRect.left,
        top: sourceRect.top,
        width: sourceRect.width,
        height: sourceRect.height,
        borderRadius: 50,
        transitioning: false,
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setOpeningFlipProxy((prev) =>
            prev
              ? {
                  ...prev,
                  left: finalRect.left,
                  top: finalRect.top,
                  width: finalRect.width,
                  height: finalRect.height,
                  borderRadius: 14,
                  transitioning: true,
                }
              : prev,
          );
        });
      });
    }, [galleryOpen, lightboxImageUrl, imagesToDisplay, resolveImageUrl]);

    const bentoImagesRaw =
      imagesToDisplay.length >= 4
        ? imagesToDisplay.slice(0, 4)
        : imagesToDisplay;
    const bentoCount = bentoImagesRaw.length;
    const sharePreviewSrc =
      imagesToDisplay[0]?.thumbnail_url ||
      imagesToDisplay[0]?.medium_url ||
      (typeof imagesToDisplay[0] === "string" ? imagesToDisplay[0] : null);

    const embedCode = `<iframe src="${currentUrl}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`;

    const handleCopyToClipboard = (text, successMessage) => {
      navigator.clipboard
        .writeText(text)
        .then(() => message.success(successMessage));
    };

    const router = useRouter();
    const handleBack = useCallback(() => {
      if (typeof window === "undefined") return;
      if (window.history.length > 1) {
        router.back();
        return;
      }
      router.push("/");
    }, [router]);

    const displayBusinessName =
      businessData?.businessName || business_name || "Host";
    const displayBusinessImage =
      businessData?.business_image_medium_url || null;
    const hostingDuration = calculateHostingDuration(businessData?.createdAt);
    const shouldShowTopRated = averageRating >= 4.5 && reviewCount >= 5;

    const tierKey = String(partnerTierName ?? "").trim().toLowerCase();

    let partnerBadgeLabel = null;
    let partnerSubtitle =
      "Trusted organizations that list and run classes on Classeasily.";
    if (tierKey === "founding partner") {
      partnerBadgeLabel = "Classeasily Partner";
      partnerSubtitle =
        "Founding partners helped shape Classeasily and meet elevated listing standards.";
    } else if (tierKey === "premium partner") {
      partnerBadgeLabel = "Premium Partner";
      partnerSubtitle =
        "Premium partners are vetted and provide exceptional experiences.";
    }

    const row2Title = partnerBadgeLabel
      ? partnerBadgeLabel
      : "Verified listing";
    const row2Sub = partnerBadgeLabel
      ? partnerSubtitle
      : "Every host and class listing is reviewed by our team.";

    const cleanLocStr = (v) => {
      if (v == null) return "";
      const s = String(v).trim();
      if (!s || s === "undefined") return "";
      return s;
    };
    const locTitle = "Located in";
    const locPlaceLine = cleanLocStr(locationHeadline);
    const locSub = locPlaceLine || null;

    const reviewTitle =
      reviewCount > 0
        ? `${reviewCount} review${reviewCount !== 1 ? "s" : ""}${
            averageRating > 0
              ? ` · ${Number(averageRating).toFixed(1)} avg`
              : ""
          }`
        : averageRating > 0
          ? `${Number(averageRating).toFixed(1)} avg rating`
          : "Vetted by ClassEasily";

    const credSubtitle =
      [
        hostingDuration ? `${hostingDuration} on Classeasily` : null,
        shouldShowTopRated ? "Top rated with learners" : null,
      ]
        .filter(Boolean)
        .join(" · ") || "See what makes this class a favorite.";

    const tagsParts = heroTagsLine
      ? heroTagsLine
          .split(/\s*[\u00b7]\s*/)
          .map((s) => s.trim())
          .filter((s) => s && s !== "undefined")
      : [];

    const showPremiumHeroRatingStrip = tierKey === "premium partner";

    /** Match `ClassReviews` reviewsHeading (same props as initialRating / initialReviewCount). */
    const premiumHeroRatingText = showPremiumHeroRatingStrip
      ? (() => {
          const r = Number(averageRating ?? rating ?? 0);
          const safeRating = Number.isFinite(r) ? r.toFixed(1) : "0.0";
          const c = Number(reviewCount ?? 0);
          const safeCount = Number.isFinite(c) ? c : 0;
          return `${safeRating} · ${safeCount} ${
            safeCount === 1 ? "review" : "reviews"
          }`;
        })()
      : "";

    const hostSubParts = [];
    if (hostingDuration) hostSubParts.push(`${hostingDuration} hosting`);
    if (reviewCount > 0)
      hostSubParts.push(
        `${reviewCount} review${reviewCount !== 1 ? "s" : ""}`,
      );
    const hostSubtitle =
      hostSubParts.join(" · ") ||
      "Message the host anytime before you book.";

    const galleryInputLocked =
      galleryOpening ||
      galleryExitPending ||
      (galleryOpen && galleryPhase !== "revealed");
    const allImagesLocked =
      galleryOpening || (galleryOpen && galleryPhase !== "revealed");
    const hasOpeningFlipProxy = Boolean(openingFlipProxy?.src);

    return (
      <MainContent>
        <HeroFullBleed>
          <HeroDesktopRow>
            <HeroPhotoColumn>
              <MobileTopNav aria-label="Class toolbar">
                <MobileNavBack
                  type="button"
                  onClick={handleBack}
                  aria-label="Back to previous page"
                >
                  <ArrowLeft size={20} />
                </MobileNavBack>
                <MobileNavTitle>{title || "Class"}</MobileNavTitle>
                <MobileNavIcons>
                  <StrokeIconBtn
                    type="button"
                    onClick={onShareClick}
                    aria-label="Share this class"
                  >
                    <Share2 size={18} strokeWidth={1.75} />
                  </StrokeIconBtn>
                  <StrokeIconBtn
                    type="button"
                    onClick={onFavoriteClick}
                    disabled={isTogglingFavorite}
                    aria-label={
                      isFavorite
                        ? "Remove from favorites"
                        : "Save to favorites"
                    }
                  >
                    <Heart
                      size={18}
                      strokeWidth={1.75}
                      fill={
                        isFavorite ? CLASSEASILY_RED_ACCESSIBLE : "none"
                      }
                      color={
                        isFavorite ? CLASSEASILY_RED_ACCESSIBLE : "#222"
                      }
                    />
                  </StrokeIconBtn>
                </MobileNavIcons>
              </MobileTopNav>

              <BentoGridInner
                ref={bentoGridRef}
                imagesToDisplay={imagesToDisplay}
                usePlaceholders={usePlaceholders}
                title={title}
                onImageClick={openLightbox}
              />
            </HeroPhotoColumn>

            <HeroContentColumn>
              <HeroContentInner>
                {title ? <HeroTitle>{title}</HeroTitle> : null}

                {tagsParts.length > 0 ? (
                  <TagsRowDesktop>
                    {tagsParts.map((part, i) => (
                      <React.Fragment key={`${part}-${i}`}>
                        {i > 0 ? <TagsRowDot>·</TagsRowDot> : null}
                        {part}
                      </React.Fragment>
                    ))}
                  </TagsRowDesktop>
                ) : null}

                {showPremiumHeroRatingStrip ? (
                  <HeroPremiumRatingStrip>
                    <Star
                      size={13}
                      fill="#FFB400"
                      color="#FFB400"
                      strokeWidth={0}
                      aria-hidden
                    />
                    <span>{premiumHeroRatingText}</span>
                  </HeroPremiumRatingStrip>
                ) : null}

                {descriptionSummary ? (
                  <HeroSummary>{descriptionSummary}</HeroSummary>
                ) : null}

                <IconRowDesktop>
                  <StrokeIconBtn
                    type="button"
                    onClick={onShareClick}
                    aria-label="Share this class"
                  >
                    <Share2 size={18} strokeWidth={1.75} />
                  </StrokeIconBtn>
                  <StrokeIconBtn
                    type="button"
                    onClick={onFavoriteClick}
                    disabled={isTogglingFavorite}
                    aria-label={
                      isFavorite
                        ? "Remove from favorites"
                        : "Save to favorites"
                    }
                  >
                    <Heart
                      size={18}
                      strokeWidth={1.75}
                      fill={isFavorite ? CLASSEASILY_RED_ACCESSIBLE : "none"}
                      color={
                        isFavorite ? CLASSEASILY_RED_ACCESSIBLE : "#222"
                      }
                    />
                  </StrokeIconBtn>
                </IconRowDesktop>

                {onContactHost && businessData ? (
                  <AskRow>
                    <AskLink type="button" onClick={onContactHost}>
                      Ask the host a question
                    </AskLink>
                  </AskRow>
                ) : null}

                <DividerAfterHeroActionsDesktop aria-hidden />

                <MobileDividerAfterHero aria-hidden />

                <InfoRowsStack>
                  {businessData && onBusinessClick ? (
                    <HostRowButton
                      type="button"
                      onClick={onBusinessClick}
                      disabled={!businessData}
                      aria-label={`View details for ${displayBusinessName}`}
                    >
                      <InfoRowIcon aria-hidden>
                        {displayBusinessImage ? (
                          <HostAvatar>
                            <HostAvatarImg src={displayBusinessImage} alt="" />
                          </HostAvatar>
                        ) : (
                          <HostAvatar>
                            <MessageCircle size={22} color="#9ca3af" />
                          </HostAvatar>
                        )}
                      </InfoRowIcon>
                      <InfoRowBody>
                        <InfoRowTitle>
                          Hosted by {displayBusinessName}
                        </InfoRowTitle>
                        <InfoRowSub>{hostSubtitle}</InfoRowSub>
                      </InfoRowBody>
                    </HostRowButton>
                  ) : (
                    <InfoRow>
                      <InfoRowIcon aria-hidden>
                        {displayBusinessImage ? (
                          <HostAvatar>
                            <HostAvatarImg src={displayBusinessImage} alt="" />
                          </HostAvatar>
                        ) : (
                          <HostAvatar>
                            <MessageCircle size={22} color="#9ca3af" />
                          </HostAvatar>
                        )}
                      </InfoRowIcon>
                      <InfoRowBody>
                        <InfoRowTitle>
                          Hosted by {displayBusinessName}
                        </InfoRowTitle>
                        <InfoRowSub>{hostSubtitle}</InfoRowSub>
                      </InfoRowBody>
                    </InfoRow>
                  )}

                  <InfoRow>
                    <InfoRowIcon aria-hidden>
                      {partnerBadgeLabel ? (
                        <LordIcon
                          src={PARTNER_LORD_ICON}
                          trigger="in"
                          playOnLoad
                          inState="in-reveal"
                          colors="primary:#b45309,secondary:#fbbf24"
                          size="42px"
                        />
                      ) : (
                        <svg
                          width={32}
                          height={32}
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden
                        >
                          <path
                            d="M9 12L11 14L15.5 9.5M17.9012 4.99851C18.1071 5.49653 18.5024 5.8924 19.0001 6.09907L20.7452 6.82198C21.2433 7.02828 21.639 7.42399 21.8453 7.92206C22.0516 8.42012 22.0516 8.97974 21.8453 9.47781L21.1229 11.2218C20.9165 11.7201 20.9162 12.2803 21.1236 12.7783L21.8447 14.5218C21.9469 14.7685 21.9996 15.0329 21.9996 15.2999C21.9997 15.567 21.9471 15.8314 21.8449 16.0781C21.7427 16.3249 21.5929 16.549 21.4041 16.7378C21.2152 16.9266 20.991 17.0764 20.7443 17.1785L19.0004 17.9009C18.5023 18.1068 18.1065 18.5021 17.8998 18.9998L17.1769 20.745C16.9706 21.2431 16.575 21.6388 16.0769 21.8451C15.5789 22.0514 15.0193 22.0514 14.5212 21.8451L12.7773 21.1227C12.2792 20.9169 11.7198 20.9173 11.2221 21.1239L9.47689 21.8458C8.97912 22.0516 8.42001 22.0514 7.92237 21.8453C7.42473 21.6391 7.02925 21.2439 6.82281 20.7464L6.09972 19.0006C5.8938 18.5026 5.49854 18.1067 5.00085 17.9L3.25566 17.1771C2.75783 16.9709 2.36226 16.5754 2.15588 16.0777C1.94951 15.5799 1.94923 15.0205 2.1551 14.5225L2.87746 12.7786C3.08325 12.2805 3.08283 11.7211 2.8763 11.2233L2.15497 9.47678C2.0527 9.2301 2.00004 8.96568 2 8.69863C1.99996 8.43159 2.05253 8.16715 2.15472 7.92043C2.25691 7.67372 2.40671 7.44955 2.59557 7.26075C2.78442 7.07195 3.00862 6.92222 3.25537 6.8201L4.9993 6.09772C5.49687 5.89197 5.89248 5.4972 6.0993 5.00006L6.82218 3.25481C7.02848 2.75674 7.42418 2.36103 7.92222 2.15473C8.42027 1.94842 8.97987 1.94842 9.47792 2.15473L11.2218 2.87712C11.7199 3.08291 12.2793 3.08249 12.7771 2.87595L14.523 2.15585C15.021 1.94966 15.5804 1.9497 16.0784 2.15597C16.5763 2.36223 16.972 2.75783 17.1783 3.25576L17.9014 5.00153L17.9012 4.99851Z"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </InfoRowIcon>
                    <InfoRowBody>
                      <InfoRowTitle>{row2Title}</InfoRowTitle>
                      <InfoRowSub>{row2Sub}</InfoRowSub>
                    </InfoRowBody>
                  </InfoRow>

                  <InfoRow>
                    <InfoRowIcon aria-hidden>
                      <LordIcon
                        src={LOCATION_LORD_ICON}
                        trigger="in"
                        state="in-jump-dynamic"
                        colors="primary:#000000"
                        size="42px"
                        inState="in-reveal"
                      />
                    </InfoRowIcon>
                    <InfoRowBody>
                      <InfoRowTitle>{locTitle}</InfoRowTitle>
                      {locSub ? <InfoRowSub>{locSub}</InfoRowSub> : null}
                    </InfoRowBody>
                  </InfoRow>

                  <InfoRow>
                    <InfoRowIcon aria-hidden>
                      <InfoRowEmojiWrap>⭐</InfoRowEmojiWrap>
                    </InfoRowIcon>
                    <InfoRowBody>
                      <InfoRowTitle>{reviewTitle}</InfoRowTitle>
                      <InfoRowSub>{credSubtitle}</InfoRowSub>
                    </InfoRowBody>
                  </InfoRow>
                </InfoRowsStack>

                <MobileDividerBeforeDescription aria-hidden />
              </HeroContentInner>
            </HeroContentColumn>
          </HeroDesktopRow>
        </HeroFullBleed>

        {/* Share: mobile = Vaul drawer from bottom */}
        {isMobile && (
          <Drawer.Root
            open={isShareModalVisible}
            onOpenChange={(open) => !open && onShareModalClose()}
          >
            <Drawer.Portal>
              <ShareDrawerOverlay />
              <ShareDrawerContent>
                <ShareDrawerHandle />
                <ShareModalHeader>
                  <h3>Share this class</h3>
                  <CloseButton
                    onClick={onShareModalClose}
                    aria-label="Close share options"
                  >
                    <X size={20} />
                  </CloseButton>
                </ShareModalHeader>
                <ShareModalBody>
                  <ShareCopySection>
                    <ShareCopyInput
                      type="text"
                      readOnly
                      value={currentUrl}
                      aria-label="Share link"
                    />
                    <ShareCopyBtn
                      type="button"
                      onClick={() =>
                        handleCopyToClipboard(currentUrl, "Link copied!")
                      }
                    >
                      <Copy size={16} /> Copy
                    </ShareCopyBtn>
                  </ShareCopySection>
                  <PlaceInfo>
                    {sharePreviewSrc ? (
                      <Image
                        src={sharePreviewSrc}
                        alt=""
                        width={56}
                        height={56}
                        sizes="56px"
                        style={{ borderRadius: 12, objectFit: "cover" }}
                      />
                    ) : null}
                    <div>
                      <p>{title}</p>
                      <PlaceMeta>
                        {rating && rating > 0 ? (
                          <MetaItem>
                            <Star size={14} fill="#FFB400" color="#FFB400" />
                            {rating.toFixed(1)}
                          </MetaItem>
                        ) : (
                          <MetaItem>
                            <Star size={14} fill="#FFB400" color="#FFB400" />
                            New
                          </MetaItem>
                        )}
                        {business_name && (
                          <MetaItem>· {business_name}</MetaItem>
                        )}
                      </PlaceMeta>
                    </div>
                  </PlaceInfo>
                  <ShareSectionLabel>Share to</ShareSectionLabel>
                  <ShareGrid>
                    <ShareOptionButton
                      as="a"
                      href={`mailto:?subject=${encodeURIComponent(
                        title,
                      )}&body=${encodeURIComponent(currentUrl)}`}
                    >
                      <Mail size={18} /> Email
                    </ShareOptionButton>
                    <ShareOptionButton
                      as="a"
                      href={`sms:?&body=${encodeURIComponent(
                        `${title}\n${currentUrl}`,
                      )}`}
                    >
                      <MessageSquare size={18} /> Messages
                    </ShareOptionButton>
                    <ShareOptionButton
                      as="a"
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `${title}\n${currentUrl}`,
                      )}`}
                      target="_blank"
                    >
                      <Phone size={18} /> WhatsApp
                    </ShareOptionButton>
                    <ShareOptionButton
                      as="a"
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        currentUrl,
                      )}`}
                      target="_blank"
                    >
                      <Facebook size={18} /> Facebook
                    </ShareOptionButton>
                    <ShareOptionButton
                      as="a"
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                        currentUrl,
                      )}&text=${encodeURIComponent(title)}`}
                      target="_blank"
                    >
                      <Twitter size={18} /> Twitter
                    </ShareOptionButton>
                    {typeof navigator !== "undefined" && navigator.share && (
                      <ShareOptionButton
                        onClick={() =>
                          navigator.share({
                            title,
                            text: title,
                            url: currentUrl,
                          })
                        }
                      >
                        <MoreHorizontal size={18} /> More
                      </ShareOptionButton>
                    )}
                  </ShareGrid>
                </ShareModalBody>
              </ShareDrawerContent>
            </Drawer.Portal>
          </Drawer.Root>
        )}

        {/* Share: desktop = centered modal */}
        {!isMobile && (
          <StyledModal
            open={isShareModalVisible}
            onCancel={onShareModalClose}
            footer={null}
            width={520}
            centered
          >
            <ShareModalWrapper>
              <ShareModalHeader>
                <h3>Share this class</h3>
                <CloseButton
                  onClick={onShareModalClose}
                  aria-label="Close share options"
                >
                  <X size={20} />
                </CloseButton>
              </ShareModalHeader>
              <ShareModalBody>
                <ShareCopySection>
                  <ShareCopyInput
                    type="text"
                    readOnly
                    value={currentUrl}
                    aria-label="Share link"
                  />
                  <ShareCopyBtn
                    type="button"
                    onClick={() =>
                      handleCopyToClipboard(currentUrl, "Link copied!")
                    }
                  >
                    <Copy size={16} /> Copy link
                  </ShareCopyBtn>
                </ShareCopySection>
                <PlaceInfo>
                  {sharePreviewSrc ? (
                    <Image
                      src={sharePreviewSrc}
                      alt=""
                      width={56}
                      height={56}
                      sizes="56px"
                      style={{ borderRadius: 12, objectFit: "cover" }}
                    />
                  ) : null}
                  <div>
                    <p>{title}</p>
                    <PlaceMeta>
                      {rating && rating > 0 ? (
                        <MetaItem>
                          <Star size={14} fill="#FFB400" color="#FFB400" />
                          {rating.toFixed(1)}
                        </MetaItem>
                      ) : (
                        <MetaItem>
                          <Star size={14} fill="#FFB400" color="#FFB400" />
                          New
                        </MetaItem>
                      )}
                      {business_name && (
                        <MetaItem>· {business_name}</MetaItem>
                      )}
                      {location && <MetaItem>· {location}</MetaItem>}
                    </PlaceMeta>
                  </div>
                </PlaceInfo>
                <ShareSectionLabel>Share to</ShareSectionLabel>
                <ShareGrid>
                  <ShareOptionButton
                    as="a"
                    href={`mailto:?subject=${encodeURIComponent(
                      title,
                    )}&body=${encodeURIComponent(currentUrl)}`}
                  >
                    <Mail size={18} /> Email
                  </ShareOptionButton>
                  <ShareOptionButton
                    as="a"
                    href={`sms:?&body=${encodeURIComponent(
                      `${title}\n${currentUrl}`,
                    )}`}
                  >
                    <MessageSquare size={18} /> Messages
                  </ShareOptionButton>
                  <ShareOptionButton
                    as="a"
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `${title}\n${currentUrl}`,
                    )}`}
                    target="_blank"
                  >
                    <Phone size={18} /> WhatsApp
                  </ShareOptionButton>
                  <ShareOptionButton
                    as="a"
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      currentUrl,
                    )}`}
                    target="_blank"
                  >
                    <Facebook size={18} /> Facebook
                  </ShareOptionButton>
                  <ShareOptionButton
                    as="a"
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                      currentUrl,
                    )}&text=${encodeURIComponent(title)}`}
                    target="_blank"
                  >
                    <Twitter size={18} /> Twitter
                  </ShareOptionButton>
                  {typeof navigator !== "undefined" && navigator.share && (
                    <ShareOptionButton
                      onClick={() =>
                        navigator.share({
                          title,
                          text: title,
                          url: currentUrl,
                        })
                      }
                    >
                      <MoreHorizontal size={18} /> More
                    </ShareOptionButton>
                  )}
                </ShareGrid>
              </ShareModalBody>
            </ShareModalWrapper>
          </StyledModal>
        )}
        <Modal
          open={isEmbedModalVisible}
          onCancel={() => setIsEmbedModalVisible(false)}
          title="Embed this class"
          footer={null}
          centered
        >
          <EmbedModalContent>
            <textarea readOnly value={embedCode} rows={5} />
            <ActionButton
              onClick={() =>
                handleCopyToClipboard(embedCode, "Embed code copied!")
              }
            >
              <Copy size={16} /> Copy Code
            </ActionButton>
          </EmbedModalContent>
        </Modal>

        {/* Lightbox — shared-element FLIP from bento cell */}
        {lightboxOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <LightboxOverlay
              role="dialog"
              aria-modal="true"
              aria-label="Image viewer"
              onClick={galleryOpen ? undefined : closeLightbox}
            >
              {/* Background fades independently */}
              <LightboxBg $fading={isClosingLightbox} />

              {/* Fixed header buttons — always visible */}
              {imagesToDisplay.length > 1 && (
                <AllImagesBtn
                  type="button"
                  $fading={isClosingLightbox}
                  $locked={allImagesLocked}
                  onClick={(e) => {
                    e.stopPropagation();
                    galleryOpen ? closeGallery() : openGallery();
                  }}
                >
                  {galleryOpen ? (
                    <><ArrowLeft size={14} /> Back</>
                  ) : (
                    <>Gallery ({imagesToDisplay.length})</>
                  )}
                </AllImagesBtn>
              )}

              <LightboxCloseBtn
                type="button"
                aria-label="Close image viewer"
                $fading={isClosingLightbox}
                onClick={(e) => {
                  e.stopPropagation();
                  closeLightbox();
                }}
              >
                <X size={20} />
              </LightboxCloseBtn>

              {/* ── Single image view — always rendered so FLIP always has a target ── */}
              <LightboxRow
                $elevate={galleryExitPending}
                $noPointer={galleryInputLocked}
                onTouchStart={onLightboxTouchStart}
                onTouchEnd={onLightboxTouchEnd}
              >
                {imagesToDisplay.length > 1 && (
                  <LightboxNavBtn
                    type="button"
                    aria-label="Previous image"
                    $side="left"
                    $fading={isClosingLightbox}
                    $busy={galleryInputLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      goPrev();
                    }}
                  >
                    <ArrowLeft size={22} />
                  </LightboxNavBtn>
                )}

                <LightboxImgContainer
                  ref={lightboxContainerRef}
                  style={{
                    width: `${lightboxBoxSize.width}px`,
                    height: `${lightboxBoxSize.height}px`,
                  }}
                  $resizeTransition={resizeTransition}
                  $hiddenForGallery={
                    (galleryOpen &&
                      !galleryExitPending &&
                      (galleryPhase === "revealed" ||
                        (galleryPhase !== "revealed" &&
                          hasOpeningFlipProxy))) ||
                    (isClosingLightbox && closeFadeOnly && galleryOpen)
                  }
                  $fadeOnly={
                    isClosingLightbox && closeFadeOnly && !galleryOpen
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                  <LightboxImgClip
                    ref={lightboxClipRef}
                    $navBurst={navBurst}
                  >
                    <LightboxImgEl
                      ref={lightboxImgInnerRef}
                      src={lightboxImageUrl}
                      alt={`Image ${lightboxIndex + 1}`}
                      $navBurst={navBurst}
                    />
                  </LightboxImgClip>
                </LightboxImgContainer>

                {imagesToDisplay.length > 1 && (
                  <LightboxNavBtn
                    type="button"
                    aria-label="Next image"
                    $side="right"
                    $fading={isClosingLightbox}
                    $busy={galleryInputLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      goNext();
                    }}
                  >
                    <ArrowRight size={22} />
                  </LightboxNavBtn>
                )}
              </LightboxRow>

              {!galleryOpen && imagesToDisplay.length > 1 && imagesToDisplay.length <= 8 ? (
                <LightboxDots
                  $fading={isClosingLightbox}
                  $busy={galleryInputLocked}
                  onClick={(e) => e.stopPropagation()}
                >
                  {imagesToDisplay.map((_, i) => (
                    <LightboxDot
                      key={i}
                      $active={i === lightboxIndex}
                      type="button"
                      aria-label={`Go to image ${i + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (i !== lightboxIndex) {
                          const cell = bentoGridRef.current?.children[i];
                          if (cell) originCellRef.current = cell;
                          triggerNavBurst();
                          setLightboxIndex(i);
                        }
                      }}
                    />
                  ))}
                </LightboxDots>
              ) : !galleryOpen && imagesToDisplay.length > 8 ? (
                <LightboxCounter
                  $fading={isClosingLightbox}
                  $busy={galleryInputLocked}
                  onClick={(e) => e.stopPropagation()}
                >
                  {lightboxIndex + 1} / {imagesToDisplay.length}
                </LightboxCounter>
              ) : null}

              {/* ── Gallery overlay — position:absolute covers LightboxRow ── */}
              {galleryOpen && (
                <GalleryScrollArea
                  $fading={isClosingLightbox}
                  $inputLocked={galleryInputLocked}
                  $exitPending={galleryExitPending}
                  onClick={(e) => e.stopPropagation()}
                >
                  <GalleryGrid>
                    {imagesToDisplay.map((img, i) => {
                      const isFlipCell = i === galleryFlipIdxRef.current;
                      // Always use the locked-in src for the flip cell so the URL never
                      // changes (open → revealed → exit), preventing any re-fetch flash.
                      const src = isFlipCell
                        ? galleryFlipSrcRef.current || resolveImageUrl(img, true)
                        : resolveImageUrl(img, true);
                      const hideForFlip =
                        isFlipCell &&
                        galleryPhase !== "revealed" &&
                        !galleryExitPending;
                      // During exit FLIP (gallery → single), hide only the source cell
                      // (the one that was clicked). Use a ref so this stays correct even
                      // after lightboxIndex has been updated to the new value.
                      const hideForExit =
                        galleryExitPending && i === galleryExitSourceIdxRef.current;
                      const dim = imageDims[i];
                      const cellStyle = dim
                        ? { aspectRatio: `${dim.width} / ${dim.height}` }
                        : undefined;
                      return (
                        <GalleryCell
                          key={i}
                          ref={(el) => {
                            galleryItemRefs.current[i] = el;
                          }}
                          style={cellStyle}
                          $isFlipCell={isFlipCell}
                          $reveal={galleryPhase === "revealed"}
                          $animDelay={i * 0.05}
                          $locked={galleryInputLocked}
                          $hidden={hideForFlip || hideForExit}
                          onClick={() => selectFromGallery(i)}
                          role="button"
                          aria-label={`View image ${i + 1}`}
                        >
                          {src && (
                            <GalleryImg
                              src={src}
                              alt=""
                              loading="eager"
                              onLoad={() => recalibrateOpeningFlipTarget(i)}
                            />
                          )}
                        </GalleryCell>
                      );
                    })}
                  </GalleryGrid>
                </GalleryScrollArea>
              )}
              {openingFlipProxy?.src && (
                <OpeningFlipProxy
                  style={{
                    left: `${openingFlipProxy.left}px`,
                    top: `${openingFlipProxy.top}px`,
                    width: `${openingFlipProxy.width}px`,
                    height: `${openingFlipProxy.height}px`,
                    borderRadius: `${openingFlipProxy.borderRadius}px`,
                    transition: openingFlipProxy.transitioning
                      ? "left 0.6s cubic-bezier(0.4,0,0.2,1), top 0.6s cubic-bezier(0.4,0,0.2,1), width 0.6s cubic-bezier(0.4,0,0.2,1), height 0.6s cubic-bezier(0.4,0,0.2,1), border-radius 0.6s cubic-bezier(0.4,0,0.2,1)"
                      : "none",
                  }}
                >
                  <img src={openingFlipProxy.src} alt="" />
                </OpeningFlipProxy>
              )}
            </LightboxOverlay>,
            document.body,
          )}
      </MainContent>
    );
  },
);

ClassPageImagesTitle.displayName = "ClassPageImagesTitle";
export default ClassPageImagesTitle;
