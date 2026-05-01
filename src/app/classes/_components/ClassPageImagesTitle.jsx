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
  Sparkles,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { LordIcon } from "@/services/ReactUtils";

const HERO_TEXT = "#111111";
const HERO_MUTED = "#717171";

/** Toronto / homepage suggested-area marker (SearchContext LORDICON_TORONTO). */
const LOCATION_LORD_ICON = "https://cdn.lordicon.com/luvlauio.json";
/** Partner & Premium pills (legacy class page). */
const PARTNER_LORD_ICON = "https://cdn.lordicon.com/zopdjjjs.json";
/** Business dashboard → Schedules sidebar item. */
const SCHEDULE_LORD_ICON = "https://cdn.lordicon.com/uoljexdg.json";

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
  gap: clamp(20px, 2.5vw, 36px);
  max-width: 1360px;
  margin: 0 auto;
  padding: clamp(12px, 1.5vw, 20px) clamp(12px, 2vw, 20px) 28px;

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
  padding: 12px 24px 12px 12px;
  box-sizing: border-box;

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
  font-size: 14px;
  line-height: 1.5;
  color: ${HERO_MUTED};
  font-weight: 400;
  max-width: 20rem;

  @media (max-width: 768px) {
    order: 2;
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
  margin-bottom: 34px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileDividerAfterHero = styled.hr`
  display: none;
  border: none;
  border-top: 1px solid #ebebeb;
  margin: 22px 0 20px;

  @media (max-width: 768px) {
    display: block;
    order: 4;
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
    order: 6;
    margin: 20px 0 0;
  }
`;

const InfoRowsStack = styled.div`
  order: 6;
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
  text-align: left;

  @media (max-width: 768px) {
    order: 5;
  }
`;

const InfoRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

const InfoRowIcon = styled.div`
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  font-size: 13px;
  color: ${HERO_MUTED};
  line-height: 1.45;
  margin-top: 2px;
`;

const HostAvatar = styled.div`
  width: 40px;
  height: 40px;
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
  order: 7;
  margin-top: 26px;
  text-align: center;

  @media (max-width: 768px) {
    order: 3;
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
  gap: 8px;
  padding: 10px 0;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: #444;
  cursor: pointer;
  border-radius: 8px;
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
    padding: 8px 14px;
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
`;

const HostRowButton = styled.button`
  display: flex;
  align-items: flex-start;
  gap: 16px;
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
  width: min(88vw, 82vh);
  height: min(82vh, 88vw);
  max-width: 1100px;
  flex-shrink: 0;
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;

  ${({ $hiddenForGallery }) =>
    $hiddenForGallery &&
    css`
      opacity: 0;
    `}
`;

const LightboxImgClip = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50px;
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
`;

/* Nav buttons sit inline beside the image container — no position:fixed */
const LightboxNavBtn = styled.button`
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
  flex-shrink: 0;
  z-index: 1;
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
            transform: none;
          }
        `
      : css`
          &:hover {
            background: rgba(0, 0, 0, 0.08);
            transform: scale(1.08);
          }
          &:active {
            transform: scale(0.95);
          }
        `}
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
`;

/* --- Gallery view --- */
/* z-index: 2 so it sits above the always-rendered LightboxRow (z-index: 1).
   No fade-in animation — appears instantly so only the FLIP cell is seen flying. */
const GalleryScrollArea = styled.div`
  position: absolute;
  inset: 0;
  overflow-y: auto;
  padding: 76px 24px 48px;
  box-sizing: border-box;
  z-index: 2;
  background: #ffffff;

  /* Block all interaction during FLIP / stagger / exit-to-single */
  ${({ $inputLocked }) =>
    $inputLocked &&
    css`
      pointer-events: none;
    `}

  /* Gallery stays mounted until lightbox FLIP finishes — hide visually so FLIP shows */
  ${({ $exitPending }) =>
    $exitPending &&
    css`
      opacity: 0;
      visibility: hidden;
      transition: none;
    `}

  ${({ $fading }) =>
    $fading &&
    css`
      animation: ${lbBgFadeOut} 0.5s ease both;
      pointer-events: none;
    `}
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  max-width: 860px;
  margin: 0 auto;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const GalleryCell = styled.div`
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 14px;
  cursor: pointer;
  background: #f0f0f0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
  /* Hidden by default — FLIP cell overrides to opacity:1, others reveal via stagger */
  opacity: 0;

  ${({ $proxySrc }) =>
    $proxySrc &&
    css`
      background-image: url(${$proxySrc});
    `}

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
            transform: scale(0.97);
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
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  will-change: left, top, width, height, border-radius;
  transform: translateZ(0);
  backface-visibility: hidden;
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
    const galleryExitTimerRef = useRef(null);

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
      const check = () => setIsMobile(window.innerWidth <= 768);
      check();
      window.addEventListener("resize", check);
      return () => window.removeEventListener("resize", check);
    }, []);

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

    const openLightbox = useCallback((index, cellEl) => {
      originCellRef.current = cellEl;
      setLightboxIndex(index);
      setIsClosingLightbox(false);
      setLightboxOpen(true);
    }, []);

    const closeLightbox = useCallback(() => {
      if (galleryExitTimerRef.current) {
        clearTimeout(galleryExitTimerRef.current);
        galleryExitTimerRef.current = null;
      }
      setGalleryExitPending(false);
      const el = lightboxContainerRef.current;
      const originEl = originCellRef.current;
      setIsClosingLightbox(true);
      if (!el || !originEl) {
        setTimeout(() => {
          setLightboxOpen(false);
          lightboxOpenedRef.current = false;
          setIsClosingLightbox(false);
        }, 500);
        return;
      }
      // Re-measure origin cell at close time so scroll position is always correct
      const originRect = originEl.getBoundingClientRect();
      const finalRect = el.getBoundingClientRect();
      const scale = Math.min(
        originRect.width / finalRect.width,
        originRect.height / finalRect.height,
      );
      const dx =
        originRect.left +
        originRect.width / 2 -
        (finalRect.left + finalRect.width / 2);
      const dy =
        originRect.top +
        originRect.height / 2 -
        (finalRect.top + finalRect.height / 2);
      el.style.transition =
        "transform 0.55s cubic-bezier(0.4,0,0.6,1), border-radius 0.55s cubic-bezier(0.4,0,0.6,1)";
      el.style.transform = `translate(${dx}px,${dy}px) scale(${scale})`;
      el.style.borderRadius = "9px";
      setTimeout(() => {
        setLightboxOpen(false);
        lightboxOpenedRef.current = false;
        setIsClosingLightbox(false);
      }, 560);
    }, []);

    // Keep a ref in sync so goNext/goPrev can read current index without adding it to deps
    useEffect(() => {
      lightboxIndexRef.current = lightboxIndex;
    }, [lightboxIndex]);

    const goNext = useCallback(() => {
      const newIdx =
        (lightboxIndexRef.current + 1) % imagesToDisplay.length;
      // If new image has a bento cell, update the exit-animation target
      const cell = bentoGridRef.current?.children[newIdx];
      if (cell) originCellRef.current = cell;
      triggerNavBurst();
      setLightboxIndex(newIdx);
    }, [triggerNavBurst, imagesToDisplay.length]);

    const goPrev = useCallback(() => {
      const newIdx =
        (lightboxIndexRef.current - 1 + imagesToDisplay.length) %
        imagesToDisplay.length;
      const cell = bentoGridRef.current?.children[newIdx];
      if (cell) originCellRef.current = cell;
      triggerNavBurst();
      setLightboxIndex(newIdx);
    }, [triggerNavBurst, imagesToDisplay.length]);

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
      const scale = Math.min(
        originRect.width / finalRect.width,
        originRect.height / finalRect.height,
      );
      const dx =
        originRect.left +
        originRect.width / 2 -
        (finalRect.left + finalRect.width / 2);
      const dy =
        originRect.top +
        originRect.height / 2 -
        (finalRect.top + finalRect.height / 2);
      el.style.transition = "none";
      el.style.transform = `translate(${dx}px,${dy}px) scale(${scale})`;
      el.style.borderRadius = "9px";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition =
            "transform 0.65s cubic-bezier(0.4,0,0.2,1), border-radius 0.65s cubic-bezier(0.4,0,0.2,1)";
          el.style.transform = "";
          el.style.borderRadius = "50px";
        });
      });
    }, [lightboxOpen]);

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

    // Reusable helper: apply a FLIP from sourceRect to the lightbox container's current position
    const flipLightboxContainerFrom = useCallback((sourceRect) => {
      const el = lightboxContainerRef.current;
      if (!el || !sourceRect) return;
      const finalRect = el.getBoundingClientRect();
      const scale = Math.min(
        sourceRect.width / finalRect.width,
        sourceRect.height / finalRect.height,
      );
      const dx =
        sourceRect.left +
        sourceRect.width / 2 -
        (finalRect.left + finalRect.width / 2);
      const dy =
        sourceRect.top +
        sourceRect.height / 2 -
        (finalRect.top + finalRect.height / 2);
      el.style.transition = "none";
      el.style.transform = `translate(${dx}px,${dy}px) scale(${scale})`;
      el.style.borderRadius = "12px";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition =
            "transform 0.6s cubic-bezier(0.4,0,0.2,1), border-radius 0.6s cubic-bezier(0.4,0,0.2,1)";
          el.style.transform = "";
          el.style.borderRadius = "50px";
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
    }, []);

    // Gallery open: snapshot lightbox position, record which cell will fly
    const openGallery = useCallback(() => {
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
      setGalleryPhase("idle");
      setGalleryOpening(true);
      const activeSrc =
        lightboxImageUrl || resolveImageUrl(imagesToDisplay[idx], true);
      preloadImage(activeSrc).finally(() => {
        if (typeof window === "undefined") {
          setGalleryOpen(true);
          setGalleryOpening(false);
          return;
        }
        requestAnimationFrame(() => {
          setGalleryOpen(true);
          setGalleryOpening(false);
        });
      });
    }, [
      galleryOpening,
      lightboxImageUrl,
      imagesToDisplay,
      preloadImage,
      resolveImageUrl,
    ]);

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
      setGalleryExitPending(true);
      setLightboxFlipKey((k) => k + 1);
      galleryExitTimerRef.current = setTimeout(finishGalleryExit, 680);
    }, [galleryPhase, finishGalleryExit]);

    // Select an image from the gallery — FLIP to single, then unmount gallery
    const selectFromGallery = useCallback(
      (index) => {
        if (galleryExitTimerRef.current) return;
        if (galleryPhase !== "revealed") return;
        const galleryCell = galleryItemRefs.current[index];
        if (galleryCell) {
          lightboxFlipSourceRect.current = galleryCell.getBoundingClientRect();
        }
        const bentoCell = bentoGridRef.current?.children[index];
        if (bentoCell) originCellRef.current = bentoCell;
        setGalleryExitPending(true);
        setLightboxIndex(index);
        setLightboxFlipKey((k) => k + 1);
        galleryExitTimerRef.current = setTimeout(finishGalleryExit, 680);
      },
      [galleryPhase, finishGalleryExit],
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

    let partnerBadgeLabel = null;
    let partnerSubtitle =
      "Trusted organizations that list and run classes on Classeasily.";
    if (partnerTierName === "Founding Partner") {
      partnerBadgeLabel = "Classeasily Partner";
      partnerSubtitle =
        "Founding partners helped shape Classeasily and meet elevated listing standards.";
    } else if (partnerTierName === "Premium Partner") {
      partnerBadgeLabel = "Premium Partner";
      partnerSubtitle =
        "Premium partners receive enhanced visibility and dedicated support.";
    }

    const row2Title = partnerBadgeLabel
      ? partnerBadgeLabel
      : shouldShowTopRated
        ? "Highly rated"
        : "Verified listing";
    const row2Sub = partnerBadgeLabel
      ? partnerSubtitle
      : shouldShowTopRated
        ? "Learners rate this class 4.5+ with multiple reviews."
        : "Every host and class listing is reviewed by our team.";

    const cleanLocStr = (v) => {
      if (v == null) return "";
      const s = String(v).trim();
      if (!s || s === "undefined") return "";
      return s;
    };
    const locTitle = cleanLocStr(locationHeadline) || "Where you'll be";
    const locSub = cleanLocStr(locationSubline);

    const reviewTitle =
      reviewCount > 0
        ? `${reviewCount} review${reviewCount !== 1 ? "s" : ""}${
            averageRating > 0
              ? ` · ${Number(averageRating).toFixed(1)} avg`
              : ""
          }`
        : averageRating > 0
          ? `${Number(averageRating).toFixed(1)} avg rating`
          : "You're early";

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

                {descriptionSummary ? (
                  <HeroSummary>{descriptionSummary}</HeroSummary>
                ) : null}

                {onContactHost && businessData ? (
                  <AskRow>
                    <AskLink type="button" onClick={onContactHost}>
                      <MessageCircle
                        size={isMobile ? 16 : 18}
                        aria-hidden
                      />
                      Ask the host a question
                    </AskLink>
                  </AskRow>
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

                <MobileDividerAfterHero aria-hidden />

                <InfoRowsStack>
                  {businessData && onBusinessClick ? (
                    <HostRowButton
                      type="button"
                      onClick={onBusinessClick}
                      disabled={!businessData}
                      aria-label={`View details for ${displayBusinessName}`}
                    >
                      {displayBusinessImage ? (
                        <HostAvatar aria-hidden>
                          <HostAvatarImg src={displayBusinessImage} alt="" />
                        </HostAvatar>
                      ) : (
                        <HostAvatar aria-hidden>
                          <MessageCircle size={20} color="#9ca3af" />
                        </HostAvatar>
                      )}
                      <InfoRowBody>
                        <InfoRowTitle>
                          Hosted by {displayBusinessName}
                        </InfoRowTitle>
                        <InfoRowSub>{hostSubtitle}</InfoRowSub>
                      </InfoRowBody>
                    </HostRowButton>
                  ) : (
                    <InfoRow>
                      {displayBusinessImage ? (
                        <HostAvatar aria-hidden>
                          <HostAvatarImg src={displayBusinessImage} alt="" />
                        </HostAvatar>
                      ) : (
                        <HostAvatar aria-hidden>
                          <MessageCircle size={20} color="#9ca3af" />
                        </HostAvatar>
                      )}
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
                          size="30px"
                        />
                      ) : (
                        <Sparkles
                          size={20}
                          color="#d97706"
                          strokeWidth={1.75}
                        />
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
                        trigger="hover"
                        colors="primary:#3a3347,secondary:#e4e4e4,tertiary:#ffc738"
                        size="32px"
                        playOnLoad
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
                      <LordIcon
                        src={SCHEDULE_LORD_ICON}
                        trigger="hover"
                        colors="primary:#717171,secondary:#717171"
                        size="32px"
                        playOnLoad
                        inState="in-calendar"
                      />
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
                    <>All images ({imagesToDisplay.length})</>
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
              >
                {imagesToDisplay.length > 1 && (
                  <LightboxNavBtn
                    type="button"
                    aria-label="Previous image"
                    $fading={isClosingLightbox}
                    $busy={galleryInputLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      goPrev();
                    }}
                  >
                    <ChevronLeft size={22} />
                  </LightboxNavBtn>
                )}

                <LightboxImgContainer
                  ref={lightboxContainerRef}
                  $hiddenForGallery={
                    galleryOpen && galleryPhase !== "revealed" && !galleryExitPending
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
                    $fading={isClosingLightbox}
                    $busy={galleryInputLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      goNext();
                    }}
                  >
                    <ChevronRight size={22} />
                  </LightboxNavBtn>
                )}
              </LightboxRow>

              {imagesToDisplay.length > 1 && imagesToDisplay.length <= 8 ? (
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
              ) : imagesToDisplay.length > 8 ? (
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
                      const src = isFlipCell
                        ? lightboxImageUrl || resolveImageUrl(img, true)
                        : resolveImageUrl(img, true);
                      const useFlipProxyImage =
                        isFlipCell &&
                        galleryPhase !== "revealed" &&
                        !galleryExitPending;
                      return (
                        <GalleryCell
                          key={i}
                          ref={(el) => {
                            galleryItemRefs.current[i] = el;
                          }}
                          $isFlipCell={isFlipCell}
                          $reveal={galleryPhase === "revealed"}
                          $animDelay={i * 0.05}
                          $locked={galleryInputLocked}
                          $hidden={useFlipProxyImage}
                          $proxySrc={useFlipProxyImage ? src : ""}
                          onClick={() => selectFromGallery(i)}
                          role="button"
                          aria-label={`View image ${i + 1}`}
                        >
                          {src && !useFlipProxyImage && (
                            <GalleryImg src={src} alt="" loading="eager" />
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
                    backgroundImage: `url(${openingFlipProxy.src})`,
                    transition: openingFlipProxy.transitioning
                      ? "left 0.6s cubic-bezier(0.4,0,0.2,1), top 0.6s cubic-bezier(0.4,0,0.2,1), width 0.6s cubic-bezier(0.4,0,0.2,1), height 0.6s cubic-bezier(0.4,0,0.2,1), border-radius 0.6s cubic-bezier(0.4,0,0.2,1)"
                      : "none",
                  }}
                />
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
