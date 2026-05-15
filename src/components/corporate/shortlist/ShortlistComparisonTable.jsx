"use client";

import Link from "next/link";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Sparkles, Wallet } from "lucide-react";
import ClassPageHeroImageBlock from "@/app/classes/_components/ClassPageHeroImageBlock";
import { formatMoney } from "./formatMoney";

/** Match Plan & Billing tab tokens (`PlanBillingSettingsTab.jsx`) */
const T = {
  text: "#111827",
  sub: "#6B7280",
  border: "#E5E7EB",
  rowLine: "#F3F4F6",
  bgMuted: "#F9FAFB",
  white: "#FFFFFF",
};

/** Highlight fill — lighter than `rowLine` (#F3F4F6) so bottom borders stay visible */
const COL_HIGHLIGHT = T.bgMuted;

/** Subtle band for Experience body rows (label + cells stay aligned). */
const SECTION_EXP = "#FAFAFA";

function computePricingBreakdown(totalCents, depPct) {
  const t = Number(totalCents) || 0;
  const p = Math.min(100, Math.max(1, Number(depPct) || 25));
  const dep = Math.max(1, Math.round((t * p) / 100));
  return {
    depositCents: dep,
    balanceCents: Math.max(0, t - dep),
  };
}

function formatDurationMinutes(minutes) {
  if (minutes == null || minutes === "") return "";
  const n = Number(minutes);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 60) return `${Math.round(n)} min`;
  const h = Math.floor(n / 60);
  const m = Math.round(n % 60);
  if (m === 0) return h === 1 ? "1 hr" : `${h} hrs`;
  return `${h} hr ${m} min`;
}

function formatHeadcountRange(minHc, maxHc) {
  const lo = minHc != null && minHc !== "" ? Number(minHc) : null;
  const hi = maxHc != null && maxHc !== "" ? Number(maxHc) : null;
  const hasLo = lo != null && Number.isFinite(lo) && lo > 0;
  const hasHi = hi != null && Number.isFinite(hi) && hi > 0;
  if (hasLo && hasHi) return lo === hi ? `${lo}` : `${lo}–${hi}`;
  if (hasLo) return `${lo}+`;
  if (hasHi) return `Up to ${hi}`;
  return "";
}

function formatInclusionsLine(list) {
  if (!Array.isArray(list)) return "";
  const parts = list.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean);
  return parts.join(" · ");
}

function formatOneProposedDate(entry) {
  if (entry == null) return "";
  if (typeof entry === "string") {
    const t = Date.parse(entry);
    if (!Number.isNaN(t)) {
      try {
        return new Intl.DateTimeFormat(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(t));
      } catch {
        return entry.trim();
      }
    }
    return entry.trim();
  }
  if (typeof entry === "object") {
    if (entry.label) return String(entry.label);
    if (entry.start || entry.datetime) return formatOneProposedDate(entry.start || entry.datetime);
  }
  return "";
}

function formatProposedDatesLine(arr) {
  if (!Array.isArray(arr) || !arr.length) return "";
  const bits = arr.map(formatOneProposedDate).filter(Boolean);
  return bits.join(" · ");
}

function mapsSearchUrl(query) {
  const q = String(query || "").trim();
  if (!q) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Label for the table — friendly area/venue line; link uses `maps_query` when present. */
function locationDisplayLabel(opt) {
  return String(opt.location_label || opt.location_text || "").trim();
}

function locationMapsQuery(opt) {
  return String(opt.maps_query || opt.location_text || opt.location_label || "").trim();
}

/** Same shape as class page hero (`large_url` / `thumbnail_url` chain). */
function optionToViewerImages(option) {
  const gallery = Array.isArray(option.gallery_urls) ? option.gallery_urls.filter(Boolean) : [];
  const cover = option.cover_image_url;
  const ordered = cover ? [cover, ...gallery.filter((u) => u !== cover)] : [...gallery];
  return ordered.map((u) => ({
    large_url: u,
    medium_url: u,
    thumbnail_url: u,
  }));
}

/** Same idea as `PlansBundle` + `PlanCompareScroll` in billing settings */
const CompareBundle = styled.div`
  margin-top: 0;
  border: 1px solid ${T.border};
  border-radius: 8px;
  background: ${T.white};
  overflow: hidden;
  box-shadow: none;
`;

const PlanCompareScroll = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  width: 100%;
  min-width: 0;
`;

const PlanCompareTable = styled.table`
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const PcThFeature = styled.th`
  text-align: left;
  padding: 12px 12px 12px 14px;
  font-weight: 700;
  color: ${T.text};
  border-bottom: 1px solid ${T.border};
  position: sticky;
  left: 0;
  z-index: 2;
  width: 28%;
  min-width: 0;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
  hyphens: auto;
  line-height: 1.25;
  box-shadow: 1px 0 0 ${T.border};
  vertical-align: bottom;
  background: ${T.white};

  @media (max-width: 480px) {
    width: 26%;
    padding: 10px 8px 10px 10px;
    font-size: 12px;
  }
`;

const PcThPlan = styled.th`
  text-align: center;
  padding: 12px 6px;
  font-weight: 700;
  color: ${T.text};
  border-bottom: 1px solid ${T.border};
  white-space: normal;
  vertical-align: bottom;
  width: auto;
  min-width: 0;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.2;
  background: ${(p) => (p.$highlight ? COL_HIGHLIGHT : T.white)};
  transition: background 0.15s ease;

  @media (max-width: 480px) {
    padding: 10px 4px;
    font-size: 11px;
  }
`;

const HeaderStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

const HeaderTitle = styled.span`
  display: block;
  font-weight: 700;
  font-size: 12px;
  color: ${T.text};
  line-height: 1.25;
  max-width: 100%;
`;

const PcTdFeature = styled.td`
  padding: 10px 12px 10px 14px;
  border-bottom: 1px solid ${T.rowLine};
  vertical-align: middle;
  color: #6b7280;
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.35;
  position: sticky;
  left: 0;
  background: ${(p) => {
    if (p.$highlight) return COL_HIGHLIGHT;
    if (p.$section === "experience") return SECTION_EXP;
    return T.white;
  }};
  z-index: 1;
  width: 28%;
  min-width: 0;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
  hyphens: auto;
  box-shadow: 1px 0 0 ${T.rowLine};
  transition: background 0.15s ease;

  @media (max-width: 480px) {
    width: 26%;
    padding: 8px 8px 8px 10px;
    font-size: 10px;
    letter-spacing: 0.07em;
  }
`;

const PcTdMark = styled.td`
  text-align: center;
  padding: 10px 6px;
  border-bottom: 1px solid ${T.rowLine};
  vertical-align: middle;
  color: ${T.sub};
  font-variant-numeric: tabular-nums;
  min-width: 0;
  box-sizing: border-box;
  background: ${(p) => {
    if (p.$highlight) return COL_HIGHLIGHT;
    if (p.$section === "experience") return SECTION_EXP;
    return T.white;
  }};
  transition: background 0.15s ease;

  @media (max-width: 480px) {
    padding: 8px 4px;
    font-size: 12px;
  }
`;

const PcTdMarkInner = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 22px;
`;

const PcTdMarkInnerLeft = styled.span`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  min-height: 22px;
`;

/** Full-width section band — Experience / Pricing with icon. */
const SectionHeadInner = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const SectionHeadCell = styled.th`
  padding: 10px 14px 9px 18px;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${T.text};
  background: ${T.bgMuted};
  border-top: 3px solid ${T.border};
  border-bottom: 1px solid ${T.border};
  text-align: left;

  svg {
    flex-shrink: 0;
    color: ${T.sub};
    width: 15px;
    height: 15px;
  }

  @media (max-width: 480px) {
    padding: 8px 12px 7px 14px;
    font-size: 10px;
    letter-spacing: 0.1em;

    svg {
      width: 13px;
      height: 13px;
    }
  }
`;

const TaglineClamp = styled.span`
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: center;
  line-height: 1.35;
  color: ${T.sub};
  font-size: 12px;
`;

const TaglineClampLeft = styled(TaglineClamp)`
  text-align: left;
`;

const CellMutedLeft = styled.span`
  display: block;
  width: 100%;
  text-align: left;
  line-height: 1.4;
  color: ${T.sub};
  font-size: 12px;
`;

/** Opens Google Maps — prefers full `maps_query` from the API when set. */
const LocationLink = styled.a`
  display: inline;
  width: 100%;
  text-align: left;
  line-height: 1.4;
  color: ${T.sub};
  font-size: 12px;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;

  &:hover {
    color: ${T.text};
  }

  &:focus-visible {
    outline: 2px solid #111827;
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

/** Same as `LocationLink`, centered for comparison cells that align with numeric rows. */
const LocationLinkCentered = styled(LocationLink)`
  display: inline-block;
  max-width: 100%;
  text-align: center;
`;

const CellMutedCenter = styled.span`
  display: block;
  width: 100%;
  text-align: center;
  line-height: 1.4;
  color: ${T.sub};
  font-size: 12px;
`;

const AmountStrong = styled.span`
  font-weight: 700;
  color: ${T.text};
  font-size: 14px;
`;

const ActionsInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  align-items: stretch;
`;

/** Mirrors `PriceCta` in PlanBillingSettingsTab */
const TableBtn = styled.button`
  margin-top: 0;
  width: 100%;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s, background 0.15s, border-color 0.15s;
  border: 1px solid ${({ $primary }) => ($primary ? "#000000" : T.border)};
  background: ${({ $primary }) => ($primary ? "#000000" : T.white)};
  color: ${({ $primary }) => ($primary ? "#ffffff" : T.text)};
  font-family: inherit;

  &:hover {
    opacity: 0.88;
  }

  &:focus-visible {
    outline: 2px solid #000000;
    outline-offset: 2px;
  }

  ${(p) =>
    p.$primary
      ? `
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  `
      : ""}

  @media (min-width: 900px) {
    padding: 9px 12px;
  }
`;

/** Secondary action — navigates to canonical class URL (same tab). */
const TableDetailLink = styled(Link)`
  margin-top: 0;
  width: 100%;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s, background 0.15s, border-color 0.15s;
  border: 1px solid ${T.border};
  background: ${T.white};
  color: ${T.text};
  font-family: inherit;
  text-align: center;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  &:hover {
    opacity: 0.88;
  }

  &:focus-visible {
    outline: 2px solid #000000;
    outline-offset: 2px;
  }

  @media (min-width: 900px) {
    padding: 9px 12px;
  }
`;

const MotionPcThFeature = motion(PcThFeature);
const MotionPcThPlan = motion(PcThPlan);
const MotionThead = motion.thead;
const MotionTbody = motion.tbody;
const MotionTr = motion.tr;

const theadOrchestra = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.085, delayChildren: 0.04 },
  },
};

const headCellReveal = {
  hidden: {
    opacity: 0,
    y: -18,
    filter: "blur(14px)",
    rotateX: -12,
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 28,
    },
  },
};

const tbodyOrchestra = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.034,
      delayChildren: 0.12,
    },
  },
};

/** Skew + blur spring — reads “material” settling, not a linear fade */
const tableRowReveal = {
  hidden: {
    opacity: 0,
    skewY: 1.4,
    filter: "blur(12px)",
    scale: 0.989,
  },
  visible: {
    opacity: 1,
    skewY: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 215,
      damping: 25,
      mass: 0.62,
    },
  },
};

const sectionBandReveal = {
  hidden: {
    opacity: 0,
    clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)",
    skewX: "-3deg",
  },
  visible: {
    opacity: 1,
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    skewX: "0deg",
    transition: {
      duration: 0.68,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const MotionCompareShell = styled(motion.div)`
  margin-top: 2rem;
  transform-style: preserve-3d;
  perspective: 1400px;
`;

export default function ShortlistComparisonTable({
  options,
  currency,
  depositPercent,
  highlightOption,
  onHighlight,
  onChoose,
}) {
  const n = options.length;
  if (n === 0) return null;

  const depPct = depositPercent ?? 25;
  const firstColPct = 26;
  const restPct = (100 - firstColPct) / n;

  const isHighlighted = (opt) =>
    highlightOption && String(highlightOption.id) === String(opt.id);

  const anyLocation = options.some((o) => locationDisplayLabel(o));
  const anyDuration = options.some((o) => {
    const n = Number(o.duration_minutes);
    return Number.isFinite(n) && n > 0;
  });
  const anyHeadcount = options.some((o) => {
    const a = o.min_headcount != null && o.min_headcount !== "" ? Number(o.min_headcount) : null;
    const b = o.max_headcount != null && o.max_headcount !== "" ? Number(o.max_headcount) : null;
    return (a != null && Number.isFinite(a) && a > 0) || (b != null && Number.isFinite(b) && b > 0);
  });
  const anyInclusions = options.some((o) => formatInclusionsLine(o.inclusions));
  const anyProposedDates = options.some(
    (o) => Array.isArray(o.proposed_date_options) && o.proposed_date_options.length > 0,
  );
  const anyPerPerson = options.some((o) => {
    const c = Number(o.price_per_person_cents);
    return Number.isFinite(c) && c > 0;
  });

  return (
    <MotionCompareShell
      initial={{ opacity: 0, scale: 0.979, filter: "blur(14px)", rotateX: 7 }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)", rotateX: 0 }}
      transition={{
        type: "spring",
        stiffness: 132,
        damping: 21,
        mass: 0.68,
      }}
      style={{ transformOrigin: "50% 0%" }}
    >
      <CompareBundle>
        <PlanCompareScroll>
          <PlanCompareTable>
            <colgroup>
              <col style={{ width: `${firstColPct}%` }} />
              {options.map((opt) => (
                <col key={`col-${opt.id}`} style={{ width: `${restPct}%` }} />
              ))}
            </colgroup>
            <MotionThead variants={theadOrchestra} initial="hidden" animate="visible">
              <tr style={{ transformStyle: "preserve-3d" }}>
                <MotionPcThFeature scope="col" variants={headCellReveal}>
                  Compare
                </MotionPcThFeature>
                {options.map((opt) => (
                  <MotionPcThPlan
                    key={`h-${opt.id}`}
                    scope="col"
                    variants={headCellReveal}
                    $highlight={isHighlighted(opt)}
                    onMouseEnter={() => onHighlight?.(opt)}
                  >
                    <HeaderStack>
                      <ClassPageHeroImageBlock
                        images={optionToViewerImages(opt)}
                        title={opt.title}
                        compact
                        usePlaceholders={false}
                      />
                      <HeaderTitle>{opt.title}</HeaderTitle>
                    </HeaderStack>
                  </MotionPcThPlan>
                ))}
              </tr>
            </MotionThead>
            <MotionTbody variants={tbodyOrchestra} initial="hidden" animate="visible">
              <MotionTr variants={sectionBandReveal}>
                <SectionHeadCell colSpan={n + 1} scope="colgroup">
                  <SectionHeadInner>
                    <Sparkles aria-hidden />
                    Experience
                  </SectionHeadInner>
                </SectionHeadCell>
              </MotionTr>
            <MotionTr variants={tableRowReveal}>
              <PcTdFeature $section="experience">Host</PcTdFeature>
              {options.map((opt) => (
                <PcTdMark
                  key={`host-${opt.id}`}
                  $section="experience"
                  $highlight={isHighlighted(opt)}
                  onMouseEnter={() => onHighlight?.(opt)}
                >
                  <PcTdMarkInner>{opt.host_name || "—"}</PcTdMarkInner>
                </PcTdMark>
              ))}
            </MotionTr>
            {options.some((o) => String(o.tagline || "").trim() || String(o.description || "").trim()) ? (
              <MotionTr variants={tableRowReveal}>
                <PcTdFeature $section="experience">Summary</PcTdFeature>
                {options.map((opt) => {
                  const summaryText =
                    String(opt.tagline || "").trim() || String(opt.description || "").trim();
                  return (
                    <PcTdMark
                      key={`tag-${opt.id}`}
                      $section="experience"
                      $highlight={isHighlighted(opt)}
                      onMouseEnter={() => onHighlight?.(opt)}
                    >
                      <PcTdMarkInner>
                        {summaryText ? <TaglineClamp>{summaryText}</TaglineClamp> : "—"}
                      </PcTdMarkInner>
                    </PcTdMark>
                  );
                })}
              </MotionTr>
            ) : null}

            {anyLocation ? (
              <MotionTr variants={tableRowReveal}>
                <PcTdFeature $section="experience">Area</PcTdFeature>
                {options.map((opt) => (
                  <PcTdMark
                    key={`loc-${opt.id}`}
                    $section="experience"
                    $highlight={isHighlighted(opt)}
                    onMouseEnter={() => onHighlight?.(opt)}
                  >
                    <PcTdMarkInner>
                      {(() => {
                        const loc = locationDisplayLabel(opt);
                        const href = mapsSearchUrl(locationMapsQuery(opt));
                        if (!loc) return <CellMutedCenter>—</CellMutedCenter>;
                        return (
                          <LocationLinkCentered
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {loc}
                          </LocationLinkCentered>
                        );
                      })()}
                    </PcTdMarkInner>
                  </PcTdMark>
                ))}
              </MotionTr>
            ) : null}

            {anyDuration ? (
              <MotionTr variants={tableRowReveal}>
                <PcTdFeature $section="experience">Duration</PcTdFeature>
                {options.map((opt) => (
                  <PcTdMark
                    key={`dur-${opt.id}`}
                    $section="experience"
                    $highlight={isHighlighted(opt)}
                    onMouseEnter={() => onHighlight?.(opt)}
                  >
                    <PcTdMarkInner>{formatDurationMinutes(opt.duration_minutes) || "—"}</PcTdMarkInner>
                  </PcTdMark>
                ))}
              </MotionTr>
            ) : null}

            {anyHeadcount ? (
              <MotionTr variants={tableRowReveal}>
                <PcTdFeature $section="experience">Group size</PcTdFeature>
                {options.map((opt) => (
                  <PcTdMark
                    key={`hc-${opt.id}`}
                    $section="experience"
                    $highlight={isHighlighted(opt)}
                    onMouseEnter={() => onHighlight?.(opt)}
                  >
                    <PcTdMarkInner>{formatHeadcountRange(opt.min_headcount, opt.max_headcount) || "—"}</PcTdMarkInner>
                  </PcTdMark>
                ))}
              </MotionTr>
            ) : null}

            {anyInclusions ? (
              <MotionTr variants={tableRowReveal}>
                <PcTdFeature $section="experience">Included</PcTdFeature>
                {options.map((opt) => (
                  <PcTdMark
                    key={`inc-${opt.id}`}
                    $section="experience"
                    $highlight={isHighlighted(opt)}
                    onMouseEnter={() => onHighlight?.(opt)}
                    style={{ textAlign: "left", verticalAlign: "top" }}
                  >
                    <PcTdMarkInnerLeft>
                      {formatInclusionsLine(opt.inclusions) ? (
                        <TaglineClampLeft>{formatInclusionsLine(opt.inclusions)}</TaglineClampLeft>
                      ) : (
                        <CellMutedLeft>—</CellMutedLeft>
                      )}
                    </PcTdMarkInnerLeft>
                  </PcTdMark>
                ))}
              </MotionTr>
            ) : null}

            {anyProposedDates ? (
              <MotionTr variants={tableRowReveal}>
                <PcTdFeature $section="experience">Proposed dates</PcTdFeature>
                {options.map((opt) => (
                  <PcTdMark
                    key={`dates-${opt.id}`}
                    $section="experience"
                    $highlight={isHighlighted(opt)}
                    onMouseEnter={() => onHighlight?.(opt)}
                    style={{ textAlign: "left", verticalAlign: "top" }}
                  >
                    <PcTdMarkInnerLeft>
                      {formatProposedDatesLine(opt.proposed_date_options) ? (
                        <TaglineClampLeft>{formatProposedDatesLine(opt.proposed_date_options)}</TaglineClampLeft>
                      ) : (
                        <CellMutedLeft>—</CellMutedLeft>
                      )}
                    </PcTdMarkInnerLeft>
                  </PcTdMark>
                ))}
              </MotionTr>
            ) : null}

            <MotionTr variants={sectionBandReveal}>
              <SectionHeadCell colSpan={n + 1} scope="colgroup">
                <SectionHeadInner>
                  <Wallet aria-hidden />
                  Pricing
                </SectionHeadInner>
              </SectionHeadCell>
            </MotionTr>
            <MotionTr variants={tableRowReveal}>
              <PcTdFeature $section="pricing">Total</PcTdFeature>
              {options.map((opt) => (
                <PcTdMark
                  key={`tot-${opt.id}`}
                  $section="pricing"
                  $highlight={isHighlighted(opt)}
                  onMouseEnter={() => onHighlight?.(opt)}
                >
                  <PcTdMarkInner>
                    <AmountStrong>{formatMoney(opt.price_total_cents, currency)}</AmountStrong>
                  </PcTdMarkInner>
                </PcTdMark>
              ))}
            </MotionTr>
            {anyPerPerson ? (
              <MotionTr variants={tableRowReveal}>
                <PcTdFeature $section="pricing">Per person</PcTdFeature>
                {options.map((opt) => (
                  <PcTdMark
                    key={`ppp-${opt.id}`}
                    $section="pricing"
                    $highlight={isHighlighted(opt)}
                    onMouseEnter={() => onHighlight?.(opt)}
                  >
                    <PcTdMarkInner>
                      {Number(opt.price_per_person_cents) > 0 ? (
                        formatMoney(opt.price_per_person_cents, currency)
                      ) : (
                        "—"
                      )}
                    </PcTdMarkInner>
                  </PcTdMark>
                ))}
              </MotionTr>
            ) : null}
            <MotionTr variants={tableRowReveal}>
              <PcTdFeature $section="pricing">Deposit ({depPct}%)</PcTdFeature>
              {options.map((opt) => {
                const { depositCents } = computePricingBreakdown(opt.price_total_cents, depPct);
                return (
                  <PcTdMark
                    key={`dep-${opt.id}`}
                    $section="pricing"
                    $highlight={isHighlighted(opt)}
                    onMouseEnter={() => onHighlight?.(opt)}
                  >
                    <PcTdMarkInner>{formatMoney(depositCents, currency)}</PcTdMarkInner>
                  </PcTdMark>
                );
              })}
            </MotionTr>
            <MotionTr variants={tableRowReveal}>
              <PcTdFeature $section="pricing">Balance (invoiced)</PcTdFeature>
              {options.map((opt) => {
                const { balanceCents } = computePricingBreakdown(opt.price_total_cents, depPct);
                return (
                  <PcTdMark
                    key={`bal-${opt.id}`}
                    $section="pricing"
                    $highlight={isHighlighted(opt)}
                    onMouseEnter={() => onHighlight?.(opt)}
                  >
                    <PcTdMarkInner>{formatMoney(balanceCents, currency)}</PcTdMarkInner>
                  </PcTdMark>
                );
              })}
            </MotionTr>
            <MotionTr variants={tableRowReveal}>
              <PcTdFeature $section="pricing">Next step</PcTdFeature>
              {options.map((opt) => (
                <PcTdMark
                  key={`act-${opt.id}`}
                  $section="pricing"
                  $highlight={isHighlighted(opt)}
                  onMouseEnter={() => onHighlight?.(opt)}
                  style={{ verticalAlign: "top", paddingTop: 12, paddingBottom: 14 }}
                >
                  <ActionsInner>
                    {opt.class_slug ? (
                      <TableDetailLink href={`/classes/${opt.class_slug}`}>Details</TableDetailLink>
                    ) : null}
                    <TableBtn type="button" $primary onClick={() => onChoose(opt)}>
                      Choose
                    </TableBtn>
                  </ActionsInner>
                </PcTdMark>
              ))}
            </MotionTr>
          </MotionTbody>
        </PlanCompareTable>
      </PlanCompareScroll>
    </CompareBundle>
    </MotionCompareShell>
  );
}
