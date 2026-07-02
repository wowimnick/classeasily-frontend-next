"use client";

import Link from "next/link";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Clock, MapPin, User } from "lucide-react";
import { formatMoney } from "./formatMoney";

const CORAL = "#ff385c";

const CardGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  margin-top: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(${(p) => Math.min(p.$count, 3)}, 1fr);
    gap: 1rem;
  }
`;

const OptionCard = styled(motion.article)`
  display: flex;
  flex-direction: column;
  border: 2px solid ${(p) => (p.$highlight ? CORAL : "#ebebeb")};
  border-radius: 16px;
  background: #ffffff;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
  }
`;

const CoverWrap = styled.div`
  position: relative;
  aspect-ratio: 16 / 10;
  background: #f1f5f9;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const CoverPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 1rem 1.1rem 1.15rem;
  gap: 0.65rem;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem 1rem;
  font-size: 13px;
  color: #64748b;
`;

const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;

  svg {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
  }
`;

const Tagline = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
  color: #334155;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PriceBlock = styled.div`
  margin-top: auto;
  padding-top: 0.35rem;
`;

const PriceTotal = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
`;

const PricePerPerson = styled.div`
  font-size: 13px;
  color: #64748b;
  margin-top: 0.15rem;
  font-variant-numeric: tabular-nums;
`;

const DepositHint = styled.div`
  font-size: 12px;
  color: #64748b;
  margin-top: 0.25rem;
  font-variant-numeric: tabular-nums;
`;

const ChipList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Chip = styled.li`
  font-size: 12px;
  font-weight: 500;
  color: #334155;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  line-height: 1.3;
`;

const CtaButton = styled.button`
  width: 100%;
  margin-top: 0.75rem;
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  background: ${CORAL};
  color: #ffffff;
  transition: opacity 0.15s ease, transform 0.15s ease;

  &:hover {
    opacity: 0.92;
  }

  &:focus-visible {
    outline: 2px solid ${CORAL};
    outline-offset: 2px;
  }
`;

const DetailLink = styled(Link)`
  display: block;
  margin-top: 0.5rem;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: #334155;
  }
`;

function computePricingBreakdown(totalCents, depPct) {
  const t = Number(totalCents) || 0;
  const p = Math.min(100, Math.max(1, Number(depPct) || 25));
  const dep = Math.max(1, Math.round((t * p) / 100));
  return { depositCents: dep, balanceCents: Math.max(0, t - dep) };
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

function locationDisplayLabel(opt) {
  return String(opt.location_label || opt.location_text || "").trim();
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 28,
      delay: i * 0.06,
    },
  }),
};

export default function ShortlistComparisonTable({
  options,
  currency,
  depositPercent,
  highlightOption,
  onHighlight,
  onChoose,
  presentation,
}) {
  const n = options.length;
  if (n === 0) return null;

  const depPct = depositPercent ?? 25;
  const ctaLabel = presentation?.cta_label?.trim?.() || "Select this experience";
  const showInclusions = presentation?.show_sections?.whats_included !== false;

  const isHighlighted = (opt) =>
    highlightOption && String(highlightOption.id) === String(opt.id);

  return (
    <CardGrid
      $count={n}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
    >
      {options.map((opt, i) => {
        const { depositCents } = computePricingBreakdown(opt.price_total_cents, depPct);
        const inclusions = Array.isArray(opt.inclusions)
          ? opt.inclusions.filter(Boolean).slice(0, 6)
          : [];
        const tagline =
          String(opt.tagline || "").trim() || String(opt.description || "").trim();
        const loc = locationDisplayLabel(opt);
        const dur = formatDurationMinutes(opt.duration_minutes);
        const perPerson =
          Number(opt.price_per_person_cents) > 0 ? opt.price_per_person_cents : null;

        return (
          <OptionCard
            key={opt.id}
            custom={i}
            variants={cardVariants}
            $highlight={isHighlighted(opt)}
            onMouseEnter={() => onHighlight?.(opt)}
          >
            <CoverWrap>
              {opt.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={opt.cover_image_url} alt="" />
              ) : (
                <CoverPlaceholder />
              )}
            </CoverWrap>
            <CardBody>
              <CardTitle>{opt.title}</CardTitle>
              <MetaRow>
                {opt.host_name ? (
                  <MetaItem>
                    <User aria-hidden />
                    {opt.host_name}
                  </MetaItem>
                ) : null}
                {loc ? (
                  <MetaItem>
                    <MapPin aria-hidden />
                    {loc}
                  </MetaItem>
                ) : null}
                {dur ? (
                  <MetaItem>
                    <Clock aria-hidden />
                    {dur}
                  </MetaItem>
                ) : null}
              </MetaRow>
              {tagline ? <Tagline>{tagline}</Tagline> : null}
              <PriceBlock>
                <PriceTotal>{formatMoney(opt.price_total_cents, currency)}</PriceTotal>
                {perPerson != null ? (
                  <PricePerPerson>{formatMoney(perPerson, currency)} per person</PricePerPerson>
                ) : null}
                <DepositHint>
                  {formatMoney(depositCents, currency)} deposit · {depPct}% today
                </DepositHint>
              </PriceBlock>
              {showInclusions && inclusions.length > 0 ? (
                <ChipList aria-label="What's included">
                  {inclusions.map((item) => (
                    <Chip key={item}>{item}</Chip>
                  ))}
                </ChipList>
              ) : null}
              <CtaButton type="button" onClick={() => onChoose(opt)}>
                {ctaLabel}
              </CtaButton>
              {opt.class_slug ? (
                <DetailLink href={`/classes/${opt.class_slug}`}>View details</DetailLink>
              ) : null}
            </CardBody>
          </OptionCard>
        );
      })}
    </CardGrid>
  );
}
