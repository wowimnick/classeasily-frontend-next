"use client";

import {
  Baby,
  Dumbbell,
  Ellipsis,
  GraduationCap,
  Palette,
  Phone,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import styled from "styled-components";

export const INDUSTRY_OPTIONS = [
  { id: "fitness", label: "Fitness & wellness" },
  { id: "arts", label: "Arts & crafts" },
  { id: "tutoring", label: "Tutoring & coaching" },
  { id: "kids", label: "Kids & camps" },
  { id: "beauty", label: "Beauty & salon" },
  { id: "other", label: "Other" },
];

export const BOOKING_OPTIONS = [
  { id: "calendly", label: "Calendly" },
  { id: "acuity", label: "Acuity" },
  { id: "square", label: "Square" },
  { id: "instagram", label: "Instagram" },
  { id: "phone", label: "Phone & email" },
  { id: "other", label: "Other" },
];

export const ATTRIBUTION_OPTIONS = [
  { id: "google", label: "Google" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "referral", label: "A friend" },
  { id: "owner", label: "Another owner" },
  { id: "other", label: "Other" },
];

export const SURVEY_STEPS = [
  { id: "about-industry", key: "industry" },
  { id: "about-booking", key: "booking_system" },
  { id: "about-attribution", key: "attribution" },
];

const LOGO = {
  calendly: "/onboard/logos/calendly.png",
  acuity: "/onboard/logos/acuity.png",
  square: "/onboard/logos/square.svg",
  instagram: "/onboard/logos/instagram.svg",
  google: "/onboard/logos/google.svg",
  tiktok: "/onboard/logos/tiktok.svg",
};

const INDUSTRY_ICONS = {
  fitness: Dumbbell,
  arts: Palette,
  tutoring: GraduationCap,
  kids: Baby,
  beauty: Sparkles,
  other: Ellipsis,
};

const BOOKING_ICONS = {
  phone: Phone,
  other: Ellipsis,
};

const ATTRIBUTION_ICONS = {
  referral: Users,
  owner: Store,
  other: Ellipsis,
};

const STEP_CONFIG = {
  "about-industry": {
    name: "What do you sell?",
    options: INDUSTRY_OPTIONS,
    icons: INDUSTRY_ICONS,
  },
  "about-booking": {
    name: "How do you take bookings today?",
    options: BOOKING_OPTIONS,
    icons: BOOKING_ICONS,
  },
  "about-attribution": {
    name: "How did you find ClassEasily?",
    options: ATTRIBUTION_OPTIONS,
    icons: ATTRIBUTION_ICONS,
  },
};

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 200px);
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 200px));
  }

  @media (max-width: 460px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
`;

const Card = styled.button`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 148px;
  width: 100%;
  padding: 28px 14px 18px;
  border: 1.5px solid ${(p) => (p.$on ? "#111" : "#e4e4e4")};
  border-radius: 16px;
  background: #fff;
  color: #111;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.12s ease;

  &:hover {
    border-color: #111;
  }

  &:focus-visible {
    outline: 2px solid #111;
    outline-offset: 2px;
  }
`;

const Radio = styled.span`
  position: absolute;
  top: 12px;
  left: 12px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid #111;
  display: grid;
  place-items: center;

  &::after {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #111;
    opacity: ${(p) => (p.$on ? 1 : 0)};
  }
`;

const Mark = styled.span`
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
`;

const Name = styled.span`
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: #111;
`;

function OptionMark({ id, Icon }) {
  const src = LOGO[id];
  if (src) {
    return <img src={src} alt="" />;
  }
  if (Icon) {
    return <Icon size={36} strokeWidth={1.75} color="#111" aria-hidden />;
  }
  return null;
}

export default function OnboardSurvey({ stepId, value, onSelect }) {
  const config = STEP_CONFIG[stepId];
  if (!config) return null;

  return (
    <Grid role="radiogroup" aria-label={config.name}>
      {config.options.map((opt, i) => {
        const on = value === opt.id;
        return (
          <Card
            as={motion.button}
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={on}
            $on={on}
            onClick={() => onSelect(opt.id)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: i * 0.045,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Radio $on={on} />
            <Mark>
              <OptionMark id={opt.id} Icon={config.icons[opt.id]} />
            </Mark>
            <Name>{opt.label}</Name>
          </Card>
        );
      })}
    </Grid>
  );
}
