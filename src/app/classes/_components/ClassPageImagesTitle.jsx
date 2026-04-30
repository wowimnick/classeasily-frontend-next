"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Modal } from "antd";
import { Drawer } from "vaul";
import message from "@/lib/message";
import styled, { css } from "styled-components";
import { motion, AnimatePresence, animate, LayoutGroup } from "framer-motion";
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
  Grid3x3,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MessageCircle,
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
  cursor: ${(p) => (p.$noClick ? "default" : "pointer")};

  @media (min-width: 769px) {
    border-radius: 9px;
  }
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
const ViewAllPhotosButton = styled.button`
  position: absolute;
  left: auto;
  right: clamp(16px, 11%, 25px);
  bottom: clamp(22px, 10%, 20px);
  width: 44px;
  height: 44px;
  padding: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(1px);
  border: 1px solid #ddd;
  border-radius: 40%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  color: #333;

  &:hover {
    background: white;
    transform: scale(1.04);
  }
`;

// --- Fullscreen gallery (white overlay, FLIP-style shared transition) ---
const GalleryOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: #ffffff;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const GalleryTopBar = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(14px, 2vw, 20px) clamp(16px, 3vw, 28px);
  z-index: 4;
  flex-shrink: 0;
`;

const GalleryPillButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid #e6e6e6;
  background: #ffffff;
  color: #111;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
  &:hover {
    background: #f7f7f7;
  }
  &:active {
    transform: scale(0.97);
  }
`;

const GalleryIconBtn = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #e6e6e6;
  background: #ffffff;
  color: #111;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
  &:hover {
    background: #f7f7f7;
  }
  &:active {
    transform: scale(0.94);
  }
`;

const ViewerStage = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;
  /* bottom padding gives room for the counter */
  padding-bottom: 48px;
  @media (max-width: 768px) {
    padding-bottom: 44px;
  }
`;

/* The layoutId target — always has DOM dimensions because it's a flex child filling the stage. */
const ViewerImageContainer = styled(motion.div)`
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  margin: 8px clamp(72px, 9vw, 128px) 8px;
  @media (max-width: 768px) {
    margin: 8px 56px;
  }
`;

const ViewerImg = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  user-select: none;
`;

const ViewerNavBtn = styled.button`
  position: absolute;
  /* Centre on the image container (stage minus 48px bottom padding) */
  top: calc(50% - 24px);
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid #e6e6e6;
  background: #ffffff;
  color: #111;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transition: background 0.18s ease, transform 0.18s ease;
  z-index: 5;
  ${({ $side }) =>
    $side === "left"
      ? css`
          left: clamp(12px, 2vw, 28px);
        `
      : css`
          right: clamp(12px, 2vw, 28px);
        `}
  &:hover {
    background: #f7f7f7;
  }
  &:active {
    transform: translateY(-50%) scale(0.94);
  }
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    top: calc(50% - 22px);
    ${({ $side }) =>
      $side === "left"
        ? css`
            left: 8px;
          `
        : css`
            right: 8px;
          `}
  }
`;

const ViewerCounter = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: clamp(16px, 3vh, 28px);
  text-align: center;
  font-size: 13px;
  color: #717171;
  pointer-events: none;
  z-index: 4;
`;

const OverviewScroller = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: clamp(8px, 1.5vh, 24px) clamp(20px, 5vw, 80px) 80px;
  -webkit-overflow-scrolling: touch;
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-auto-rows: 220px;
  gap: 16px;
  max-width: 1280px;
  margin: 0 auto;
  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 44vw;
    gap: 10px;
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    grid-auto-rows: 56vw;
  }
`;

const OverviewTile = styled(motion.button)`
  position: relative;
  border: none;
  padding: 0;
  margin: 0;
  background: #f0f0f0;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  width: 100%;
  height: 100%;
  display: block;
  transition: transform 0.2s ease;
  &:hover {
    transform: scale(1.01);
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
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
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryView, setGalleryView] = useState("viewer"); // 'viewer' | 'overview'
    const [activeIndex, setActiveIndex] = useState(0);
    /** The layoutId string used by the current viewer container — matches the bento cell opened from.
     *  Stays constant during navigation so layoutId doesn't re-trigger a FLIP on next/prev. */
    const [viewerLayoutId, setViewerLayoutId] = useState(null);
    const [isEmbedModalVisible, setIsEmbedModalVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [currentUrl, setCurrentUrl] = useState("");

    const viewerImgRef = useRef(null);

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

    const totalImages = imagesToDisplay.length;

    const handleCopyToClipboard = (text, successMessage) => {
      navigator.clipboard
        .writeText(text)
        .then(() => message.success(successMessage));
    };

    const getImageSrc = useCallback(
      (idx) => {
        const item = imagesToDisplay[idx];
        if (!item) return undefined;
        if (typeof item === "string") return item;
        return item.large_url || item.medium_url || item.thumbnail_url;
      },
      [imagesToDisplay],
    );

    const showGalleryModal = (startIndex = 0) => {
      if (classImages.length === 0) return;
      setActiveIndex(startIndex);
      setViewerLayoutId(`gallery-img-${startIndex}`);
      setGalleryView("viewer");
      setIsGalleryOpen(true);
    };

    /** Crossfade the viewer img between images — works reliably because image is already mounted. */
    const goToIndex = useCallback(
      async (newIndex) => {
        if (newIndex === activeIndex || totalImages === 0) return;
        const el = viewerImgRef.current;
        if (!el) {
          setActiveIndex(newIndex);
          return;
        }
        await animate(
          el,
          { opacity: 0, scale: 0.94 },
          { duration: 0.13, ease: [0.32, 0, 0.5, 1] },
        ).finished;
        setActiveIndex(newIndex);
        // wait one frame so React has updated src
        await new Promise((r) => requestAnimationFrame(r));
        await animate(
          el,
          { opacity: [0, 1], scale: [1.04, 1] },
          { duration: 0.2, ease: [0.32, 0, 0.32, 1] },
        ).finished;
      },
      [activeIndex, totalImages],
    );

    const handleNext = useCallback(() => {
      goToIndex((activeIndex + 1) % totalImages);
    }, [activeIndex, totalImages, goToIndex]);

    const handlePrev = useCallback(() => {
      goToIndex((activeIndex - 1 + totalImages) % totalImages);
    }, [activeIndex, totalImages, goToIndex]);

    const handleOpenOverview = useCallback(() => {
      setGalleryView("overview");
    }, []);

    const handleSelectFromOverview = useCallback((index) => {
      setActiveIndex(index);
      // Update layoutId so close animates back to the correct bento cell
      setViewerLayoutId(`gallery-img-${index}`);
      setGalleryView("viewer");
    }, []);

    const handleGalleryClose = useCallback(() => {
      setIsGalleryOpen(false);
    }, []);

    /** Keyboard navigation: arrows + Escape. */
    useEffect(() => {
      if (!isGalleryOpen) return;
      const onKey = (e) => {
        if (galleryView === "viewer") {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            handleNext();
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            handlePrev();
          }
        }
        if (e.key === "Escape") {
          e.preventDefault();
          handleGalleryClose();
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [
      isGalleryOpen,
      galleryView,
      handleNext,
      handlePrev,
      handleGalleryClose,
    ]);

    /** Lock body scroll while the gallery is open. */
    useEffect(() => {
      if (!isGalleryOpen) return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }, [isGalleryOpen]);

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

    return (
      <LayoutGroup id="gallery">
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

              <HeroBentoWrap>
                <HeroBentoGrid $count={bentoCount}>
                  {bentoImagesRaw.map((image, index) => {
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
                        $noClick={usePlaceholders}
                        onClick={() => {
                          if (!usePlaceholders) showGalleryModal(index);
                        }}
                      >
                        {/* layoutId wrapper — always has DOM dimensions for the FLIP */}
                        <motion.div
                          layoutId={`gallery-img-${index}`}
                          style={{
                            position: "absolute",
                            inset: 0,
                            overflow: "hidden",
                            borderRadius: "inherit",
                          }}
                        >
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
                        </motion.div>
                      </BentoCell>
                    );
                  })}
                </HeroBentoGrid>
                {classImages.length > 4 ? (
                  <ViewAllPhotosButton
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(0);
                      setGalleryView("overview");
                      setIsGalleryOpen(true);
                    }}
                    aria-label="Show all photos"
                  >
                    <Grid3x3 size={18} strokeWidth={2} aria-hidden />
                  </ViewAllPhotosButton>
                ) : null}
              </HeroBentoWrap>
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

        <AnimatePresence>
          {isGalleryOpen && (
            <GalleryOverlay
              key="gallery-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.32, 0, 0.32, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Photo gallery"
            >
              <GalleryTopBar>
                {galleryView === "viewer" ? (
                  <GalleryPillButton
                    type="button"
                    onClick={handleOpenOverview}
                    aria-label="Show all photos"
                  >
                    <Grid3x3 size={16} strokeWidth={2} aria-hidden />
                    All photos
                  </GalleryPillButton>
                ) : (
                  <GalleryPillButton
                    type="button"
                    onClick={() => setGalleryView("viewer")}
                    aria-label="Back to photo viewer"
                  >
                    <ChevronLeft size={16} strokeWidth={2} aria-hidden />
                    Back
                  </GalleryPillButton>
                )}
                <GalleryIconBtn
                  type="button"
                  onClick={handleGalleryClose}
                  aria-label="Close gallery"
                >
                  <X size={20} strokeWidth={2} />
                </GalleryIconBtn>
              </GalleryTopBar>

              {galleryView === "viewer" ? (
                <ViewerStage>
                  <ViewerImageContainer layoutId={viewerLayoutId}>
                    <ViewerImg
                      ref={viewerImgRef}
                      src={getImageSrc(activeIndex)}
                      alt={`Class image ${activeIndex + 1}`}
                      draggable={false}
                    />
                  </ViewerImageContainer>

                  {totalImages > 1 ? (
                    <ViewerNavBtn
                      type="button"
                      $side="left"
                      onClick={handlePrev}
                      aria-label="Previous photo"
                    >
                      <ChevronLeft size={22} strokeWidth={2} />
                    </ViewerNavBtn>
                  ) : null}
                  {totalImages > 1 ? (
                    <ViewerNavBtn
                      type="button"
                      $side="right"
                      onClick={handleNext}
                      aria-label="Next photo"
                    >
                      <ChevronRight size={22} strokeWidth={2} />
                    </ViewerNavBtn>
                  ) : null}

                  <ViewerCounter aria-live="polite">
                    {activeIndex + 1} / {totalImages}
                  </ViewerCounter>
                </ViewerStage>
              ) : (
                <OverviewScroller>
                  <OverviewGrid>
                    {imagesToDisplay.map((img, index) => {
                      const tileSrc =
                        (typeof img === "string" && img) ||
                        img?.medium_url ||
                        img?.thumbnail_url ||
                        img?.large_url;
                      return (
                        <OverviewTile
                          key={`overview-${index}`}
                          type="button"
                          onClick={() => handleSelectFromOverview(index)}
                          aria-label={`Open photo ${index + 1}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.28,
                            ease: [0.32, 0, 0.32, 1],
                            delay: 0.04 + index * 0.012,
                          }}
                        >
                          {tileSrc ? <img src={tileSrc} alt="" /> : null}
                        </OverviewTile>
                      );
                    })}
                  </OverviewGrid>
                </OverviewScroller>
              )}
            </GalleryOverlay>
          )}
        </AnimatePresence>
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
      </MainContent>
      </LayoutGroup>
    );
  },
);

ClassPageImagesTitle.displayName = "ClassPageImagesTitle";
export default ClassPageImagesTitle;
