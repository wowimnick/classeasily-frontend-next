"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthUser } from "@/hooks/useAuthUser";
import confetti from "canvas-confetti";
import dynamic from "next/dynamic";
import { Drawer } from "vaul";

import posthog from "posthog-js";
import ExploreHeader from "@/components/explore/ExploreHeader";
import ClassPageImagesTitle from "./ClassPageImagesTitle";
import ClassInformation from "./ClassInformation";
import { classService } from "@/services/apiService.js";
import { Alert, Button as AntButton, Divider, Modal } from "antd";
import message from "@/lib/message";
import { getLocalYYYYMMDD, formatNaiveDate, formatTimeRangeForDisplay } from "@/services/utils";
import { formatMoneyCompact, toSchemaPriceCurrency } from "@/lib/seo";
import SelectTimeModal from "./SelectTimeModal";
import { getCancellationPolicyText } from "./steps/utils";
import { useMobileReserveFlow, MOBILE_RESERVE_BREAKPOINT } from "./useMobileReserveFlow";
import {
  mobileDrawerTheme,
  MobileDrawerOverlay,
  MobileDrawerContent,
  MobileDrawerHandle,
  MobileDrawerTitle,
  ParticipantsStepperBtn,
  ParticipantsStepperValue,
} from "./mobileBookingStyles";
import { BP, down, up } from "@/styles/breakpoints";

/** Max width for fixed glass footers (tablet / iPad — avoids full-bleed bars) */
const MOBILE_STICKY_FOOTER_MAX_WIDTH_PX = 480;

/** Below Ant Design modal default (~1000) so host/policy modals cover the peek bar + mask */
const Z_DESKTOP_PEEK_BAR = 900;
/** Host + cancellation modals / drawers — above peek bar and header search popovers (~2600) */
const Z_CLASS_HOST_AND_POLICIES = 5000;

/**
 * Format a "YYYY-MM-DD" date string as a compact preview label for the
 * Upcoming availability strip (e.g. "Tomorrow, June 19" / "Mon, June 22").
 */
function formatSectionHeaderPreview(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);

  let prefix = "";
  if (date.getTime() === tomorrow.getTime()) prefix = "Tomorrow, ";
  else if (date.getTime() === dayAfter.getTime()) prefix = "Day after, ";

  const monthDay = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  if (prefix) return `${prefix}${monthDay}`;
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  return `${weekday}, ${monthDay}`;
}

/** Normalize option cancellation fields (camelCase from API + rare snake_case). */
function getOptionCancellation(opt) {
  if (!opt) return null;
  const policy = opt.cancellationPolicy ?? opt.cancellation_policy;
  if (policy == null || policy === "") return null;
  return {
    policy,
    refundPercentage:
      opt.cancellationRefundPercentage ?? opt.cancellation_refund_percentage,
    customHours: opt.cancellationCustomHours ?? opt.cancellation_custom_hours,
  };
}

// Dynamic imports for better code splitting
const ClassOffers = dynamic(() => import("./ClassOffers"));
const Reviews = dynamic(() => import("./ClassReviews"), { ssr: true });
const HostInfo = dynamic(() => import("./ClassHostInfo"));
const ClassPageMap = dynamic(() => import("./ClassPageMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: "400px", background: "#f0f0f0", borderRadius: "14px" }}
    />
  ),
});

// Dynamic import for booking components - only load when needed
const BookingModal = dynamic(() => import("./BookingModal"), {
  ssr: false,
  loading: () => null,
});

const ClassOptionsContainer = dynamic(() => import("./ClassOptionsContainer"), {
  ssr: false,
});

const MobileReserveReviewDrawer = dynamic(() => import("./MobileReserveReviewDrawer"), {
  ssr: false,
});

const ContactHostDrawer = dynamic(() => import("./ContactHostDrawer"), {
  ssr: false,
});

const LordIcon = dynamic(
  () => import("@/services/ReactUtils").then((mod) => mod.LordIcon),
  { ssr: false }
);

const CHECKOUT_STORAGE_KEY = "classeasily_checkout";

/** Avoid rendering the literal "undefined" when API fields are missing or malformed. */
function safeDisplayPart(v) {
  if (v == null) return "";
  const s = String(v).trim();
  if (!s || s === "undefined" || s === "null") return "";
  return s;
}

import ClassPageDeferredSkeleton, {
  ClassSidebarBookingSkeleton,
  MobileBookingFooterSkeletonBlocks,
} from "./skeletons/ClassPageDeferredSkeleton";

// Styled Components (original)
const ContentWrapper = styled.div`
  max-width: 1360px;
  margin: 0 auto;
  /* Match hero row horizontal inset (ClassPageImagesTitle HeroDesktopRow) */
  padding: 0 clamp(12px, 2.5vw, 28px);
  /*
   * overflow-x: hidden makes overflow-y compute to auto, which creates a
   * scroll container and breaks viewport position: sticky on the booking sidebar.
   * Desktop: let sticky work (minor horizontal bleed is acceptable).
   * Mobile: keep clipping as before.
   */
  ${up(BP.TABLET)} {
    overflow-x: visible;
    overflow-y: visible;
  }
  ${down(BP.TABLET)} {
    overflow-x: hidden;
  }
  ${down(BP.MOBILE)} {
    padding: 0;
  }
`;

const MainContentLayout = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  /* Same gap as hero image / title split */
  gap: clamp(8px, 1.2vw, 18px);
  padding: 0 0 4rem 0;
  position: relative;
  z-index: 5;

  ${down(BP.TABLET)} {
    flex-direction: column;
    gap: 0.5rem;
    padding-bottom: 3rem;
    padding-top: 0;
    align-items: stretch;
    margin-top: -3rem;
  }
`;

const PrimaryContentArea = styled.main`
  display: flex;
  flex-direction: column;
  min-width: 0;
  /* Match hero photo column (ClassPageImagesTitle HeroPhotoColumn) */
  flex: 0 1 60%;
  max-width: 60%;

  ${down(BP.TABLET)} {
    flex: none;
    max-width: none;
    width: 100%;
  }

  ${down(BP.MOBILE)} {
    gap: 0.5rem;
  }
`;

const StickySidebar = styled.aside`
  position: sticky;
  /* Below the sticky explore header (DesktopHeaderWrapper) */
  top: calc(5.5rem + 0.5rem);
  padding-top: 1.5rem;
  align-self: flex-start;
  height: fit-content;
  /* Same column share as ClassPageImagesTitle HeroContentColumn */
  flex: 1 1 0;
  min-width: 0;
  max-width: 40%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;

  ${down(BP.TABLET)} {
    display: none;
  }
`;

/* Match HeroContentInner: booking card sits under hero title block, not full 40% width */
const SidebarBookingInner = styled.div`
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  box-sizing: border-box;
`;

/* ── Desktop peek bar: visible at bottom of viewport when sidebar is off-screen ── */
const PeekBar = styled.div`
  display: none;

  ${up(BP.TABLET)} {
    display: flex;
    position: fixed;
    bottom: 0;
    /* left/width set via inline style from JS measurement */
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.12);
    background: #fff;
    padding: 14px 20px 18px;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    z-index: ${Z_DESKTOP_PEEK_BAR};
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.25s ease;
    transform: translateY(${(p) => (p.$visible ? "0" : "110%")});
    opacity: ${(p) => (p.$visible ? 1 : 0)};
    pointer-events: ${(p) => (p.$visible ? "auto" : "none")};
  }
`;

const PeekPriceStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const PeekPriceLine = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0 3px;
  flex-wrap: wrap;
`;

const PeekPriceFrom = styled.span`
  font-size: 20px;
  font-weight: 400;
  color: #111;
  line-height: 1.1;
  letter-spacing: -0.02em;
`;

const PeekPriceAmount = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: #111;
  line-height: 1.1;
  letter-spacing: -0.02em;
`;

const PeekPriceUnit = styled.span`
  font-size: 12px;
  font-weight: 400;
  color: #111;
  align-self: flex-end;
  padding-bottom: 2px;
`;

const PeekCancellation = styled.button`
  font-size: 11px;
  color: #717171;
  text-decoration: underline;
  text-underline-offset: 2px;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  text-align: left;
  font: inherit;
  position: relative;
  z-index: 3;
  align-self: flex-start;
  width: max-content;
  max-width: 100%;
  &:hover {
    color: #111;
  }
  &:focus-visible {
    outline: 2px solid #ff385c;
    outline-offset: 2px;
  }
`;

const PeekCTABtn = styled.button`
  flex-shrink: 0;
  background: #ff385c;
  color: #fff;
  border: none;
  border-radius: 9999px;
  padding: 11px 22px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.18s;
  &:hover {
    opacity: 0.88;
  }
`;

const MobileBookingFooterContainer = styled.div`
  display: none;

  ${down(BP.TABLET)} {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    bottom: 0.75rem;
    left: 0.75rem;
    right: 0.75rem;
    width: auto;
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(8px) saturate(180%);
    -webkit-backdrop-filter: blur(8px) saturate(180%);
    padding: 0.5rem 1rem;
    border: 1px solid rgba(255, 255, 255, 0.125);
    border-radius: 12px;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
    z-index: 100;
    max-width: ${MOBILE_STICKY_FOOTER_MAX_WIDTH_PX}px;
    margin-left: auto;
    margin-right: auto;
    transition:
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.3s ease;

    &[data-hidden="true"] {
      transform: translateY(calc(100% + 2rem));
      opacity: 0;
      pointer-events: none;
    }
  }
`;

const FooterPriceInfo = styled.div`
  display: flex;
  flex-direction: column;
  padding-right: 1.25rem;
  line-height: 1.2;
`;

const FooterPrice = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: #222;

  span {
    font-size: 0.8rem;
    font-weight: 400;
    color: #717171;
  }
`;

/* Curved easing: smooth motion, no straight lines */
const easeCurve = [0.33, 1, 0.68, 1];
const easeCurveOut = [0.4, 0, 0.2, 1];

/* Mobile-only: Best Price disclaimer — expands from footer toward lower center, then collapses to bookmark */
const MobileBestPricePopUpWrapper = styled(motion.div)`
  display: none;
  ${down(BP.TABLET)} {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    z-index: 99;
    box-sizing: border-box;
    background: rgba(240, 240, 242, 0.72);
    backdrop-filter: blur(10px) saturate(160%);
    -webkit-backdrop-filter: blur(10px) saturate(160%);
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    color: #222;
    font-size: 0.8rem;
    font-weight: 600;
    pointer-events: auto;
    min-height: 48px;

    /* Bookmark: match footer glass, thinner, single-line feel */
    &[data-bookmark="true"] {
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(8px) saturate(180%);
      -webkit-backdrop-filter: blur(8px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.125);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
      min-height: 36px;
      font-size: 0.75rem;
    }

    lord-icon {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      margin-right: 0.4rem;
    }
    &[data-bookmark="true"] lord-icon {
      width: 18px;
      height: 18px;
      margin-right: 0.35rem;
    }
  }
`;

/* Expanded: two lines */
const MobileBestPriceLines = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.25;
`;

/* Bookmark: single line "Best Price Guaranteed" */
const MobileBestPriceSingleLine = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.25;
  white-space: nowrap;
`;

const DesktopHeaderWrapper = styled.div`
  display: block;
  position: sticky;
  top: 0;
  z-index: 100;
  ${down(BP.MOBILE)} {
    display: none;
  }
`;

const PageSectionTitle = styled.h2`
  font-size: clamp(20px, 0.95rem + 1.5vw, 23px);
  font-weight: 600;
  color: #111111;
  margin: 0 0 1rem 0;
  line-height: 1.25;
  ${down(BP.MOBILE)} {
    margin-bottom: 0.75rem;
  }
`;

const MapSectionWrapper = styled.section.attrs({ className: "map-section-wrapper" })`
  /* Override globals.css .map-section-wrapper for this component */
  &.map-section-wrapper {
    margin-top: 0;
    margin-bottom: 0;
    padding: 0;
  }

  ${down(BP.MOBILE)} {
    &.map-section-wrapper {
      padding: 1rem;
      margin-top: 0;
      margin-bottom: 0;
    }
  }
`;

const SectionDividerAnt = styled(Divider)`
  margin: 2rem 0 !important;
  ${down(BP.MOBILE)} {
    margin: 0.5rem 0 !important;
  }
`;

const MapInnerContainer = styled.div`
  height: 400px;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;

  ${down(BP.MOBILE)} {
    height: 300px;
  }
`;

const AddressDisplay = styled.p`
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  margin-top: 1rem;
  padding: 0 1rem;
`;

const letterVariants = {
  initial: { scale: 1, color: "#222" },
  animate: (i) => ({
    scale: [1, 1.25, 1],
    color: ["#222", "#fc3552", "#222"],
    transition: {
      duration: 0.3,
      delay: i * 0.03,
      ease: "easeInOut",
    },
  }),
};

/* --- Mobile Reserve flow: "Upcoming availability" preview strip (mobile only) --- */
const WhenSection = styled.section`
  display: none;

  ${down(BP.TABLET)} {
    display: block;
    margin-bottom: 1.5rem;
    padding: 0 1rem;
  }
`;

const AvailabilityStripHeader = styled.h2`
  font-size: 28px;
  font-weight: 800;
  color: #000000;
  letter-spacing: -0.01em;
  margin: 0 0 16px 0;
`;

const AvailabilityStrip = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 4px 0 8px;
  -webkit-overflow-scrolling: touch;
  mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 4px,
    #000 calc(100% - 24px),
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 4px,
    #000 calc(100% - 24px),
    transparent 100%
  );

  &::-webkit-scrollbar {
    display: none;
  }
`;

const AvailabilityCard = styled.button`
  flex: 0 0 auto;
  width: 220px;
  min-height: 120px;
  padding: 20px;
  border-radius: 16px;
  background: #ffffff;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: transform 120ms ease, box-shadow 120ms ease;

  &:active {
    transform: scale(0.98);
  }
`;

const AvailabilityCardDate = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #000000;
`;

const AvailabilityCardTime = styled.span`
  font-size: 15px;
  font-weight: 400;
  color: #3d3d3d;
  margin-top: 2px;
`;

const AvailabilityCardSpots = styled.span`
  font-size: 15px;
  font-weight: 400;
  color: #3d3d3d;
  margin-top: 14px;
`;

const AvailabilityStripDivider = styled.div`
  height: 1px;
  background: #ebebeb;
  margin: 0 0 20px 0;
`;

/* --- Mobile drawers chrome + theme live in ./mobileBookingStyles.js (imported above). --- */
const ParticipantsDrawerHint = styled.p`
  margin: 0 1rem 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
`;

/* --- Participants edit drawer (mobile reserve flow, same pattern as checkout) ---
   ParticipantsStepperBtn/Value now live in ./mobileBookingStyles.js (imported above). */
const ParticipantsStepperWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 24px 1rem;
`;
const ParticipantsApplyButton = styled.button`
  margin: 0 1rem 1.5rem;
  padding: 14px 24px;
  background: #ff385c;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #e62e4e;
  }
`;

/* --- Mobile Reserve footer (replaces Select Time when slot is chosen) --- */
const ReserveFooterContainer = styled.div`
  display: none;
  @media (max-width: ${MOBILE_RESERVE_BREAKPOINT}px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    bottom: 0.75rem;
    left: 0.75rem;
    right: 0.75rem;
    width: auto;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(12px) saturate(180%);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
    padding: 0.75rem 1rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 14px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    z-index: 100;
    max-width: ${MOBILE_STICKY_FOOTER_MAX_WIDTH_PX}px;
    margin-left: auto;
    margin-right: auto;
    &[data-hidden="true"] {
      transform: translateY(calc(100% + 2rem));
      opacity: 0;
      pointer-events: none;
    }
  }
`;
const ReserveFooterSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-right: 0.75rem;
  min-width: 0;
`;
const ReserveFooterPrice = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: #111;
`;
const ReserveFooterMeta = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const ReserveButton = styled(AntButton)`
  flex-shrink: 0;
  border-radius: 10px;
  font-weight: 600;
  height: 44px;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
  font-size: 0.9375rem;
`;

/* Footer layout constants (match MobileBookingFooterContainer) */
const FOOTER_BOTTOM_REM = 0.75;
const FOOTER_HEIGHT_PX = 52;
const FOOTER_MARGIN_REM = 0.75;

function MobileBestPricePopUp({ visible, onComplete }) {
  const [phase, setPhase] = useState("expanding"); // 'expanding' | 'expanded' | 'bookmark'
  const [letterAnimationStarted, setLetterAnimationStarted] = useState(false);
  const [footerWidthPx, setFooterWidthPx] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const marginPx = FOOTER_MARGIN_REM * 16;
    const update = () => {
      const vw = window.innerWidth;
      const raw = vw - 2 * marginPx;
      setFooterWidthPx(Math.min(raw, MOBILE_STICKY_FOOTER_MAX_WIDTH_PX));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!visible) return;
    setPhase("expanding");
    setLetterAnimationStarted(false);
  }, [visible]);

  /* After expand animation, play letters and stay in expanded until interact/scroll */
  const handleExpandComplete = useCallback(() => {
    setPhase("expanded");
    setLetterAnimationStarted(true);
  }, []);

  /* Scroll or interaction: collapse to bookmark with curved motion */
  useEffect(() => {
    if (!visible || phase !== "expanded") return;

    const handleCollapse = () => setPhase("bookmark");

    let scrollTop = typeof window !== "undefined" ? window.scrollY : 0;
    const onScroll = () => {
      if (Math.abs(window.scrollY - scrollTop) > 8) handleCollapse();
      scrollTop = window.scrollY;
    };

    const onInteract = (e) => {
      /* Ignore clicks on the footer CTA (Book button) so user can tap without collapsing */
      const target = e.target?.closest?.("[data-mobile-footer-cta]");
      if (target) return;
      handleCollapse();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onInteract, { passive: true });
    window.addEventListener("click", onInteract);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("click", onInteract);
    };
  }, [visible, phase]);

  const line1 = "Best Price";
  const line2 = "Guaranteed";
  const singleLineText = "Best Price Guaranteed";

  if (!visible) return null;

  /* Expanded: lower-center card (grows from footer). Bookmark: strip above footer, same width as footer. */
  const isBookmark = phase === "bookmark";
  const footerBottomPx = FOOTER_BOTTOM_REM * 16;
  const footerTop = footerBottomPx + FOOTER_HEIGHT_PX;
  const vw =
    typeof window !== "undefined" ? window.innerWidth : 400;
  /* Explicit pixel width so we never use "auto" — avoids width snap at end of animation */
  const fullWidth = footerWidthPx > 0 ? footerWidthPx : 300;
  /* Bookmark slightly narrower than footer (15px inset each side) */
  const bookmarkWidth = fullWidth - 30;
  /* Centered sticky footer: bookmark strip aligns with footer center */
  const bookmarkLeftPx = vw / 2 - bookmarkWidth / 2;
  /* Left edge when 200px card is centered */
  const centerLeftPx = vw / 2 - 100;

  /* Expand FROM the price: start as a small pill at the footer (centered), then grow to card. */
  const isExpanding = phase === "expanding";
  const isExpanded = phase === "expanded";

  /* Start: small at the price (footer), centered — expands from there */
  const PRICE_PILL_WIDTH = 72;
  const footerState = {
    left: "50%",
    right: "auto",
    width: PRICE_PILL_WIDTH,
    bottom: footerTop,
    minHeight: 48,
    padding: "0.5rem 1rem",
    borderRadius: "12px",
    scale: 0.7,
    scaleY: 0.25,
    opacity: 0.85,
    x: "-50%",
  };
  /* Paused state in pixels so collapse starts here and can expand symmetrically (left = center - width/2). Raised so expanded card finishes higher on mobile. */
  const expandedBottomOffset = 40;
  const centerState = {
    left: centerLeftPx,
    right: "auto",
    width: 200,
    bottom: footerTop + expandedBottomOffset,
    minHeight: 48,
    padding: "0.75rem 1rem",
    borderRadius: "12px",
    scale: 1,
    scaleY: 1,
    opacity: 1,
    x: 0,
  };
  /* Bookmark strip sits slightly above footer so "animates down" doesn't end too low */
  const bookmarkBottomOffset = 10;
  const bookmarkState = {
    left: bookmarkLeftPx,
    right: "auto",
    width: bookmarkWidth,
    bottom: footerTop + bookmarkBottomOffset,
    padding: "0.35rem 1rem",
    borderRadius: "10px 10px 0 0",
    scale: 1,
    scaleY: 1,
    opacity: 1,
    x: 0,
    minHeight: 36,
  };

  /* Collapse: stay at centerLeftPx (centered) while moving down, then expand both ways to full width */
  const collapseAnimate =
    phase === "bookmark"
      ? {
          ...bookmarkState,
          bottom: [footerTop + expandedBottomOffset, footerTop + 16, footerTop + bookmarkBottomOffset],
          scale: [1, 0.98, 1],
          minHeight: [48, 40, 36],
          width: [200, 200, bookmarkWidth],
          left: [centerLeftPx, centerLeftPx, bookmarkLeftPx],
          x: 0,
        }
      : null;

  const collapseTransition = {
    duration: 0.5,
    ease: easeCurveOut,
    times: [0, 0.6, 1], /* stay centered until 60%, then expand to bookmark */
  };

  /* Expand FROM price: small pill at footer -> full card at lower center */
  const expandTransition = {
    duration: 0.7,
    ease: easeCurve,
    times: [0, 0.5, 1],
  };
  const expandAnimate = isExpanding
    ? {
        ...centerState,
        bottom: [footerTop, footerTop + 28, footerTop + expandedBottomOffset],
        scale: [0.7, 0.94, 1],
        scaleY: [0.25, 0.96, 1],
        opacity: [0.85, 1, 1],
        minHeight: [48, 48, 48],
        width: [PRICE_PILL_WIDTH, 160, 200],
      }
    : null;

  return (
    <MobileBestPricePopUpWrapper
      aria-live="polite"
      data-bookmark={isBookmark || undefined}
      initial={isExpanding ? footerState : false}
      animate={
        isBookmark
          ? collapseAnimate || bookmarkState
          : isExpanding
            ? expandAnimate
            : isExpanded
              ? centerState
              : footerState
      }
      transition={
        isExpanding && expandAnimate
          ? expandTransition
          : isBookmark
            ? collapseTransition
            : { duration: 0.6, ease: easeCurve }
      }
      onAnimationComplete={phase === "expanding" ? handleExpandComplete : undefined}
      style={{
        transformOrigin: "bottom center",
      }}
    >
      <LordIcon
        src="https://cdn.lordicon.com/abgykmtd.json"
        trigger="in"
        state="in-label"
        colors="primary:#222"
      />
      {isBookmark ? (
        <MobileBestPriceSingleLine
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          {singleLineText.split("").map((letter, i) => (
            <motion.span
              key={`s-${i}`}
              custom={i}
              variants={letterVariants}
              initial="initial"
              animate="animate"
              style={{ display: "inline-block" }}
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          ))}
        </MobileBestPriceSingleLine>
      ) : (
        <MobileBestPriceLines>
          <div style={{ display: "flex" }}>
            {line1.split("").map((letter, i) => (
              <motion.span
                key={`1-${i}`}
                custom={i}
                variants={letterVariants}
                initial="initial"
                animate={letterAnimationStarted ? "animate" : "initial"}
                style={{ display: "inline-block" }}
              >
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </div>
          <div style={{ display: "flex" }}>
            {line2.split("").map((letter, i) => (
              <motion.span
                key={`2-${i}`}
                custom={line1.length + i}
                variants={letterVariants}
                initial="initial"
                animate={letterAnimationStarted ? "animate" : "initial"}
                style={{ display: "inline-block" }}
              >
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </div>
        </MobileBestPriceLines>
      )}
    </MobileBestPricePopUpWrapper>
  );
}

const MobileBookingFooter = ({ option, onBookNow, hidden, currencyCode = "CAD" }) => {
  if (!option) return null;

  const { schedules, booking_type } = option;
  const isCourse = booking_type === "Full Course";

  const getPriceDisplay = () => {
    if (!schedules || schedules.length === 0)
      return { display: "N/A", per: "" };
    const prices = schedules
      .map((s) => parseFloat(s.price || 0))
      .filter((p) => p > 0);
    if (prices.length === 0) return { display: "Free", per: "" };
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const minText = formatMoneyCompact(min, currencyCode).text;
    const priceDisplay =
      min === max
        ? minText
        : `${minText} - ${formatMoneyCompact(max, currencyCode).text}`;
    const perWhat = isCourse ? "course" : "person";
    return { display: priceDisplay, per: perWhat };
  };

  const { display, per } = getPriceDisplay();
  const buttonText = "Show dates";

  return (
    <MobileBookingFooterContainer data-hidden={hidden}>
      <FooterPriceInfo>
        <FooterPrice>
          {display} {per && <span>/ {per}</span>}
        </FooterPrice>
      </FooterPriceInfo>
      <AntButton
        type="primary"
        size="middle"
        data-mobile-footer-cta
        onClick={() => onBookNow(option.optionId)}
        style={{
          borderRadius: "8px",
          fontWeight: 600,
          minHeight: 44,
          height: 44,
          paddingLeft: 20,
          paddingRight: 20,
          fontSize: "0.875rem",
        }}
      >
        {buttonText}
      </AntButton>
    </MobileBookingFooterContainer>
  );
};

const MobileBookingFooterSkeleton = ({ hidden }) => (
  <MobileBookingFooterContainer data-hidden={hidden}>
    <MobileBookingFooterSkeletonBlocks />
  </MobileBookingFooterContainer>
);

export default function ClassPageClient({
  classData,
  businessData,
  initialReviews,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // We use `mounted` only for client-specific portals or overlays (like BookingModal)
  // The main content is rendered immediately for SEO.
  const [mounted, setMounted] = useState(false);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedOptionIdForModal, setSelectedOptionIdForModal] =
    useState(null);
  const [bookingModalInitialDate, setBookingModalInitialDate] =
    useState(null);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(classData.is_favorited);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [showMobileBestPriceBanner, setShowMobileBestPriceBanner] =
    useState(false);
  const [contactHostOpen, setContactHostOpen] = useState(false);
  const [peekCancellationModal, setPeekCancellationModal] = useState({
    open: false,
    text: "",
  });

  /**
   * Server-rendered class payload can be stale (Next fetch uses force-cache): if Gemini
   * finished after that snapshot, description_ai_status may still be "pending" and sections
   * missing. Merge live client fetches so structured description appears without a full refresh.
   */
  const [descriptionLive, setDescriptionLive] = useState(null);

  const classDetailForDescription = useMemo(
    () =>
      descriptionLive ? { ...classData, ...descriptionLive } : classData,
    [classData, descriptionLive],
  );

  useEffect(() => {
    setDescriptionLive(null);
  }, [classData.slug]);

  useEffect(() => {
    if (!mounted || !classData?.slug) return;
    const st = classData.description_ai_status;
    if (st !== "pending" && st !== "stale") return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;
    const intervalMs = 4000;

    const tick = async () => {
      if (cancelled || attempts >= maxAttempts) return;
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }
      attempts += 1;
      try {
        const fresh = await classService.fetchClassDetail(classData.slug);
        if (cancelled || !fresh) return;
        setDescriptionLive({
          description_summary: fresh.description_summary,
          description_sections: fresh.description_sections,
          description_ai_status: fresh.description_ai_status,
          description: fresh.description,
        });
        const hasSections =
          Array.isArray(fresh.description_sections) &&
          fresh.description_sections.length > 0;
        const done =
          fresh.description_ai_status === "ready" ||
          fresh.description_ai_status === "failed" ||
          hasSections;
        if (done) cancelled = true;
      } catch {
        /* network errors — keep polling until maxAttempts */
      }
    };

    tick();
    const id = setInterval(async () => {
      if (cancelled) {
        clearInterval(id);
        return;
      }
      await tick();
      if (cancelled || attempts >= maxAttempts) clearInterval(id);
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [mounted, classData.slug, classData.description_ai_status]);

  /* Mobile Reserve flow: pre-selected date/time, mini calendar, time drawer — state lives in useMobileReserveFlow */
  // Simulate booking options loading state if needed, or derived from props
  // Since options come from server props, they are technically loaded.
  // We keep this state to maintain existing logic if desired, or set true immediately.
  const [bookingOptionsLoaded, setBookingOptionsLoaded] = useState(
    !!(classData.options && classData.options.length > 0),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Deep links: ?optionId=&date=YYYY-MM-DD&book=true
  useEffect(() => {
    if (!mounted || !classData?.options?.length) return;
    const oidRaw = searchParams.get("optionId");
    const dateRaw = searchParams.get("date");
    const bookRaw = searchParams.get("book");
    const isoOk =
      typeof dateRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw);
    if (isoOk) setBookingModalInitialDate(dateRaw);
    if (oidRaw) {
      const n = parseInt(oidRaw, 10);
      if (
        !Number.isNaN(n) &&
        classData.options.some((o) => Number(o.optionId) === n || String(o.optionId) === String(oidRaw))
      ) {
        setSelectedOptionIdForModal(n);
      }
    }
    if (bookRaw === "true" || bookRaw === "1") {
      setIsBookingModalOpen(true);
    }
  }, [mounted, classData, searchParams]);

  // Scroll to top when opening the class page (e.g. from a scrolled list)
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    // 1. Determine a price to send to Pixel (matches your card display logic)
    let pixelPrice = 0;

    if (classData?.options?.length > 0) {
      // Find the first option that has a valid price
      const bestOption =
        classData.options.find((opt) =>
          opt.schedules?.some(
            (s) => s.price != null && parseFloat(s.price) > 0,
          ),
        ) || classData.options[0];

      // Extract price from schedule or fallback to option level
      if (bestOption) {
        const validSchedule = bestOption.schedules?.find(
          (s) => parseFloat(s.price) > 0,
        );
        const rawPrice = validSchedule ? validSchedule.price : bestOption.price;
        pixelPrice = parseFloat(rawPrice);
      }
    }

    // 2. Fire the Event (only on prod or staging with test code; staging uses test_event_code)
    const finalValue = isNaN(pixelPrice) ? 0 : pixelPrice;
    import("@/lib/metaPixel").then(({ trackPixelEvent }) => {
      trackPixelEvent("ViewContent", {
        content_name: classData.title,
        content_ids: [classData.classId],
        content_type: "product",
        value: finalValue,
        currency: classData.currency_code || "CAD",
        content_category: classData.category_name,
      });
    });

    // PostHog: Track class view (booking funnel entry point)
    posthog.capture("class_viewed", {
      class_id: classData.classId,
      class_title: classData.title,
      business_name: classData.business_name,
      category: classData.category_name,
      price: finalValue,
      currency: classData.currency_code || "CAD",
    });
  }, [classData]);

  const { user: currentUser } = useAuthUser();
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    const handleReviewsModalChange = (event) => {
      setIsReviewsModalOpen(event.detail.isOpen);
    };
    window.addEventListener(
      "reviewsModalStateChange",
      handleReviewsModalChange,
    );
    return () => {
      window.removeEventListener(
        "reviewsModalStateChange",
        handleReviewsModalChange,
      );
    };
  }, []);

  const handleBusinessClick = () => {
    if (businessData?.slug) {
      router.push(`/business/${businessData.slug}`);
    }
  };

  const handleFavoriteClick = useCallback(
    async (event) => {
      const buttonElement = event?.currentTarget;
      if (!isAuthenticated)
        return message.info("Please log in to save favorites.");
      if (isTogglingFavorite || !classData) return;

      setIsTogglingFavorite(true);
      const originalState = isFavorite;
      setIsFavorite(!originalState);

      try {
        const result = await classService.toggleFavoriteClass(
          classData.classId,
        );
        if (result.success) {
          if (!originalState && buttonElement) {
            const rect = buttonElement.getBoundingClientRect();
            const origin = {
              x: (rect.left + rect.width / 2) / window.innerWidth,
              y: (rect.top + rect.height / 2) / window.innerHeight,
            };
            confetti({
              particleCount: 80,
              spread: 70,
              origin: origin,
              colors: ["#FF385C", "#FF7A9E", "#FFFFFF", "#FEDADD"],
              zIndex: 10000,
            });
          }
        } else {
          setIsFavorite(originalState);
          message.error(result.error || "Could not update favorite status.");
        }
      } catch (error) {
        setIsFavorite(originalState);
        message.error("An error occurred. Please try again.");
      } finally {
        setIsTogglingFavorite(false);
      }
    },
    [isAuthenticated, isTogglingFavorite, isFavorite, classData],
  );

  const handleOpenShareModal = () => setIsShareModalVisible(true);
  const handleCloseShareModal = () => setIsShareModalVisible(false);

  const fullAddress = useMemo(() => {
    if (!classData) return null;
    const { location, unit_number } = classData;
    return [location, unit_number].filter(Boolean).join(", ");
  }, [classData]);

  const handleOpenBookingModal = (optionId) => {
    if (!classData) return;
    setSelectedOptionIdForModal(optionId);
    setIsBookingModalOpen(true);
  };

  const handleDirectCheckoutFromSlot = useCallback(
    (option, schedule) => {
      if (!classData?.slug || !option || !schedule) return;
      if (typeof window === "undefined") return;

      try {
        const rawMin = Number(schedule.minParticipants);
        const participantCount =
          Number.isFinite(rawMin) && rawMin >= 1 ? Math.floor(rawMin) : 1;
        const userName =
          currentUser
            ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim()
            : "";
        const slot = {
          id: schedule.instance_id ?? schedule.id ?? null,
          date: schedule.date ?? null,
          time: schedule.time ?? null,
          duration: schedule.duration ?? null,
          available_spots: schedule.available_spots ?? schedule.maxParticipants ?? null,
          price: schedule.price ?? 0,
          isCourse: option.booking_type === "Full Course",
          days: schedule.days ?? undefined,
          end_date: schedule.end_date ?? undefined,
          min_participants: participantCount,
        };

        const bookingData = {
          selectedSlots: [slot],
          participants: participantCount,
          participant_details: Array.from({ length: participantCount }, () => ({
            name: userName || "",
          })),
          notes: "",
          price: parseFloat(schedule.price || 0) || 0,
          selectedOption: option,
          userName,
          userEmail: currentUser?.email || "",
          userPhone: currentUser?.phone_number || "",
        };

        sessionStorage.setItem(
          CHECKOUT_STORAGE_KEY,
          JSON.stringify({
            classSlug: classData.slug,
            classData,
            bookingData,
          }),
        );
        router.push(`/classes/${classData.slug}/checkout`);
      } catch (error) {
        console.error("Direct checkout redirect failed:", error);
        message.error("Couldn't open checkout. Please try again.");
      }
    },
    [classData, currentUser, router],
  );

  const optionToDisplayOnCard = useMemo(() => {
    if (!classData?.options || classData.options.length === 0) return null;
    return (
      classData.options.find((opt) =>
        opt.schedules?.some((s) => s.price != null && parseFloat(s.price) > 0),
      ) || classData.options[0]
    );
  }, [classData]);

  const mobileReserve = useMobileReserveFlow(mounted, classData, optionToDisplayOnCard);

  /* ── Peek bar: show price at viewport bottom when sidebar is off-screen ─────── */
  const sidebarRef = useRef(null);   // on StickySidebar — for width/left measurement
  const cardRef    = useRef(null);   // on SidebarBookingInner — card's top edge
  const peekBarRef = useRef(null);   // on PeekBar — peek bar's top edge
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [peekBarPos, setPeekBarPos] = useState({ left: 0, width: 320 });

  /*
   * Hide the peek bar when the real card's top reaches the logical dock line at
   * the bottom of the viewport (same Y as the peek bar when it sits at bottom).
   *
   * Do NOT use peekBarRef.getBoundingClientRect().top — when the peek is slid
   * off-screen with transform, its rect moves with the transform and the
   * comparison stays wrong (peek never comes back when scrolling to top).
   */
  useEffect(() => {
    if (!mounted) return;

    const check = () => {
      if (!cardRef.current || !peekBarRef.current) return;
      const cardTop = cardRef.current.getBoundingClientRect().top;
      const peekH = peekBarRef.current.offsetHeight || 88;
      const peekTopLogical = window.innerHeight - peekH;
      // +2 px tolerance for subpixel rounding
      setSidebarVisible(cardTop <= peekTopLogical + 2);
    };

    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [mounted, bookingOptionsLoaded, optionToDisplayOnCard?.optionId]);

  /* Track sidebar column's horizontal position so the peek bar aligns perfectly */
  useEffect(() => {
    if (!mounted || !sidebarRef.current) return;

    const update = () => {
      if (!sidebarRef.current) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      const cardWidth = Math.min(rect.width, 400);
      const centerOffset = Math.max(0, (rect.width - 400) / 2);
      setPeekBarPos({
        left: rect.left + centerOffset,
        width: cardWidth,
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(sidebarRef.current);
    ro.observe(document.body);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [mounted]);

  const displayCurrency = toSchemaPriceCurrency(classData?.currency_code || "CAD");

  /* Price data for peek bar — mirrors ClassOptionCard's getPriceRange logic */
  const peekPriceDisplay = useMemo(() => {
    const schedules = optionToDisplayOnCard?.schedules || [];
    const prices = schedules
      .map((s) => parseFloat(s.price || 0))
      .filter((p) => !isNaN(p) && p > 0);
    if (!prices.length) return { amount: "Free", showFrom: false };
    const min = Math.min(...prices);
    const { text } = formatMoneyCompact(min, displayCurrency);
    return { amount: text, showFrom: true };
  }, [optionToDisplayOnCard, displayCurrency]);

  const peekPriceUnit =
    optionToDisplayOnCard?.booking_type === "Full Course" ? "/ course" : "/ guest";

  const peekCancellation = useMemo(
    () => getOptionCancellation(optionToDisplayOnCard),
    [optionToDisplayOnCard],
  );
  const peekHasCancellationPolicy = !!peekCancellation;

  const closePeekCancellationModal = useCallback(() => {
    setPeekCancellationModal({ open: false, text: "" });
  }, []);

  const showPeekCancellationPolicy = useCallback(() => {
    if (!peekCancellation) return;
    const slot = mobileReserve.mobileSelectedSlot;
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const text = getCancellationPolicyText(
      peekCancellation.policy,
      peekCancellation.refundPercentage,
      peekCancellation.customHours,
      slot?.date && slot?.time ? `${slot.date}T${slot.time}` : null,
      userTz,
      classData?.business_timezone || null,
    );
    setPeekCancellationModal({ open: true, text });
  }, [
    peekCancellation,
    mobileReserve.mobileSelectedSlot,
    classData?.business_timezone,
  ]);

  /** Deep-link query string for share / copy link (selected option + date when known). */
  const classPageShareQuery = useMemo(() => {
    const params = new URLSearchParams();
    let optionId = null;
    let dateStr = null;

    if (mobileReserve.isMobileView && optionToDisplayOnCard?.optionId != null) {
      optionId = String(optionToDisplayOnCard.optionId);
      if (mobileReserve.mobileSelectedSlot?.date) {
        dateStr = mobileReserve.mobileSelectedSlot.date;
      } else if (mobileReserve.mobileSelectedDate) {
        dateStr = getLocalYYYYMMDD(mobileReserve.mobileSelectedDate);
      }
    }
    if (selectedOptionIdForModal != null) {
      optionId = String(selectedOptionIdForModal);
    }
    if (
      bookingModalInitialDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(bookingModalInitialDate)
    ) {
      dateStr = bookingModalInitialDate;
    }

    if (optionId) params.set("optionId", optionId);
    if (dateStr) params.set("date", dateStr);
    return params.toString();
  }, [
    mobileReserve.isMobileView,
    optionToDisplayOnCard?.optionId,
    mobileReserve.mobileSelectedSlot?.date,
    mobileReserve.mobileSelectedDate,
    selectedOptionIdForModal,
    bookingModalInitialDate,
  ]);

  /* Preload review drawer chunk on mobile so Reserve button open works when tapped quickly after load */
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    if (window.innerWidth <= MOBILE_RESERVE_BREAKPOINT) {
      import("./MobileReserveReviewDrawer");
    }
  }, [mounted]);

  /* Mobile: show "Best Price Guaranteed" pop-up when options are available */
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    if (window.innerWidth > MOBILE_RESERVE_BREAKPOINT || !optionToDisplayOnCard) return;
    setShowMobileBestPriceBanner(true);
  }, [mounted, optionToDisplayOnCard]);

  const locationText = useMemo(() => {
    const venue = safeDisplayPart(classData?.location_name);
    const city = safeDisplayPart(classData?.business_city);
    const st = safeDisplayPart(classData?.business_state);
    const cityState =
      city && st ? `${city}, ${st}` : city || st || "";
    if (venue && cityState) return `${venue} · ${cityState}`;
    if (venue) return venue;
    return cityState;
  }, [classData]);

  /** Same source order as `HomeClassCard` `displayLocation` (card row truncates via CSS). */
  const cardStyleLocation = useMemo(() => {
    const loc = safeDisplayPart(classData?.location);
    const city = safeDisplayPart(classData?.city ?? classData?.business_city);
    const st = safeDisplayPart(classData?.state ?? classData?.business_state);
    if (loc) return loc;
    if (city && st) return `${city}, ${st}`;
    return city || st || "";
  }, [classData]);

  /** City, state / province — used under summary and as location row title. */
  const locationCityState = useMemo(() => {
    const city = safeDisplayPart(classData?.city ?? classData?.business_city);
    const st = safeDisplayPart(classData?.state ?? classData?.business_state);
    if (city && st) return `${city}, ${st}`;
    return city || st || "";
  }, [classData]);

  /** Tags under summary + mobile nav: same as location row title. */
  const heroTagsLine = locationCityState;

  /** Location row subtitle (gray): venue / card line / full line when it adds detail beyond city & state. */
  const locationRowSubtitle = useMemo(() => {
    const cs = locationCityState;
    const card = cardStyleLocation;
    const venue = safeDisplayPart(classData?.location_name);
    if (venue && venue !== cs) return venue;
    if (card && card !== cs) return card;
    if (locationText && locationText !== cs) return locationText;
    return "";
  }, [classData, locationCityState, cardStyleLocation, locationText]);

  return (
    <>
      <DesktopHeaderWrapper>
        <ExploreHeader showOptionsWrapper={false} />
      </DesktopHeaderWrapper>
      <ClassPageImagesTitle
        title={classData.title}
        images={classData.images || []}
        rating={classData.average_rating}
        business_name={businessData?.businessName}
        location={locationText}
        isShareModalVisible={isShareModalVisible}
        onShareModalClose={handleCloseShareModal}
        isFavorite={isFavorite}
        isTogglingFavorite={isTogglingFavorite}
        onFavoriteClick={handleFavoriteClick}
        onShareClick={handleOpenShareModal}
        shareUrlQueryString={classPageShareQuery}
        descriptionSummary={classDetailForDescription.description_summary}
        heroTagsLine={heroTagsLine}
        businessData={businessData}
        onBusinessClick={businessData ? handleBusinessClick : undefined}
        onContactHost={
          businessData ? () => setContactHostOpen(true) : undefined
        }
        partnerTierName={businessData?.partner_tier_name}
        reviewCount={classData.review_count || 0}
        averageRating={classData.average_rating || 0}
        locationHeadline={locationCityState}
        locationSubline={locationRowSubtitle}
      />
      <ContentWrapper>
        <MainContentLayout>
          <PrimaryContentArea>
            {mobileReserve.isMobileView && mobileReserve.mobileAvailabilityError && (
              <Alert
                type="warning"
                showIcon
                message="Couldn't load times"
                description="Check your connection and try refreshing the page."
                style={{ marginBottom: 16 }}
              />
            )}
            {/* Render Description immediately for SEO */}
            <ClassInformation
              description={classDetailForDescription.description}
              descriptionSections={classDetailForDescription.description_sections}
            />

            <SectionDividerAnt />

            {/* Suspense fallback for client-heavy components */}
            <Suspense fallback={<ClassPageDeferredSkeleton />}>
              {mobileReserve.isMobileView && optionToDisplayOnCard && (
                <>
                  <WhenSection id="when-section">
                    <AvailabilityStripDivider />
                    <AvailabilityStripHeader>Upcoming availability</AvailabilityStripHeader>
                    {mobileReserve.mobileSlotsLoading ? (
                      <div style={{ color: "#717171", fontSize: 14, padding: "8px 0" }}>
                        Loading availability…
                      </div>
                    ) : (
                      <AvailabilityStrip>
                        {(() => {
                          // Build preview cards: first slot of each of the first ~6 available dates.
                          const slots = mobileReserve.mobileAvailableSlots || {};
                          const minStr = mobileReserve.mobileMinSelectableDate
                            ? getLocalYYYYMMDD(mobileReserve.mobileMinSelectableDate)
                            : null;
                          const dates = Object.keys(slots)
                            .filter((d) => !minStr || d >= minStr)
                            .filter((d) => Array.isArray(slots[d]) && slots[d].length > 0)
                            .sort()
                            .slice(0, 6);
                          if (dates.length === 0) {
                            return (
                              <div style={{ color: "#717171", fontSize: 14, padding: "8px 0" }}>
                                No upcoming availability.
                              </div>
                            );
                          }
                          return dates.map((dateStr) => {
                            const slot = slots[dateStr][0];
                            return (
                              <AvailabilityCard
                                key={dateStr}
                                type="button"
                                onClick={() => {
                                  const [y, m, d] = dateStr.split("-").map(Number);
                                  mobileReserve.handleOpenSelectTimeModalForDate(
                                    new Date(y, m - 1, d),
                                  );
                                }}
                              >
                                <AvailabilityCardDate>
                                  {formatSectionHeaderPreview(dateStr)}
                                </AvailabilityCardDate>
                                <AvailabilityCardTime>
                                  {formatTimeRangeForDisplay(
                                    dateStr,
                                    slot.time,
                                    slot.duration,
                                    classData?.business_timezone || "Etc/UTC",
                                    Intl.DateTimeFormat().resolvedOptions().timeZone,
                                  )}
                                </AvailabilityCardTime>
                                <AvailabilityCardSpots>
                                  {slot.available_spots}{" "}
                                  {slot.available_spots === 1 ? "spot" : "spots"} available
                                </AvailabilityCardSpots>
                              </AvailabilityCard>
                            );
                          });
                        })()}
                      </AvailabilityStrip>
                    )}
                  </WhenSection>
                  {!classData.coordinates && <SectionDividerAnt />}
                </>
              )}
              {classData.coordinates && (
                <>
                  {mobileReserve.isMobileView && optionToDisplayOnCard && (
                    <SectionDividerAnt />
                  )}
                  <MapSectionWrapper>
                    <PageSectionTitle>Where you&apos;ll be</PageSectionTitle>
                    <MapInnerContainer>
                      <ClassPageMap
                        key={`class-map:${classData.slug}:${classData.coordinates}:${classData.saltLocation ? "1" : "0"}`}
                        coordinates={classData.coordinates}
                        saltLocation={classData.saltLocation}
                        businessName={
                          businessData?.businessName || classData.title
                        }
                        fullAddress={!classData.saltLocation ? fullAddress : null}
                      />
                    </MapInnerContainer>
                    {!classData.saltLocation && fullAddress && (
                      <AddressDisplay>{fullAddress}</AddressDisplay>
                    )}
                  </MapSectionWrapper>
                </>
              )}
              {classData.coordinates && <SectionDividerAnt />}
              <Reviews
                slug={classData.slug}
                initialRating={classData.average_rating || 0}
                initialReviewCount={classData.review_count || 0}
                platformReviewCount={classData.platform_review_count || 0}
                serverReviews={initialReviews || null}
              />
              <SectionDividerAnt />
              <ClassOffers
                features={
                  Array.isArray(classData.features) ? classData.features : []
                }
              />
              <SectionDividerAnt />
              {businessData && (
                <HostInfo
                  businessData={businessData}
                  onMessageHost={() => setContactHostOpen(true)}
                />
              )}
            </Suspense>
          </PrimaryContentArea>

          <StickySidebar ref={sidebarRef}>
            <SidebarBookingInner ref={cardRef}>
              {!bookingOptionsLoaded ? (
                <ClassSidebarBookingSkeleton />
              ) : optionToDisplayOnCard ? (
                <ClassOptionsContainer
                  options={[optionToDisplayOnCard]}
                  classTitle={classData.title}
                  classImages={classData.images}
                  currency={displayCurrency}
                  onBookNow={handleOpenBookingModal}
                  onSelectSlot={handleDirectCheckoutFromSlot}
                  businessTimeZone={classData?.business_timezone}
                />
              ) : null}
            </SidebarBookingInner>
          </StickySidebar>
        </MainContentLayout>
      </ContentWrapper>
      {/* Desktop peek bar: price peeks at bottom of viewport until sidebar scrolls into view */}
      {mounted && optionToDisplayOnCard && (
        <PeekBar
          ref={peekBarRef}
          $visible={!sidebarVisible}
          style={{ left: peekBarPos.left, width: peekBarPos.width }}
        >
          <PeekPriceStack>
            <PeekPriceLine>
              {peekPriceDisplay.showFrom && <PeekPriceFrom>From </PeekPriceFrom>}
              <PeekPriceAmount>{peekPriceDisplay.amount}</PeekPriceAmount>
              <PeekPriceUnit>{peekPriceUnit}</PeekPriceUnit>
            </PeekPriceLine>
            {peekHasCancellationPolicy && (
              <PeekCancellation
                type="button"
                aria-label="View cancellation policy"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  showPeekCancellationPolicy();
                }}
              >
                Cancellation Policy
              </PeekCancellation>
            )}
          </PeekPriceStack>
          <PeekCTABtn
            onClick={() =>
              handleOpenBookingModal(optionToDisplayOnCard.optionId)
            }
          >
            Reserve
          </PeekCTABtn>
        </PeekBar>
      )}

      {/* Render portals / overlays only after mount to avoid hydration mismatch on body append */}
      {mounted && (
        <>
          {businessData && (
            <ContactHostDrawer
              open={contactHostOpen}
              onOpenChange={setContactHostOpen}
              businessId={businessData.businessId}
              businessName={businessData.businessName}
              classId={classData?.classId}
              classTitle={classData?.title}
            />
          )}
          <Modal
            title="Cancellation Policy"
            open={peekCancellationModal.open}
            onCancel={closePeekCancellationModal}
            footer={
              <AntButton type="primary" onClick={closePeekCancellationModal}>
                Close
              </AntButton>
            }
            zIndex={Z_CLASS_HOST_AND_POLICIES}
            centered
            width={440}
            destroyOnClose
          >
            <div
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
              }}
            >
              {peekCancellationModal.text}
            </div>
          </Modal>
          {showMobileBestPriceBanner && (
            <MobileBestPricePopUp
              visible={showMobileBestPriceBanner}
              onComplete={() => setShowMobileBestPriceBanner(false)}
            />
          )}

          {/* Mobile Footer Logic */}
          {optionToDisplayOnCard && mounted && (
            mobileReserve.mobileSlotsLoading ? (
              <MobileBookingFooterSkeleton hidden={isReviewsModalOpen} />
            ) : mobileReserve.mobileSelectedSlot ? (
              mobileReserve.isMobileView && (
                <ReserveFooterContainer data-hidden={isReviewsModalOpen}>
                  <ReserveFooterSummary>
                    <ReserveFooterPrice>
                      {mobileReserve.mobileSelectedSlot.price != null && parseFloat(mobileReserve.mobileSelectedSlot.price) > 0
                        ? formatMoneyCompact(
                            parseFloat(mobileReserve.mobileSelectedSlot.price),
                            displayCurrency,
                          ).text
                        : "Free"}
                      <span style={{ fontWeight: 400, color: "#6b7280", fontSize: "0.8rem" }}>
                        {" "}
                        {optionToDisplayOnCard?.booking_type === "Full Course"
                          ? "/ course"
                          : "/ guest"}
                      </span>
                    </ReserveFooterPrice>
                    <ReserveFooterMeta>
                      {formatNaiveDate(mobileReserve.mobileSelectedSlot.date, "EEE, MMM d")} ·{" "}
                      {formatTimeRangeForDisplay(
                        mobileReserve.mobileSelectedSlot.date,
                        mobileReserve.mobileSelectedSlot.time,
                        mobileReserve.mobileSelectedSlot.duration,
                        classData?.business_timezone || "Etc/UTC",
                        Intl.DateTimeFormat().resolvedOptions().timeZone
                      )}
                      {` · ${mobileReserve.mobileParticipants} guest${mobileReserve.mobileParticipants !== 1 ? "s" : ""}`}
                    </ReserveFooterMeta>
                  </ReserveFooterSummary>
                  <ReserveButton type="primary" onClick={mobileReserve.handleReserveClick}>
                    Reserve
                  </ReserveButton>
                </ReserveFooterContainer>
              )
            ) : (
              <MobileBookingFooter
                option={optionToDisplayOnCard}
                onBookNow={() => mobileReserve.handleOpenSelectTimeModal()}
                hidden={isReviewsModalOpen}
                currencyCode={displayCurrency}
              />
            )
          )}

          {/* Unified "Select a time" modal (replaces the old separate date + time drawers).
              Opens from the footer "Show dates" button and from edit-date/edit-time in the
              reserve-review summary. Slot selection closes this modal and opens the review drawer. */}
          <SelectTimeModal
            open={mobileReserve.mobileSelectTimeModalOpen}
            onOpenChange={mobileReserve.handleSelectTimeModalOpenChange}
            onDateSelect={mobileReserve.setMobileSelectedDate}
            availableSlots={mobileReserve.mobileAvailableSlots}
            loading={mobileReserve.mobileSlotsLoading}
            selectedDate={mobileReserve.mobileSelectedDate}
            selectedSlot={mobileReserve.mobileSelectedSlot}
            participants={mobileReserve.mobileParticipants}
            participantsMax={mobileReserve.mobileParticipantsMax}
            onParticipantsChange={(n) => {
              mobileReserve.setMobileParticipantsDraft(n);
              mobileReserve.setMobileParticipants(n);
            }}
            onSelectSlot={mobileReserve.handleSelectTimeModalSlot}
            minSelectableDate={mobileReserve.mobileMinSelectableDate}
            today={mobileReserve.mobileToday}
            businessTimezone={classData?.business_timezone || "Etc/UTC"}
            currency={displayCurrency}
            option={optionToDisplayOnCard}
            initialCalendarExpanded={mobileReserve.mobileCalendarExpanded}
            scrollToDate={mobileReserve.mobileScrollToDate}
          />

          {/* Participants drawer: open from Edit guests in review drawer; closing reopens review. */}
          <Drawer.Root
            open={mobileReserve.mobileParticipantsDrawerOpen}
            onOpenChange={mobileReserve.createEditDrawerOnOpenChange(mobileReserve.setMobileParticipantsDrawerOpen)}
            shouldScaleBackground
          >
            <Drawer.Portal>
              <MobileDrawerOverlay />
              <MobileDrawerContent>
                <MobileDrawerHandle />
                <MobileDrawerTitle>Number of guests</MobileDrawerTitle>
                <ParticipantsDrawerHint>
                  Up to {mobileReserve.mobileParticipantsMax} guests for this time slot.
                </ParticipantsDrawerHint>
                <ParticipantsStepperWrap>
                  <ParticipantsStepperBtn
                    type="button"
                    disabled={mobileReserve.mobileParticipantsDraft <= 1}
                    onClick={() => mobileReserve.setMobileParticipantsDraft((n) => Math.max(1, n - 1))}
                    aria-label="Decrease guests"
                  >
                    −
                  </ParticipantsStepperBtn>
                  <ParticipantsStepperValue>{mobileReserve.mobileParticipantsDraft}</ParticipantsStepperValue>
                  <ParticipantsStepperBtn
                    type="button"
                    disabled={mobileReserve.mobileParticipantsDraft >= mobileReserve.mobileParticipantsMax}
                    onClick={() => mobileReserve.setMobileParticipantsDraft((n) => Math.min(mobileReserve.mobileParticipantsMax, n + 1))}
                    aria-label="Increase guests"
                  >
                    +
                  </ParticipantsStepperBtn>
                </ParticipantsStepperWrap>
                <ParticipantsApplyButton
                  type="button"
                  onClick={mobileReserve.handleParticipantsApply}
                >
                  Apply
                </ParticipantsApplyButton>
              </MobileDrawerContent>
            </Drawer.Portal>
          </Drawer.Root>

          <MobileReserveReviewDrawer
            open={mobileReserve.mobileReviewDrawerOpen}
            onClose={() => mobileReserve.setMobileReviewDrawerOpen(false)}
            classData={classData}
            reserveData={{
              selectedSlot: mobileReserve.mobileSelectedSlot,
              selectedOption: optionToDisplayOnCard,
              participants: mobileReserve.mobileParticipants,
            }}
            onEditDate={mobileReserve.handleMobileEditDate}
            onEditTime={mobileReserve.handleMobileEditTime}
            onEditGuests={mobileReserve.handleMobileEditGuests}
          />

          {isBookingModalOpen && (
            <BookingModal
              isOpen={isBookingModalOpen}
              onClose={() => {
                setIsBookingModalOpen(false);
                setBookingModalInitialDate(null);
              }}
              classData={classData}
              optionId={selectedOptionIdForModal}
              initialParticipantCount={1}
              initialScheduleDate={bookingModalInitialDate}
            />
          )}
        </>
      )}
    </>
  );
}