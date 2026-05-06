"use client";

import React, { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import styled, { css, keyframes } from "styled-components";
import { BP, down, up, between } from "@/styles/breakpoints";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

/** Soft elevation under lightbox UI icons (same as ClassPageImagesTitle). */
const iconDropShadow = css`
  filter: drop-shadow(0 3px 8px rgba(15, 23, 42, 0.18))
    drop-shadow(0 2px 4px rgba(15, 23, 42, 0.1));
`;

// --- Constants & Placeholders ---
const PLACEHOLDER_IMAGES = [
  "https://i.imgur.com/vL2za35.png",
  "https://i.imgur.com/Kned4kE.png",
  "https://i.imgur.com/X3SVGsv.png",
  "https://i.imgur.com/tdUN3iQ.png",
  "https://i.imgur.com/vL2za35.png",
];

/** Narrow wrapper for comparison-table headers; bento + lightbox unchanged. */
const CompactOuter = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  box-sizing: border-box;

  ${({ $compact }) =>
    $compact &&
    css`
      max-width: 148px;
      margin-left: auto;
      margin-right: auto;
    `}
`;

const HeroBentoWrap = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: flex-start;
  box-sizing: border-box;

  ${down(BP.MOBILE)} {
    padding: 0 16px 12px;
  }

  ${up(BP.MOBILE)} {
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

  ${down(BP.MOBILE)} {
    border-radius: 22px;
    aspect-ratio: 1;
    height: auto;
    min-height: 0;
  }

  /* Tablet portrait / large “mobile” layout (~756px): square was nearly full-width — cap size */
  ${between(540, BP.MOBILE)} {
    max-width: min(520px, calc(100vw - 32px));
    margin-left: auto;
    margin-right: auto;
  }

  ${up(BP.MOBILE)} {
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

  ${up(BP.MOBILE)} {
    border-radius: 9px;
  }
`;

const BentoImageInner = styled.div`
  position: absolute;
  inset: 0;
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
  isolation: isolate;
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
  z-index: 100;
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
  z-index: 100;
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

  /* Keep arrows visible on narrow viewports (class page hides them — shortlist expects tap targets). */
  ${down(BP.MOBILE)} {
    width: 40px;
    height: 40px;
    ${({ $side }) =>
      $side === "left"
        ? css`
            left: 10px;
          `
        : css`
            right: 10px;
          `}
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
  z-index: 100;
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
  z-index: 100;
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
  z-index: 100;
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

  ${up(BP.MOBILE)} {
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
                    sizes={`(max-width: ${BP.MOBILE}px) 50vw, 42vw`}
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

/**
 * Same bento grid, FLIP lightbox, and masonry gallery as the class page hero (ClassPageImagesTitle).
 *
 * @param {boolean} compact - constrain bento width (shortlist table column).
 * @param {boolean} usePlaceholders - when false and images empty, shows an empty gray tile instead of demo placeholders.
 */
export default function ClassPageHeroImageBlock({
  images,
  title,
  compact = false,
  usePlaceholders = true,
}) {
    const classImages =
      Array.isArray(images) && images.length > 0 ? images : [];
    const imagesToDisplay =
      classImages.length === 0
        ? usePlaceholders
          ? PLACEHOLDER_IMAGES
          : [null]
        : classImages;
    const usePlaceholderFlag =
      classImages.length === 0 && usePlaceholders;

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
      const check = () => {
        setWindowDim({ w: window.innerWidth, h: window.innerHeight });
      };
      check();
      window.addEventListener("resize", check);
      return () => window.removeEventListener("resize", check);
    }, []);
    useEffect(() => {
      imageDimsRef.current = imageDims;
    }, [imageDims]);
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

    const galleryInputLocked =
      galleryOpening ||
      galleryExitPending ||
      (galleryOpen && galleryPhase !== "revealed");
    const allImagesLocked =
      galleryOpening || (galleryOpen && galleryPhase !== "revealed");
    const hasOpeningFlipProxy = Boolean(openingFlipProxy?.src);

    return (
      <>
        <CompactOuter $compact={compact}>
          <BentoGridInner
            ref={bentoGridRef}
            imagesToDisplay={imagesToDisplay}
            usePlaceholders={usePlaceholderFlag}
            title={title}
            onImageClick={openLightbox}
          />
        </CompactOuter>

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
                  <Image
                    src={openingFlipProxy.src}
                    alt=""
                    width={Math.max(1, Math.round(openingFlipProxy.width || 1))}
                    height={Math.max(1, Math.round(openingFlipProxy.height || 1))}
                    unoptimized
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </OpeningFlipProxy>
              )}
            </LightboxOverlay>,
            document.body,
          )}

      </>
    );
}
