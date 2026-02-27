import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styled, { css, ThemeProvider } from 'styled-components';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Globe,
  HelpCircle,
  LayoutGrid,
  Megaphone,
  PlayCircle,
  ShieldCheck,
  Smartphone,
  Store,
} from 'lucide-react';
import FooterSmart from '@/components/homepage/FooterSmart';
import { useSubscription } from '@/context/SubscriptionContext';
import { isUpgrade, isDowngrade } from '@/lib/subscriptionPlans';


const theme = {
  colors: {
    primary: '#fc4056',
    primaryHover: '#c92e44',
    dark: '#0A2540',
    text: '#425466',
    textLight: '#8792A2',
    bgLight: '#F6F9FC',
    white: '#FFFFFF',
    border: '#E2E8F0',
    accent: '#fc4056',
    warning: '#FFCE48',
    danger: '#DF1B41',
  },
  shadows: {
    sm: '0 2px 4px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(50,50,93,0.11), 0 1px 3px rgba(0,0,0,0.08)',
    lg: '0 15px 35px rgba(50,50,93,0.1), 0 5px 15px rgba(0,0,0,0.07)',
    xl: '0 50px 100px -20px rgba(50,50,93,0.25), 0 30px 60px -30px rgba(0,0,0,0.3)',
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '24px',
  }
};

// ==========================================
// REUSABLE COMPONENTS
// ==========================================

const Container = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
`;

/* Wraps sections with inline font sizes so we can shrink typography on mobile */
const MobileTypo = styled.div`
  @media (max-width: 640px) {
    & h1 { font-size: 26px !important; }
    & h2 { font-size: 13px !important; }
    & h3 { font-size: 24px !important; }
    & h4 { font-size: 13px !important; }
    & p { font-size: 14px !important; }
    & a { font-size: 13px !important; }
  }
`;

const Section = styled.section`
  padding: 60px 0;
  background: ${props => props.bg || 'transparent'};
  position: relative;
  
  @media (max-width: 768px) {
    padding: 80px 0;
  }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 15px;
  border: none;
  transition: all 0.2s ease;

  @media (max-width: 640px) {
    font-size: 14px;
    padding: 9px 16px;
  }
  
  ${props => props.variant === 'primary' && css`
    background-color: ${props.theme.colors.primary};
    color: white;
    &:hover {
      background-color: ${props.theme.colors.primaryHover};
      transform: translateY(-1px);
      box-shadow: ${props.theme.shadows.md};
    }
  `}

  ${props => props.variant === 'secondary' && css`
    background-color: rgba(10, 37, 64, 0.04);
    color: ${props.theme.colors.dark};
    &:hover {
      background-color: rgba(10, 37, 64, 0.08);
    }
  `}

  ${props => props.variant === 'outline' && css`
    background-color: transparent;
    color: ${props.theme.colors.dark};
    border: 1px solid rgba(10, 37, 64, 0.2);
    &:hover {
      border-color: ${props.theme.colors.dark};
    }
  `}
`;

const PlaceholderImg = styled.div`
  width: ${props => props.w || '100%'};
  height: ${props => props.h || '100%'};
  background: linear-gradient(135deg, #F6F9FC 0%, #E2E8F0 100%);
  border: 1px dashed #CBD5E1;
  border-radius: ${props => props.radius || '12px'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748B;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
  position: relative;
  overflow: hidden;
`;

// ANIMATION VARIANTS
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease:[0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// ==========================================
// HERO SECTION
// ==========================================

const HeroWrapper = styled.section`
  padding: 72px 0 88px;
  background: #fff;
  position: relative;
  overflow: hidden;
  background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%230a2540' fill-opacity='0.06'/%3E%3C/svg%3E");
  background-size: 24px 24px;

  @media (max-width: 640px) {
    padding: 44px 0 0px;
  }
`;

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  min-height: 0;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }
`;

const HeroTextBlock = styled(motion.div)`
  max-width: 520px;
  text-align: left;

  @media (max-width: 968px) {
    max-width: 620px;
    margin: 0 auto;
    text-align: center;
  }
`;

const HeroH1 = styled.h1`
  font-size: 50px;
  margin-bottom: 14px;
  letter-spacing: -0.04em;
  line-height: 1.1;
  color: #0A2540;

  @media (max-width: 768px) {
    font-size: 34px;
  }
  @media (max-width: 640px) {
    font-size: 26px;
  }
`;

const HeroP = styled.p`
  font-size: 16px;
  margin-bottom: 26px;
  color: ${props => props.theme.colors.text};
  line-height: 1.65;
  max-width: 500px;

  @media (max-width: 968px) {
    margin-left: auto;
    margin-right: auto;
  }
  @media (max-width: 640px) {
    font-size: 14px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-start;

  @media (max-width: 968px) {
    justify-content: center;
  }
`;

const MockViewport = styled.div`
  position: relative;
  min-width: 0;
`;

const HeroMobileImageWrap = styled.div`
  width: 100%;
  & img {
    width: 100%;
    height: auto;
    display: block;
    vertical-align: middle;
  }
  @media (max-width: 640px) {
    width: 100vw;
    position: relative;
    left: 50%;
    right: 50%;
    margin-left: -50vw;
    margin-right: -50vw;
  }
`;

/* On mobile the widget gets cropped to a tidy preview window so it never cramps.
   ThemeDots sit outside this wrapper so they stay fully visible below. */
const MobileClipWrap = styled.div`
  @media (max-width: 640px) {
    height: 278px;
    overflow: hidden;
    border-radius: 16px;
    box-shadow: 0 20px 48px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.05);
  }
`;

function useIsMobile(bp = 640) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp}px)`);
    setV(mq.matches);
    const fn = e => setV(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [bp]);
  return v;
}

const ThemeDots = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 18px;
`;

const ThemeDot = styled.div`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${props => props.$active ? props.theme.colors.primary : '#CBD5E1'};
  transition: all 0.35s ease;
  transform: scale(${props => props.$active ? 1.4 : 1});
  cursor: pointer;
`;

// March 2026 starts on Sunday — no padding needed
const MARCH_2026 = [
  { d: 1 }, { d: 2 }, { d: 3 }, { d: 4 }, { d: 5, a: true }, { d: 6, a: true }, { d: 7, a: true },
  { d: 8 }, { d: 9 }, { d: 10 }, { d: 11 }, { d: 12, a: true }, { d: 13, a: true }, { d: 14, a: true },
  { d: 15 }, { d: 16 }, { d: 17 }, { d: 18 }, { d: 19, a: true }, { d: 20, a: true }, { d: 21, a: true },
  { d: 22 }, { d: 23 }, { d: 24 }, { d: 25 }, { d: 26, a: true }, { d: 27, a: true }, { d: 28, a: true },
  { d: 29 }, { d: 30 }, { d: 31 }, null, null, null, null,
];

// Module-level helpers
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Pre-compute stagger index for available day cells
const AVAIL_DAY_IDX = (() => {
  const map = {};
  let count = 0;
  MARCH_2026.forEach((day, i) => { if (day?.a) map[i] = count++; });
  return map;
})();

// ── Variants for controls-driven animation (defined once at module level) ────
// Card wrapper: scale down slightly on exit so enter springs up from 0.96→1
const cardV = {
  enter: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 26, delay: 0.08 } },
  // duration 0.40s >= longest child exit (11*0.013 + 0.22 = 0.363s) so controls.start('exit') resolves after children
  exit:  { scale: 0.96, opacity: 1, transition: { duration: 0.40 } },
};
const calHeaderV = {
  enter: { y: 0,  opacity: 1, transition: { duration: 0.28, delay: 0.06 } },
  exit:  { y: -8, opacity: 0, transition: { duration: 0.18 } },
};
const weekdayV = {
  enter: { opacity: 1, transition: { duration: 0.22, delay: 0.10 } },
  exit:  { opacity: 0, transition: { duration: 0.14 } },
};
// custom = { isAvail: bool, ai: number (stagger index among available cells) }
const dayCellV = {
  enter: ({ isAvail, ai }) => ({
    scale: 1, opacity: 1,
    transition: isAvail
      ? { type: 'spring', stiffness: 420, damping: 20, delay: 0.12 + ai * 0.02 }
      : { duration: 0.14, delay: 0.12 },
  }),
  exit: ({ isAvail, ai }) => (isAvail
    ? { scale: [1, 1.3, 0], opacity: [1, 1, 0], transition: { duration: 0.22, times: [0, 0.28, 1], delay: ai * 0.013 } }
    : { scale: 0, opacity: 0, transition: { duration: 0.10 } }
  ),
};
const slotsHeaderV = {
  enter: { opacity: 1, x: 0,  transition: { duration: 0.26, delay: 0.10 } },
  exit:  { opacity: 0, x: 10, transition: { duration: 0.16 } },
};
// custom = slot index si
const slotRowV = {
  enter: (si) => ({ opacity: 1, x: 0,  transition: { duration: 0.24, delay: 0.16 + si * 0.07 } }),
  exit:  (si) => ({ opacity: 0, x: 14, transition: { duration: 0.18, delay: si * 0.04 } }),
};

const WIDGET_THEMES = [
  {
    id: 'classic',
    primary: '#2563EB',
    primaryFade: 'rgba(37,99,235,0.08)',
    primaryText: '#fff',
    outerBg: '#EFF6FF',
    pageHeaderBg: '#1E3A8A',
    chromeBg: '#FFFFFF',
    chromeBorder: '#BFDBFE',
    chromeUrlBg: '#F8FAFC',
    chromeUrlText: '#64748B',
    calCardBg: '#FFFFFF',
    calCardBorder: '#E2E8F0',
    calCardShadow: '0 4px 20px rgba(0,0,0,0.06)',
    calCardRadius: 16,
    monthText: '#1E293B',
    navBorder: '#E2E8F0',
    navColor: '#1E293B',
    weekdayColor: '#64748B',
    dayAvailBg: '#F1F5F9',
    dayAvailColor: '#1E293B',
    dayNA: '#CBD5E1',
    dayRadius: '8px',
    slotContainerBorder: '#E2E8F0',
    slotRadius: 12,
    slotBg: '#FFFFFF',
    slotSelectedBg: 'rgba(37,99,235,0.06)',
    slotBorderColor: '#E2E8F0',
    slotTimeColor: '#1E293B',
    slotMetaColor: '#64748B',
    slotPriceBg: '#F1F5F9',
    slotPriceColor: '#1E293B',
    slotPriceSelBg: 'rgba(37,99,235,0.1)',
    slotPriceSelColor: '#2563EB',
    stepperBg: '#F1F5F9',
    stepperBtnBg: '#FFFFFF',
    stepperBtnColor: '#1E293B',
    stepperBtnDisabled: '#CBD5E1',
    stepperVal: '#1E293B',
    headerColor: '#1E293B',
    dividerColor: 'rgba(37,99,235,0.12)',
    dateBadgeColor: '#2563EB',
    continueRadius: 8,
    holoGradient: 'linear-gradient(105deg, rgba(255,255,255,0.55) 0%, transparent 50%, rgba(255,255,255,0.5) 100%), conic-gradient(from 200deg at 40% 60%, rgba(147,197,253,0.45) 0deg, rgba(191,219,254,0.5) 120deg, rgba(165,243,252,0.35) 240deg, rgba(186,230,253,0.45) 360deg), #EFF6FF',
  },
  {
    id: 'sunset',
    primary: '#EA580C',
    primaryFade: 'rgba(234,88,12,0.08)',
    primaryText: '#fff',
    outerBg: '#FEF3C7',
    pageHeaderBg: '#431407',
    chromeBg: '#FFFBF7',
    chromeBorder: '#FED7AA',
    chromeUrlBg: '#FEF3C7',
    chromeUrlText: '#B45309',
    calCardBg: '#FFFFFF',
    calCardBorder: '#FED7AA',
    calCardShadow: '0 8px 32px rgba(234,88,12,0.1)',
    calCardRadius: 24,
    monthText: '#431407',
    navBorder: '#FED7AA',
    navColor: '#EA580C',
    weekdayColor: '#FB923C',
    dayAvailBg: '#FEF3C7',
    dayAvailColor: '#431407',
    dayNA: '#FED7AA',
    dayRadius: '10px',
    slotContainerBorder: '#FED7AA',
    slotRadius: 14,
    slotBg: '#FFFBF7',
    slotSelectedBg: 'rgba(234,88,12,0.05)',
    slotBorderColor: '#FEF3C7',
    slotTimeColor: '#431407',
    slotMetaColor: '#B45309',
    slotPriceBg: '#FEF3C7',
    slotPriceColor: '#92400E',
    slotPriceSelBg: 'rgba(234,88,12,0.1)',
    slotPriceSelColor: '#EA580C',
    stepperBg: '#FEF3C7',
    stepperBtnBg: '#FFFFFF',
    stepperBtnColor: '#EA580C',
    stepperBtnDisabled: '#FED7AA',
    stepperVal: '#431407',
    headerColor: '#431407',
    dividerColor: 'rgba(234,88,12,0.12)',
    dateBadgeColor: '#EA580C',
    continueRadius: 12,
    holoGradient: 'linear-gradient(105deg, rgba(255,255,255,0.5) 0%, transparent 50%, rgba(255,255,255,0.45) 100%), conic-gradient(from 200deg at 40% 60%, rgba(254,215,170,0.5) 0deg, rgba(254,243,199,0.55) 120deg, rgba(255,237,213,0.4) 240deg, rgba(254,202,202,0.45) 360deg), #FEF3C7',
  },
  {
    id: 'retro',
    primary: '#D97706',
    primaryFade: 'rgba(217,119,6,0.1)',
    primaryText: '#1C1917',
    outerBg: '#FDF6E3',
    pageHeaderBg: '#292524',
    chromeBg: '#FFFBEB',
    chromeBorder: '#D97706',
    chromeUrlBg: '#FEF3C7',
    chromeUrlText: '#92400E',
    calCardBg: '#FFFBEB',
    calCardBorder: '#D97706',
    calCardShadow: '4px 4px 0 0 #D97706',
    calCardRadius: 4,
    monthText: '#292524',
    navBorder: '#D97706',
    navColor: '#D97706',
    weekdayColor: '#92400E',
    dayAvailBg: '#FDE68A',
    dayAvailColor: '#292524',
    dayNA: '#E7D9B5',
    dayRadius: '3px',
    slotContainerBorder: '#D97706',
    slotRadius: 3,
    slotBg: '#FFFBEB',
    slotSelectedBg: 'rgba(217,119,6,0.08)',
    slotBorderColor: '#FDE68A',
    slotTimeColor: '#292524',
    slotMetaColor: '#92400E',
    slotPriceBg: '#FDE68A',
    slotPriceColor: '#292524',
    slotPriceSelBg: 'rgba(217,119,6,0.18)',
    slotPriceSelColor: '#D97706',
    stepperBg: '#FDE68A',
    stepperBtnBg: '#FFFBEB',
    stepperBtnColor: '#D97706',
    stepperBtnDisabled: '#E7D9B5',
    stepperVal: '#292524',
    headerColor: '#292524',
    dividerColor: 'rgba(217,119,6,0.22)',
    dateBadgeColor: '#D97706',
    continueRadius: 3,
    holoGradient: 'linear-gradient(105deg, rgba(255,251,235,0.6) 0%, transparent 50%, rgba(255,251,235,0.55) 100%), conic-gradient(from 200deg at 40% 60%, rgba(253,230,138,0.5) 0deg, rgba(254,243,199,0.55) 120deg, rgba(253,224,71,0.35) 240deg, rgba(251,191,36,0.4) 360deg), #FDF6E3',
  },
  {
    id: 'minimal',
    primary: '#3F3F46',
    primaryFade: 'rgba(63,63,70,0.06)',
    primaryText: '#FAFAFA',
    outerBg: '#F4F4F5',
    pageHeaderBg: '#18181B',
    chromeBg: '#FFFFFF',
    chromeBorder: '#E4E4E7',
    chromeUrlBg: '#F4F4F5',
    chromeUrlText: '#A1A1AA',
    calCardBg: '#FFFFFF',
    calCardBorder: '#E4E4E7',
    calCardShadow: '0 1px 6px rgba(0,0,0,0.06)',
    calCardRadius: 8,
    monthText: '#18181B',
    navBorder: '#E4E4E7',
    navColor: '#52525B',
    weekdayColor: '#A1A1AA',
    dayAvailBg: '#F4F4F5',
    dayAvailColor: '#18181B',
    dayNA: '#D4D4D8',
    dayRadius: '5px',
    slotContainerBorder: '#E4E4E7',
    slotRadius: 6,
    slotBg: '#FFFFFF',
    slotSelectedBg: 'rgba(63,63,70,0.04)',
    slotBorderColor: '#E4E4E7',
    slotTimeColor: '#18181B',
    slotMetaColor: '#71717A',
    slotPriceBg: '#F4F4F5',
    slotPriceColor: '#52525B',
    slotPriceSelBg: 'rgba(63,63,70,0.08)',
    slotPriceSelColor: '#3F3F46',
    stepperBg: '#F4F4F5',
    stepperBtnBg: '#FFFFFF',
    stepperBtnColor: '#52525B',
    stepperBtnDisabled: '#D4D4D8',
    stepperVal: '#18181B',
    headerColor: '#18181B',
    dividerColor: 'rgba(0,0,0,0.07)',
    dateBadgeColor: '#52525B',
    continueRadius: 5,
    holoGradient: 'linear-gradient(105deg, rgba(255,255,255,0.6) 0%, transparent 50%, rgba(255,255,255,0.55) 100%), conic-gradient(from 200deg at 40% 60%, rgba(212,212,216,0.4) 0deg, rgba(228,228,231,0.45) 120deg, rgba(244,244,245,0.5) 240deg, rgba(228,228,231,0.4) 360deg), #F4F4F5',
  },
  {
    id: 'ocean',
    primary: '#0D9488',
    primaryFade: 'rgba(13,148,136,0.1)',
    primaryText: '#fff',
    outerBg: '#CCFBF1',
    pageHeaderBg: '#134E4A',
    chromeBg: '#F0FDFA',
    chromeBorder: '#5EEAD4',
    chromeUrlBg: '#CCFBF1',
    chromeUrlText: '#0F766E',
    calCardBg: '#FFFFFF',
    calCardBorder: '#99F6E4',
    calCardShadow: '0 8px 32px rgba(13,148,136,0.12)',
    calCardRadius: 18,
    monthText: '#134E4A',
    navBorder: '#99F6E4',
    navColor: '#0D9488',
    weekdayColor: '#2DD4BF',
    dayAvailBg: '#CCFBF1',
    dayAvailColor: '#134E4A',
    dayNA: '#99F6E4',
    dayRadius: '8px',
    slotContainerBorder: '#99F6E4',
    slotRadius: 12,
    slotBg: '#FFFFFF',
    slotSelectedBg: 'rgba(13,148,136,0.06)',
    slotBorderColor: '#CCFBF1',
    slotTimeColor: '#134E4A',
    slotMetaColor: '#0F766E',
    slotPriceBg: '#CCFBF1',
    slotPriceColor: '#0D9488',
    slotPriceSelBg: 'rgba(13,148,136,0.12)',
    slotPriceSelColor: '#0D9488',
    stepperBg: '#CCFBF1',
    stepperBtnBg: '#FFFFFF',
    stepperBtnColor: '#0D9488',
    stepperBtnDisabled: '#99F6E4',
    stepperVal: '#134E4A',
    headerColor: '#134E4A',
    dividerColor: 'rgba(13,148,136,0.15)',
    dateBadgeColor: '#0D9488',
    continueRadius: 10,
    holoGradient: 'linear-gradient(105deg, rgba(255,255,255,0.5) 0%, transparent 50%, rgba(255,255,255,0.45) 100%), conic-gradient(from 200deg at 40% 60%, rgba(153,246,228,0.5) 0deg, rgba(204,251,241,0.55) 120deg, rgba(167,243,208,0.4) 240deg, rgba(153,246,228,0.5) 360deg), #CCFBF1',
  },
  {
    id: 'rose',
    primary: '#E11D48',
    primaryFade: 'rgba(225,29,72,0.08)',
    primaryText: '#fff',
    outerBg: '#FFF1F2',
    pageHeaderBg: '#881337',
    chromeBg: '#FFFFFF',
    chromeBorder: '#FECDD3',
    chromeUrlBg: '#FFF1F2',
    chromeUrlText: '#BE123C',
    calCardBg: '#FFFFFF',
    calCardBorder: '#FECDD3',
    calCardShadow: '0 8px 32px rgba(225,29,72,0.08)',
    calCardRadius: 20,
    monthText: '#4C0519',
    navBorder: '#FECDD3',
    navColor: '#E11D48',
    weekdayColor: '#FB7185',
    dayAvailBg: '#FFF1F2',
    dayAvailColor: '#4C0519',
    dayNA: '#FECDD3',
    dayRadius: '10px',
    slotContainerBorder: '#FECDD3',
    slotRadius: 12,
    slotBg: '#FFFFFF',
    slotSelectedBg: 'rgba(225,29,72,0.06)',
    slotBorderColor: '#FFF1F2',
    slotTimeColor: '#4C0519',
    slotMetaColor: '#BE123C',
    slotPriceBg: '#FFF1F2',
    slotPriceColor: '#9F1239',
    slotPriceSelBg: 'rgba(225,29,72,0.1)',
    slotPriceSelColor: '#E11D48',
    stepperBg: '#FFF1F2',
    stepperBtnBg: '#FFFFFF',
    stepperBtnColor: '#E11D48',
    stepperBtnDisabled: '#FECDD3',
    stepperVal: '#4C0519',
    headerColor: '#4C0519',
    dividerColor: 'rgba(225,29,72,0.12)',
    dateBadgeColor: '#E11D48',
    continueRadius: 10,
    holoGradient: 'linear-gradient(105deg, rgba(255,255,255,0.55) 0%, transparent 50%, rgba(255,255,255,0.5) 100%), conic-gradient(from 200deg at 40% 60%, rgba(254,205,211,0.5) 0deg, rgba(255,241,242,0.55) 120deg, rgba(253,224,231,0.4) 240deg, rgba(254,205,211,0.5) 360deg), #FFF1F2',
  },
];

const CAL_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Shell: card wrapper with theme-matched holographic background ───────────
const MockWidgetShell = ({ theme: t, children }) => (
  <div style={{
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 28px 56px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    userSelect: 'none',
    background: t.holoGradient || t.outerBg,
  }}>
    <div style={{ padding: '16px 18px 18px', minHeight: 340 }}>{children}</div>
  </div>
);

// ── Animated content: permanently mounted, driven by useAnimation controls ──
// Never unmounts — eliminates all layout/height jank.
// controls.start('exit') → cells spring-pop away; controls.start('enter') → spring in.
const MOCK_SLOTS = [
  { time: '9:00 – 10:00 AM', meta: '60 min · 8 spots', price: '$35.00', sel: false },
  { time: '2:00 – 3:30 PM',  meta: '90 min · 5 spots', price: '$45.00', sel: true  },
  { time: '5:00 – 6:00 PM',  meta: '60 min · 3 spots', price: '$35.00', sel: false },
];

const MockWidgetContent = ({ theme: t, controls, previewMode }) => (
  // animate={controls} + variants propagate to ALL descendant motion elements.
  // previewMode: show content static (no animation) for customization preview.
  <motion.div
    animate={previewMode ? 'enter' : controls}
    variants={cardV}
    initial={previewMode ? 'enter' : 'exit'}
    style={{
      background: t.calCardBg,
      borderRadius: t.calCardRadius,
      border: `1px solid ${t.calCardBorder}`,
      boxShadow: t.calCardShadow,
      padding: '18px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 18,
      alignItems: 'stretch',
    }}
  >
    {/* LEFT: Calendar */}
    <div>
      {/* Month nav — inherits variant state from controls */}
      <motion.div variants={calHeaderV}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 2px' }}
      >
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${t.navBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: t.navColor, opacity: 0.4 }}>‹</div>
        <span style={{ fontSize: 14, fontWeight: 700, color: t.monthText }}>Mar 2026</span>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${t.navBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: t.navColor }}>›</div>
      </motion.div>

      {/* Weekday labels */}
      <motion.div variants={weekdayV}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 3, marginBottom: 5, justifyItems: 'center' }}
      >
        {CAL_WEEKDAYS.map(w => (
          <span key={w} style={{ fontSize: 9, fontWeight: 700, color: t.weekdayColor, textTransform: 'uppercase', textAlign: 'center' }}>{w}</span>
        ))}
      </motion.div>

      {/* Day grid — each available cell spring-pops; others just fade */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 3, justifyItems: 'center', alignItems: 'center' }}>
        {MARCH_2026.map((day, i) => {
          const isSel  = day?.d === 14;
          const isAvail = !!day?.a;
          const ai = AVAIL_DAY_IDX[i] ?? 0;
          return (
            <motion.div
              key={i}
              custom={{ isAvail, ai }}
              variants={dayCellV}
              style={{ width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {day && (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: t.dayRadius,
                  background: isSel ? t.primary : isAvail ? t.dayAvailBg : 'transparent',
                  border: `2px solid ${isSel ? t.primary : 'transparent'}`,
                  color: isSel ? t.primaryText : isAvail ? t.dayAvailColor : t.dayNA,
                  fontSize: 11, fontWeight: isSel ? 700 : isAvail ? 700 : 400,
                }}>{day.d}</div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>

    {/* RIGHT: Time slots */}
    <div style={{ paddingLeft: 12, borderLeft: `1px solid ${t.dividerColor}`, display: 'flex', flexDirection: 'column' }}>
      <motion.div variants={slotsHeaderV}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}
      >
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: t.headerColor }}>Available Times</h3>
        <span style={{ fontSize: 10, fontWeight: 600, color: t.dateBadgeColor, background: t.primaryFade, padding: '3px 8px', borderRadius: 20 }}>Mar 14</span>
      </motion.div>

      <div style={{ border: `1px solid ${t.slotContainerBorder}`, borderRadius: t.slotRadius, overflow: 'hidden' }}>
        {MOCK_SLOTS.map((slot, si) => (
          <motion.div
            key={si}
            custom={si}
            variants={slotRowV}
            style={{
              background: slot.sel ? t.slotSelectedBg : t.slotBg,
              borderBottom: si < 2 ? `1px solid ${t.slotBorderColor}` : 'none',
            }}
          >
            <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.slotTimeColor, marginBottom: 2 }}>{slot.time}</div>
                <div style={{ fontSize: 10, color: t.slotMetaColor, fontWeight: 500 }}>{slot.meta}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, background: slot.sel ? t.slotPriceSelBg : t.slotPriceBg, color: slot.sel ? t.slotPriceSelColor : t.slotPriceColor, padding: '4px 8px', borderRadius: 8 }}>{slot.price}</div>
            </div>
            {slot.sel && (
              <div style={{ padding: '0 12px 10px', borderTop: `1px solid ${t.slotBorderColor}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: t.slotMetaColor }}>Participants</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.stepperBg, padding: 3, borderRadius: 8 }}>
                    <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.stepperBtnBg, borderRadius: 6, fontSize: 14, color: t.stepperBtnDisabled, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>−</div>
                    <span style={{ fontSize: 12, fontWeight: 700, minWidth: 16, textAlign: 'center', color: t.stepperVal }}>2</span>
                    <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.stepperBtnBg, borderRadius: 6, fontSize: 14, color: t.stepperBtnColor, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+</div>
                  </div>
                </div>
                <div style={{
                  width: '100%', background: t.primary, color: t.primaryText,
                  padding: '9px 0', borderRadius: t.continueRadius,
                  fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>Continue →</div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  </motion.div>
);

// ── Static mobile mockup — reproduces the real MobileBookingFlow date drawer ──
const MOB_WEEKS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function MobileCalendarMockup({ theme: t }) {
  const primary = t.primary;
  return (
    <div style={{
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 28px 56px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      userSelect: 'none',
      background: t.holoGradient || t.outerBg,
    }}>
      {/* Page backdrop — class card skeleton + Book Now button */}
      <div style={{ padding: '18px 18px 14px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 11, background: 'rgba(0,0,0,0.12)', borderRadius: 4, marginBottom: 7, width: '70%' }} />
            <div style={{ height: 8, background: 'rgba(0,0,0,0.07)', borderRadius: 4, width: '45%' }} />
          </div>
        </div>
        <div style={{
          width: '100%', background: primary, color: t.primaryText || '#fff',
          padding: '11px 0', borderRadius: 10, fontSize: 14, fontWeight: 700,
          textAlign: 'center',
        }}>
          Book now
        </div>
      </div>

      {/* Dim overlay — matches rgba(0,0,0,0.4) backdropFilter backdrop from MobileBookingFlow */}
      <div style={{ height: 16, background: 'linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.36))' }} />

      {/* Bottom drawer — matches DRAWER_BASE exactly */}
      <div style={{
        background: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
        padding: '0 16px 20px',
      }}>
        {/* Handle — matches HANDLE_STYLE */}
        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '12px auto 10px' }} />
        {/* Title — matches DrawerShell content */}
        <p style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#111827', textAlign: 'center' }}>
          Pick a date
        </p>
        {/* Calendar card — matches CalendarGrid cardStyle */}
        <div style={{
          background: 'white', borderRadius: 20, padding: '14px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}>
          {/* Month header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 2px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#111827', opacity: 0.3 }}>‹</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Mar 2026</span>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#111827' }}>›</div>
          </div>
          {/* Weekday labels — same as CalendarGrid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 3, marginBottom: 5, justifyItems: 'center' }}>
            {MOB_WEEKS.map((d, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', textAlign: 'center' }}>{d}</span>
            ))}
          </div>
          {/* Day grid — same cell logic as CalendarGrid: available=#f3f4f6, selected=primary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 3, justifyItems: 'center', alignItems: 'center' }}>
            {MARCH_2026.map((day, i) => {
              if (!day) return <div key={`e-${i}`} style={{ width: '100%', aspectRatio: '1' }} />;
              const isSel = day.d === 14;
              const isAvail = !!day.a;
              return (
                <div key={i} style={{ width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 8,
                    background: isSel ? primary : isAvail ? '#f3f4f6' : 'transparent',
                    border: `2px solid ${isSel ? primary : 'transparent'}`,
                    color: isSel ? (t.primaryText || '#fff') : isAvail ? '#111827' : '#9ca3af',
                    fontSize: 11,
                    fontWeight: isSel ? 700 : isAvail ? 700 : 400,
                  }}>
                    {day.d}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const Hero = () => {
  const [seqIdx, setSeqIdx]       = useState(0); // index into HERO_SEQUENCE
  const themeIdx                  = HERO_SEQUENCE[seqIdx];
  const [shellKey, setShellKey]   = useState(0);
  const contentControls           = useAnimation();
  const isAnimating               = useRef(false);
  const isMobileHero              = useIsMobile(640);
  const { subscription }         = useSubscription();
  const hasSubscription          = Boolean(subscription?.planId);

  // Animate content in on first mount
  useEffect(() => { contentControls.start('enter'); }, [contentControls]);

  const runTransition = useCallback(async (targetSeqIdx) => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    await contentControls.start('exit');

    setSeqIdx(typeof targetSeqIdx === 'number' ? targetSeqIdx : i => (i + 1) % HERO_SEQUENCE.length);
    setShellKey(k => k + 1);
    await sleep(480);

    await contentControls.start('enter');
    await sleep(180);

    isAnimating.current = false;
  }, [contentControls]);

  useEffect(() => {
    const interval = setInterval(() => runTransition(), 7000);
    return () => clearInterval(interval);
  }, [runTransition]);

  return (
    <HeroWrapper>
      <Container>
        <HeroGrid>
          <HeroTextBlock initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeUp}>
              <HeroH1>Get discovered. Take bookings on your site.</HeroH1>
            </motion.div>
            <motion.div variants={fadeUp}>
              <HeroP>
                One platform: list on the Classeasily marketplace so we bring you customers, and embed a widget on your own site so visitors book there. Same calendar, one dashboard.
              </HeroP>
            </motion.div>
            <motion.div variants={fadeUp}>
              <ButtonGroup>
                {hasSubscription ? (
                  <Link href="/business/dashboard/widget">
                    <Button variant="primary">Manage plan <ArrowRight size={16} /></Button>
                  </Link>
                ) : (
                  <Link href="/booking-widget/checkout">
                    <Button variant="primary">Get started <ArrowRight size={16} /></Button>
                  </Link>
                )}
                <a href="#pricing">
                  <Button variant="secondary">See pricing</Button>
                </a>
              </ButtonGroup>
            </motion.div>
          </HeroTextBlock>

          <MockViewport>
          {isMobileHero ? (
            <HeroMobileImageWrap>
              <Image
                src="/widgetmobilephone.webp"
                alt="Booking widget on mobile — pick a date and book in seconds"
                width={640}
                height={1280}
                sizes="100vw"
                style={{ width: '100%', height: 'auto' }}
              />
            </HeroMobileImageWrap>
          ) : (
            <>
          <AnimatePresence mode="wait">
            <motion.div
              key={shellKey}
              initial={{ clipPath: 'circle(0% at 50% 50%)', scale: 0.96 }}
              animate={{
                clipPath: 'circle(150% at 50% 50%)', scale: 1,
                transition: { duration: 0.52, ease: [0, 0, 0.2, 1] },
              }}
              exit={{
                clipPath: 'circle(0% at 50% 50%)', scale: 1.04,
                transition: { duration: 0.42, ease: [0.4, 0, 1, 1] },
              }}
              style={{ willChange: 'clip-path, transform' }}
            >
                <MockWidgetShell theme={WIDGET_THEMES[themeIdx]}>
                  {/* Content is ALWAYS mounted — useAnimation drives enter/exit */}
                  <MockWidgetContent controls={contentControls} theme={WIDGET_THEMES[themeIdx]} />
                </MockWidgetShell>
            </motion.div>
          </AnimatePresence>
            <ThemeDots>
              {HERO_SEQUENCE.map((_, i) => (
                <ThemeDot key={i} $active={i === seqIdx} onClick={() => runTransition(i)} />
              ))}
            </ThemeDots>
            </>
          )}
          </MockViewport>
        </HeroGrid>
      </Container>
    </HeroWrapper>
  );
};

// ==========================================
// FEATURE GRID 1
// ==========================================

const ValuePropsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  
  @media (max-width: 968px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 568px) {
    grid-template-columns: 1fr;
  }
`;

const VPItem = styled(motion.div)`
  h3 {
    font-size: 16px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  p {
    font-size: 15px;
    color: ${props => props.theme.colors.text};
  }
  @media (max-width: 640px) {
    h3 { font-size: 14px; }
    p { font-size: 13px; }
  }
`;

const FeaturesIntro = () => (
  <Section style={{ background: '#fafbfc' }}>
    <Container>
      <ValuePropsGrid as={motion.div} variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <VPItem variants={fadeUp}>
          <h3><Megaphone size={20} color="#fc4056" /> We do marketing for you</h3>
          <p>Get listed on the Classeasily marketplace. When guests search for experiences, they find you—no ad spend required. We bring discovery to your door.</p>
        </VPItem>
        <VPItem variants={fadeUp}>
          <h3><Store size={20} color="#fc4056" /> Marketplace + widget in one place</h3>
          <p>One account: your listing on Classeasily and an embeddable widget for your website. Same calendar, same payouts. Update once, it's live everywhere.</p>
        </VPItem>
        <VPItem variants={fadeUp}>
          <h3><CreditCard size={20} color="#fc4056" /> Apple Pay and all major cards</h3>
          <p>Checkout on your site with Apple Pay or any major card. We handle payments; you get one payout. No separate payment setup.</p>
        </VPItem>
        <VPItem variants={fadeUp}>
          <h3><LayoutGrid size={20} color="#fc4056" /> Your site, your brand</h3>
          <p>Widget matches your colors and fonts. Show it as a popup, inline block, or floating button—you choose. Domain whitelist keeps your embed secure.</p>
        </VPItem>
      </ValuePropsGrid>
    </Container>
  </Section>
);

// ==========================================
// SECURE CHECKOUT SECTION (Payments)
// ==========================================

const LinkSectionWrapper = styled(Section)`
  background: #fff;
`;

const LinkGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const LinkFeatureList = styled.div`
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const LinkFeature = styled.div`
  h4 {
    font-size: 16px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  p {
    color: ${props => props.theme.colors.text};
    font-size: 15px;
  }
  @media (max-width: 640px) {
    h4 { font-size: 14px; }
    p { font-size: 13px; }
  }
`;


const LinkSection = () => {
  return (
    <LinkSectionWrapper>
      <Container>
        <LinkGrid>
          <MobileTypo as={motion.div} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 style={{ color: '#fc4056', fontSize: 16, marginBottom: 16 }}>Payments guests trust</h2>
            <h3 style={{ fontSize: 40, marginBottom: 24, letterSpacing: '-0.02em' }}>Frictionless, Secure Checkout</h3>
            <p style={{ fontSize: 18, color: '#425466' }}>
              Accept Apple Pay, Google Pay, and all major credit cards instantly. We handle the security and compliance, delivering a single, unified payout directly to your bank account. Whitelist your domains, embed the snippet, and start transacting seamlessly.
            </p>
            <div style={{ marginTop: 24 }}>
              <Link href="/business/help/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>View integration docs <ArrowRight size={16} style={{ verticalAlign: 'middle' }}/></Link>
            </div>

            <LinkFeatureList>
              <LinkFeature>
                <h4><CreditCard size={20} color="#fc4056" /> Digital Wallets</h4>
                <p>One-tap checkout with Apple Pay and Google Pay. Accelerate conversions with the frictionless flow modern guests expect.</p>
              </LinkFeature>
              <LinkFeature>
                <h4><ShieldCheck size={20} color="#fc4056" /> All Major Cards</h4>
                <p>Visa, Mastercard, Amex, and more. Stop maintaining a secondary payment stack—run everything through one unified dashboard.</p>
              </LinkFeature>
            </LinkFeatureList>
          </MobileTypo>

          {/* RIGHT: Payment methods image */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease:[0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {/* Wrapper needed for inset-shadow overlay — box-shadow:inset is invisible on <img> */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 350, borderRadius: 16, overflow: 'hidden', display: 'block', lineHeight: 0 }}>
              <img
                src="/methods.jpeg"
                alt="Payment methods"
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 16 }}
              />
              {/* Inset shadow overlay: lower-middle-right depth effect */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 16,
                pointerEvents: 'none',
              }} />
            </div>
          </motion.div>
        </LinkGrid>
      </Container>
    </LinkSectionWrapper>
  );
};

// ==========================================
// SECTION DIAGONAL DIVIDER
// ==========================================

const DiagonalDivider = ({ fromBg = '#f8fafc', toBg = '#ffffff', flip = false }) => (
  <div style={{ lineHeight: 0, background: toBg, display: 'block', overflow: 'hidden' }}>
    <svg
      viewBox="0 0 1440 52"
      preserveAspectRatio="none"
      width="100%"
      height="52"
      style={{ display: 'block', transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      {/* Fill triangle from previous section */}
      <path d="M0,0 L1440,0 L0,52 Z" fill={fromBg} />
      {/* Thin accent stroke along the diagonal */}
      <line x1="0" y1="0" x2="1440" y2="52" stroke="rgba(252,64,86,0.14)" strokeWidth="1.7" />
    </svg>
  </div>
);

// ==========================================
// CUSTOMIZATION (INTERACTIVE CODE SPLIT)
// ==========================================

const CustomizationSection = styled(Section)`
  background: #ffffff;
`;

// Professional themes only for the customization section: Classic, Retro, Minimal
// Hero cycles: Minimal → Retro → Classic
const HERO_SEQUENCE = [3, 2, 0];

const CUST_THEME_INDICES = [3, 2, 0];
const CUST_THEME_NAMES   = ['Minimal', 'Retro', 'Classic'];

const presetContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const ThemePill = styled.button`
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid ${props => props.$active ? props.$color : '#E2E8F0'};
  background: ${props => props.$active ? props.$color : '#fff'};
  color: ${props => props.$active ? '#fff' : '#425466'};
  cursor: pointer;
  white-space: nowrap;
  &:hover { border-color: ${props => props.$color}; }
  @media (max-width: 640px) {
    font-size: 12px;
    padding: 5px 11px;
  }
`;

const PresetStrip = styled(motion.div)`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 40px;
`;

const PreviewCard = styled(motion.div)`
  max-width: 860px;
  margin: 0 auto;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 32px 64px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);
`;

// ── Module-level animation variants for MockReviewContent ──────────────────
// Wrapper resolves controls.start('exit') after 0.40s — all children finish within that.
const reviewWrapV = {
  enter: { opacity: 1, transition: { duration: 0.01 } },
  exit:  { opacity: 1, transition: { duration: 0.40 } },
};
// Left form rows: stagger upward on exit, spring in from below
const reviewFormRowV = {
  enter: (i) => ({ opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 380, damping: 26, delay: 0.04 + i * 0.05 } }),
  exit:  (i) => ({ opacity: 0, y: -10, filter: 'blur(2px)', transition: { duration: 0.15, delay: i * 0.03 } }),
};
// Right summary cards: stagger from right on exit, spring in from right
const reviewSummaryRowV = {
  enter: (i) => ({ opacity: 1, x: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 320, damping: 28, delay: 0.08 + i * 0.08 } }),
  exit:  (i) => ({ opacity: 0, x: 14, filter: 'blur(2px)', transition: { duration: 0.16, delay: i * 0.04 } }),
};

// ── ReviewStep content — permanently mounted, controls-driven ──────────────
const MockReviewContent = ({ theme: t, controls, isMobile }) => {
  const primary = t.primary;
  const inputBase = {
    width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 10,
    fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
    background: '#fff', color: '#9ca3af',
  };
  const inputSm = {
    width: '100%', padding: '9px 11px', border: '1px solid #e5e7eb', borderRadius: 8,
    fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
    background: '#fff', color: '#9ca3af',
  };
  const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };
  const lblSm = { display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 };
  const Skel = ({ w = '100%', h = 12, r = 6, mb = 0, mt = 0 }) => (
    <div style={{ width: w, height: h, borderRadius: r, background: '#E5E7EB', marginBottom: mb, marginTop: mt }} />
  );

  /* ── Mobile layout: compact booking summary bar at top, single-column form ── */
  if (isMobile) {
    return (
      <motion.div
        animate={controls}
        variants={reviewWrapV}
        initial="enter"
        style={{ padding: '16px 18px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
      >
        {/* Compact booking summary bar */}
        <motion.div custom={0} variants={reviewFormRowV}
          style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '10px 12px', marginBottom: 16 }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 8, background: '#E5E7EB', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Yoga Flow · Sat, Mar 14
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#6b7280' }}>2:00–3:30 PM · 2 guests</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>$101.98</span>
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h3 custom={1} variants={reviewFormRowV}
          style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#111827' }}
        >Your details</motion.h3>

        {/* Name row */}
        <motion.div custom={2} variants={reviewFormRowV}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 9 }}
        >
          <div>
            <label style={lblSm}>First name <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={inputSm}>Alex</div>
          </div>
          <div>
            <label style={lblSm}>Last name</label>
            <div style={inputSm}>Johnson</div>
          </div>
        </motion.div>

        {/* Email */}
        <motion.div custom={3} variants={reviewFormRowV} style={{ marginBottom: 9 }}>
          <label style={lblSm}>Email <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ ...inputSm, borderColor: primary, boxShadow: `0 0 0 3px ${primary}22` }}>
            alex@example.com
          </div>
        </motion.div>

        {/* Continue CTA */}
        <motion.div custom={4} variants={reviewFormRowV}>
          <div style={{
            width: '100%', background: primary, color: '#fff',
            padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            textAlign: 'center', boxSizing: 'border-box', marginTop: 4,
          }}>Continue to payment →</div>
        </motion.div>
      </motion.div>
    );
  }

  /* ── Desktop layout: two-column form + summary ── */
  return (
    <motion.div
      animate={controls}
      variants={reviewWrapV}
      initial="exit"
      style={{ padding: 28, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28, alignItems: 'flex-start' }}>

        {/* LEFT — form */}
        <div>
          {/* Title */}
          <motion.h3
            custom={0} variants={reviewFormRowV}
            style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: '#111827' }}
          >Your details</motion.h3>

          {/* Name row */}
          <motion.div custom={1} variants={reviewFormRowV} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={lbl}>First name <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={inputBase}>Alex</div>
            </div>
            <div>
              <label style={lbl}>Last name</label>
              <div style={inputBase}>Johnson</div>
            </div>
          </motion.div>

          {/* Email — shows focused ring in theme primary */}
          <motion.div custom={2} variants={reviewFormRowV} style={{ marginBottom: 10 }}>
            <label style={lbl}>Email <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ ...inputBase, borderColor: primary, boxShadow: `0 0 0 3px ${primary}25` }}>alex@example.com</div>
          </motion.div>

          {/* Phone */}
          <motion.div custom={3} variants={reviewFormRowV} style={{ marginBottom: 20 }}>
            <label style={lbl}>Phone <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={inputBase}>+1 (555) 012-3456</div>
          </motion.div>

          {/* Cancellation policy */}
          <motion.div custom={4} variants={reviewFormRowV}
            style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: 13, marginBottom: 3 }}>Cancellation policy</div>
                <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.55 }}>Full refund if cancelled at least 24 hours before the session starts.</div>
              </div>
            </div>
          </motion.div>

          {/* Terms + CTA */}
          <motion.div custom={5} variants={reviewFormRowV}>
            <p style={{ margin: '0 0 14px', fontSize: 11, color: '#6b7280', lineHeight: 1.5, textAlign: 'center' }}>
              By continuing, you agree to our{' '}
              <span style={{ textDecoration: 'underline' }}>Terms of Service</span>{' and '}
              <span style={{ textDecoration: 'underline' }}>Privacy Policy</span>.
            </p>
            <div style={{
              width: '100%', background: primary, color: '#fff',
              padding: '14px 20px', borderRadius: 12, fontSize: 15, fontWeight: 700,
              textAlign: 'center', boxSizing: 'border-box',
            }}>Continue to payment →</div>
          </motion.div>
        </div>

        {/* RIGHT — booking summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Class info card — skeleton thumbnail + skeleton title lines */}
          <motion.div custom={0} variants={reviewSummaryRowV}
            style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <div style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
              {/* Skeleton image square */}
              <div style={{ width: 52, height: 52, borderRadius: 10, background: '#E5E7EB', flexShrink: 0 }} />
              {/* Skeleton title lines */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Skel h={11} r={5} mb={7} w="88%" />
                <Skel h={9}  r={4} w="60%" />
              </div>
            </div>
            {[['Date','Sat, Mar 14, 2026'],['Time','9:00 – 10:30 AM'],['Guests','2 guests']].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '1px solid #f9fafb' }}>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>{val}</span>
              </div>
            ))}
          </motion.div>

          {/* Total card */}
          <motion.div custom={1} variants={reviewSummaryRowV}
            style={{ background: '#fff', border: '1px solid #111827', borderRadius: 12, padding: '13px 16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Total</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: '#6b7280' }}>includes taxes</div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>$101.98</div>
            </div>
            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textDecoration: 'underline', cursor: 'default' }}>View price details</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// ── ReviewStep shell — background that iris-wipes per theme ────────────────
const MockReviewShell = ({ theme: t, children }) => (
  <div style={{
    background: t.holoGradient || t.outerBg,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    userSelect: 'none',
  }}>
    {children}
  </div>
);

const Customization = () => {
  const [custIdx, setCustIdx]   = useState(0); // Minimal = default (index 0)
  const [shellKey, setShellKey] = useState(0);
  const reviewControls          = useAnimation();
  const custAnimating           = useRef(false);
  const isMobile                = useIsMobile(640);

  // Animate content in on mount
  useEffect(() => { reviewControls.start('enter'); }, [reviewControls]);

  const runCustTransition = useCallback(async (targetIdx) => {
    if (custAnimating.current || targetIdx === custIdx) return;
    custAnimating.current = true;

    // Phase 1 — stagger all form rows / summary cards out
    // Wrapper exit duration (0.40s) ≥ last child exit (5 × 0.03 + 0.15 = 0.30s)
    await reviewControls.start('exit');

    // Phase 2 — iris-wipe shell with new theme (content DOM still mounted, just invisible)
    setCustIdx(targetIdx);
    setShellKey(k => k + 1);
    await sleep(460); // old iris collapses (0.42s) + tiny buffer

    // Phase 3 — spring content back in as new iris opens
    await reviewControls.start('enter');
    await sleep(180);

    custAnimating.current = false;
  }, [custIdx, reviewControls]);

  const theme = WIDGET_THEMES[CUST_THEME_INDICES[custIdx]];

  return (
    <CustomizationSection id="customization">
      <Container>
        <MobileTypo as={motion.div}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <h3 style={{ fontSize: 40, marginBottom: 16, letterSpacing: '-0.02em', color: '#0A2540', lineHeight: 1.15 }}>
            Your colors, your fonts—no CSS required
          </h3>
          <p style={{ fontSize: 18, color: '#425466', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
            Customize primary colors, typography, and border radii from your dashboard. Changes sync instantly to every embedded widget.
          </p>
        </MobileTypo>

        <PresetStrip
          variants={presetContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {CUST_THEME_INDICES.map((themeI, i) => {
            const t = WIDGET_THEMES[themeI];
            return (
              <ThemePill
                key={t.id}
                $active={custIdx === i}
                $color={t.primary}
                onClick={() => runCustTransition(i)}
              >
                {CUST_THEME_NAMES[i]}
              </ThemePill>
            );
          })}
        </PresetStrip>

        <div style={{ position: 'relative' }}>
          {/* Shell iris-wipes on shellKey — content stays mounted underneath */}
          <AnimatePresence mode="wait">
            <PreviewCard
              key={shellKey}
              initial={{ clipPath: 'circle(0% at 50% 50%)', scale: 0.97 }}
              animate={{ clipPath: 'circle(150% at 50% 50%)', scale: 1, transition: { duration: 0.50, ease: [0, 0, 0.2, 1] } }}
              exit={{ clipPath: 'circle(0% at 50% 50%)', scale: 1.03, transition: { duration: 0.42, ease: [0.4, 0, 1, 1] } }}
              style={{ willChange: 'clip-path, transform' }}
            >
              <MockReviewShell theme={theme}>
                <MockReviewContent controls={reviewControls} theme={theme} isMobile={isMobile} />
              </MockReviewShell>
            </PreviewCard>
          </AnimatePresence>
        </div>
      </Container>
    </CustomizationSection>
  );
};

// ==========================================
// LISTS SECTION
// ==========================================

const ListGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: 968px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  @media (max-width: 568px) {
    grid-template-columns: 1fr;
  }
`;

const ListColumn = styled(motion.div)`
  h4 {
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 10px;
    border-bottom: 1px solid #E2E8F0;
    padding-bottom: 8px;
    color: #0A2540;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 13px;
      line-height: 1.4;
      color: #425466;
    }
  }
  @media (max-width: 640px) {
    h4 { font-size: 12px; }
    ul li { font-size: 12px; }
  }
`;

const FeatureLists = () => (
  <Section bg="#f8fafc">
    <Container>
      <MobileTypo as={motion.div} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#fc4056', fontSize: 14, marginBottom: 8 }}>What you get</h2>
        <h3 style={{ fontSize: 32, marginBottom: 12, letterSpacing: '-0.02em' }}>Discovery, your site, one system</h3>
        <p style={{ fontSize: 16, color: '#425466', maxWidth: 720, margin: 0 }}>
          Listed on the marketplace so we bring you customers. Widget on your site so visitors book there. Same calendar and payouts.
        </p>
      </MobileTypo>

      <ListGrid as={motion.div} variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <ListColumn variants={fadeUp}>
          <h4>Discovery</h4>
          <ul>
            <li><Check size={14} color="#fc4056" style={{ marginTop: 1, flexShrink: 0 }} /> Listed on Classeasily marketplace</li>
            <li><Check size={14} color="#fc4056" style={{ marginTop: 1, flexShrink: 0 }} /> Searchable by location, category & date</li>
            <li><Check size={14} color="#fc4056" style={{ marginTop: 1, flexShrink: 0 }} /> No ad spend to get visibility</li>
            <li><Check size={14} color="#fc4056" style={{ marginTop: 1, flexShrink: 0 }} /> Public profile with reviews</li>
          </ul>
        </ListColumn>
        <ListColumn variants={fadeUp}>
          <h4>One platform</h4>
          <ul>
            <li><Check size={14} color="#fc4056" style={{ marginTop: 1, flexShrink: 0 }} /> Marketplace + widget, one account</li>
            <li><Check size={14} color="#fc4056" style={{ marginTop: 1, flexShrink: 0 }} /> One calendar — update once, syncs everywhere</li>
            <li><Check size={14} color="#fc4056" style={{ marginTop: 1, flexShrink: 0 }} /> Single dashboard for all bookings</li>
            <li><Check size={14} color="#fc4056" style={{ marginTop: 1, flexShrink: 0 }} /> One payout regardless of booking source</li>
          </ul>
        </ListColumn>
        <ListColumn variants={fadeUp}>
          <h4>Payments</h4>
          <ul>
            <li><Check size={14} color="#fc4056" style={{ marginTop: 1, flexShrink: 0 }} /> Visa, Mastercard, Amex</li>
            <li><Check size={14} color="#fc4056" style={{ marginTop: 1, flexShrink: 0 }} /> Apple Pay &amp; Google Pay</li>
            <li><Check size={14} color="#fc4056" style={{ marginTop: 1, flexShrink: 0 }} /> Secure checkout; payouts to your bank</li>
          </ul>
        </ListColumn>
        <ListColumn variants={fadeUp}>
          <h4>Control</h4>
          <ul>
            <li><Check size={14} color="#fc4056" style={{ marginTop: 1, flexShrink: 0 }} /> Brand colors, fonts &amp; border radius</li>
            <li><Check size={14} color="#fc4056" style={{ marginTop: 1, flexShrink: 0 }} /> Modal, inline, or floating embed</li>
            <li><Check size={14} color="#fc4056" style={{ marginTop: 1, flexShrink: 0 }} /> Domain whitelist — only on your site</li>
            <li><Check size={14} color="#fc4056" style={{ marginTop: 1, flexShrink: 0 }} /> Pin to one class or show all</li>
          </ul>
        </ListColumn>
      </ListGrid>
    </Container>
  </Section>
);

// ==========================================
// FAQ
// ==========================================

const FAQ_ITEMS = [
  {
    q: 'Do I need a developer to add the widget?',
    a: 'No. Copy two lines of code from your dashboard and paste them into any page. It works on Wix, Squarespace, WordPress, Webflow, and plain HTML — no coding required.',
  },
  {
    q: 'Will it slow down my website?',
    a: 'The widget script loads asynchronously so it never blocks your page. It only fully loads when a visitor interacts with the booking button.',
  },
  {
    q: 'How does the commission work exactly?',
    a: 'You pay a flat monthly fee (Basic $29 / Growth $49 / Advanced $89) plus a percentage of each booking. For example, on the Growth plan a $100 booking costs $3.00 in commission. Stripe processing fees are also deducted from your payout — these are standard card processing rates and not set by us.',
  },
  {
    q: 'Can I use the widget if I already use another booking tool?',
    a: 'The widget only works with Classeasily. You manage all your availability and classes in your Classeasily dashboard — it becomes your single source of truth for both the marketplace listing and the site widget.',
  },
  {
    q: 'Is the checkout secure?',
    a: 'Yes. Payments are processed by Stripe, which is PCI DSS Level 1 certified. Card details never touch our servers.',
  },
  {
    q: 'Can I show only one specific class on my site?',
    a: 'Yes. In the widget settings you can pin it to a single class, so when a visitor clicks the button they jump straight to date and time selection for that class — skipping the class picker entirely.',
  },
];

const FaqSection = styled.section`
  padding: 72px 0 80px;
`;

const FaqList = styled(motion.div)`
  max-width: 720px;
  margin: 40px auto 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  @media (max-width: 640px) {
    [data-faq-q] { font-size: 13px !important; }
    [data-faq-a] { font-size: 13px !important; }
    button { padding: 14px 18px !important; }
  }
`;

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ borderBottom: '1px solid #F1F5F9' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span data-faq-q style={{ fontSize: 15, fontWeight: 600, color: '#0A2540', lineHeight: 1.4 }}>{q}</span>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', background: open ? '#0A2540' : '#F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'background 0.2s',
        }}>
          <span style={{ fontSize: 16, lineHeight: 1, color: open ? '#fff' : '#64748B', display: 'block', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
        </span>
      </button>
      {open && (
        <div data-faq-a style={{ padding: '0 24px 18px', fontSize: 14, color: '#425466', lineHeight: 1.7 }}>
          {a}
        </div>
      )}
    </div>
  );
};

const Faq = () => (
  <FaqSection>
    <Container>
      <MobileTypo as={motion.div} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#fc4056', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>FAQ</h2>
        <h3 style={{ fontSize: 32, letterSpacing: '-0.025em', color: '#0A2540', marginBottom: 0, lineHeight: 1.15 }}>
          Common questions
        </h3>
      </MobileTypo>
      <FaqList variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        {FAQ_ITEMS.map((item, i) => (
          <FaqItem key={i} q={item.q} a={item.a} />
        ))}
      </FaqList>
    </Container>
  </FaqSection>
);

// ==========================================
// PRICING & PATH
// ==========================================

const PricingGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 48px;
  align-items: start;
  overflow: visible;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

/* Single unified card — no split sections. overflow: visible so tooltips can extend outside. */
const PlanCard = styled(motion.div)`
  border-radius: 18px;
  padding: 22px 22px 20px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: visible;
  background: ${props => props.$featured
    ? 'linear-gradient(170deg, #fff 0%, rgba(255,230,160,0.55) 32%, rgba(255,185,120,0.42) 54%, rgba(155,170,255,0.38) 76%, #fff 100%)'
    : '#fff'};
  border: ${props => props.$featured ? 'none' : '1px solid #E4E4E7'};
  box-shadow: ${props => props.$featured
    ? '0 16px 48px rgba(0,0,0,0.13)'
    : 'none'};

  /* For featured: overlay a radial white bloom then fade body to near-white */
  &::before {
    content: '';
    display: ${props => props.$featured ? 'block' : 'none'};
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 70% 55% at 38% 44%, rgba(255,255,255,0.72) 0%, transparent 65%),
      linear-gradient(175deg, rgba(255,255,255,0) 38%, rgba(255,255,255,0.94) 72%, #fff 100%);
    pointer-events: none;
    z-index: 0;
  }
`;

const PlanInner = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const PlanName = styled.h3`
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 7px;
  background: ${props => props.$gradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  width: fit-content;
  @media (max-width: 640px) {
    font-size: 17px;
  }
`;

const PlanPriceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;

  .big {
    font-size: 28px;
    font-weight: 700;
    color: #111;
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .meta {
    display: flex;
    flex-direction: column;
    gap: 1px;
    font-size: 12px;
    color: #6B7280;
    line-height: 1.45;
  }
  @media (max-width: 640px) {
    .big { font-size: 22px; }
    .meta { font-size: 11px; }
  }
`;

const PlanCommission = styled.div`
  font-size: 12.5px;
  color: #6B7280;
  margin-bottom: 18px;
  @media (max-width: 640px) {
    font-size: 11px;
  }
`;

const PlanCtaBtn = styled(Link)`
  display: block;
  text-align: center;
  padding: 11px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  margin-bottom: 18px;
  background: ${props => props.$featured ? '#111' : '#E4E4E7'};
  color: ${props => props.$featured ? '#fff' : '#111'};
  &:hover { color: ${props => props.$featured ? '#fff' : '#111'}; opacity: 0.85; }
  @media (max-width: 640px) {
    font-size: 13px;
    padding: 10px;
  }
`;

const CurrentPlanBadge = styled.span`
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #0d9488;
  background: rgba(13, 148, 136, 0.1);
  padding: 4px 10px;
  border-radius: 999px;
  margin-bottom: 12px;
`;

const PlanFeatureRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 6px 0;
  font-size: 13.5px;
  color: #374151;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  &:last-child { border-bottom: none; }
  @media (max-width: 640px) {
    font-size: 12px;
  }
`;

const PlanFeatureLabel = styled.span`
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const PlanFeatureTooltipWrap = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  .tooltip-icon {
    color: #9CA3AF;
    cursor: help;
    &:hover { color: #6B7280; }
  }
  .tooltip-bubble {
    position: absolute;
    left: 50%;
    bottom: 100%;
    padding: 8px 10px;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.4;
    color: #fff;
    background: #374151;
    border-radius: 6px;
    white-space: normal;
    width: max-content;
    max-width: 220px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 50;
    pointer-events: none;
    transform-origin: center bottom;
  }
  .tooltip-bubble::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #374151;
  }
`;

const PlanFootnote = styled.div`
  font-size: 12.5px;
  color: #9CA3AF;
  margin-top: 14px;
  @media (max-width: 640px) {
    font-size: 11px;
  }
`;

const PricingStripeNote = styled(motion.p)`
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
  margin-top: 20px;
  @media (max-width: 640px) {
    font-size: 12px;
  }
`;

// Features: { label, tooltip? }. Tooltip shows on hover for clarity.
const PLAN_FEATURES_BASIC = [
  { label: 'Widget on your website' },
  { label: 'Marketplace listing', tooltip: 'Get discovered by customers searching for classes on Classeasily.' },
  { label: 'One dashboard & payout' },
  { label: 'Brand colors & fonts' },
  { label: 'Modal, inline, or floating embed' },
];

const PLAN_FEATURES_GROWTH = [
  { label: 'Everything in Basic' },
  { label: 'Personalized booking emails', tooltip: 'Confirmation and reminder emails sent under your brand — your logo, colors, and custom message. Not generic Classeasily emails.' },
  { label: 'Domain whitelist', tooltip: 'Restrict your widget so it only loads on your own site. Prevents unauthorized embedding on third-party pages.' },
  { label: 'Pin widget to a specific class', tooltip: 'Embed a booking button for one class or location — great for landing pages, ads, and campaigns.' },
  { label: 'Widget revenue & booking analytics', tooltip: 'Track widget-specific conversion rates, revenue by class, and booking trends. Separate from your Marketplace stats.' },
  { label: 'Automated pre-class reminders', tooltip: 'Email (and optional SMS) reminders sent automatically before each session to cut no-shows.' },
  { label: 'Post-class review requests', tooltip: 'Automatically prompt customers for a review after each class to build your public reputation.' },
  { label: 'Promo codes & discounts' },
  { label: 'Priority support' },
];

const PLAN_FEATURES_ADVANCED = [
  { label: 'Everything in Growth' },
  { label: 'Multiple domain whitelists', tooltip: 'Run your widget across multiple websites, microsites, or partner pages — each separately whitelisted.' },
  { label: 'White-label widget', tooltip: 'Remove all Classeasily branding entirely. Customers only see your brand when they book.' },
  { label: 'API access', tooltip: 'Connect booking data directly to your CRM, scheduling tools, or custom apps via the Classeasily REST API.' },
  { label: 'Dedicated account manager' },
  { label: 'Personal onboarding call' },
  { label: 'SLA-backed support' },
];

const tooltipVariants = {
  hidden: {
    opacity: 0,
    scale: 0.65,
    y: 14,
    x: '-50%',
    rotateX: -28,
    filter: 'blur(7px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: -8,
    x: '-50%',
    rotateX: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      damping: 18,
      stiffness: 320,
      mass: 0.6,
      filter: { duration: 0.2, ease: 'easeOut' },
      opacity: { duration: 0.15 },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.7,
    y: 8,
    x: '-50%',
    rotateX: 14,
    filter: 'blur(5px)',
    transition: { duration: 0.13, ease: [0.4, 0, 1, 1] },
  },
};

function FeatureTooltip({ tooltip }) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <PlanFeatureTooltipWrap
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      style={{ perspective: '500px' }}
    >
      <HelpCircle size={14} className="tooltip-icon" aria-hidden />
      <AnimatePresence>
        {isVisible && (
          <motion.span
            key="bubble"
            className="tooltip-bubble"
            role="tooltip"
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ position: 'absolute', left: '50%', bottom: '100%', transformOrigin: 'bottom center' }}
          >
            {tooltip}
          </motion.span>
        )}
      </AnimatePresence>
    </PlanFeatureTooltipWrap>
  );
}

const PLAN_CARDS = [
  { id: 'basic', name: 'Basic', price: '$29', commission: '4%', gradient: 'linear-gradient(90deg, #2563eb 0%, #ef4444 50%, #eab308 100%)', features: PLAN_FEATURES_BASIC, footnote: 'Need more bookings?', featured: false },
  { id: 'growth', name: 'Growth', price: '$49', commission: '3%', gradient: 'none', features: PLAN_FEATURES_GROWTH, footnote: 'Best value for growing studios.', featured: true },
  { id: 'advanced', name: 'Advanced', price: '$89', commission: '2%', gradient: 'linear-gradient(90deg, #2563eb 0%, #ef4444 50%, #eab308 100%)', features: PLAN_FEATURES_ADVANCED, footnote: 'Need a custom plan?', featured: false },
];

function PricingAndPath() {
  const { subscription } = useSubscription();
  const currentPlanId = subscription?.planId;

  const getCta = (planId) => {
    const isCurrent = currentPlanId === planId;
    if (isCurrent) {
      return { label: 'Manage plan', href: '/business/dashboard/widget' };
    }
    if (!currentPlanId) {
      return { label: 'Get started', href: `/booking-widget/checkout?plan=${planId}` };
    }
    if (isUpgrade(currentPlanId, planId)) {
      return { label: 'Upgrade', href: `/booking-widget/checkout?plan=${planId}` };
    }
    if (isDowngrade(currentPlanId, planId)) {
      return { label: 'Downgrade', href: `/booking-widget/checkout?plan=${planId}` };
    }
    return { label: 'Get started', href: `/booking-widget/checkout?plan=${planId}` };
  };

  return (
    <Section id="pricing">
      <Container>
        <MobileTypo as={motion.div} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <h3 style={{ fontSize: 32, letterSpacing: '-0.025em', color: '#0A2540', marginBottom: 10, lineHeight: 1.15 }}>
            Simple, commission-based plans
          </h3>
          <p style={{ fontSize: 16, color: '#64748B', maxWidth: 560, margin: 0 }}>
            A flat monthly fee plus a small commission per booking — no hidden charges, no separate payment processor setup.
          </p>
        </MobileTypo>

        <PricingGrid variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          {PLAN_CARDS.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const cta = getCta(plan.id);
            return (
              <PlanCard key={plan.id} variants={fadeUp} $featured={plan.featured}>
                <PlanInner>
                  {isCurrent && <CurrentPlanBadge>Current plan</CurrentPlanBadge>}
                  <PlanName
                    $gradient={plan.gradient}
                    style={plan.featured ? { WebkitTextFillColor: '#111', backgroundImage: 'none', color: '#111' } : undefined}
                  >
                    {plan.name}
                  </PlanName>
                  <PlanPriceRow>
                    <span className="big">{plan.price}</span>
                    <span className="meta"><span>per month</span></span>
                  </PlanPriceRow>
                  <PlanCommission>+ {plan.commission} commission per booking</PlanCommission>
                  <PlanCtaBtn href={cta.href} $featured={plan.featured}>{cta.label}</PlanCtaBtn>
                  <div>
                    {plan.features.map((f, i) => (
                      <PlanFeatureRow key={f.label + i}>
                        <Check size={15} color="#6B7280" style={{ marginTop: 1, flexShrink: 0 }} />
                        <PlanFeatureLabel>
                          {f.label}
                          {f.tooltip && <FeatureTooltip tooltip={f.tooltip} />}
                        </PlanFeatureLabel>
                      </PlanFeatureRow>
                    ))}
                  </div>
                  <PlanFootnote>{plan.footnote}</PlanFootnote>
                </PlanInner>
              </PlanCard>
            );
          })}
        </PricingGrid>

        <PricingStripeNote
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          Payment processing fees (Stripe) are deducted from your payout and are not included in the commission above.
        </PricingStripeNote>
      </Container>
    </Section>
  );
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export default function WidgetLandingClient() {
  return (
    <ThemeProvider theme={theme}>
      <main>
        <Hero />
        <DiagonalDivider fromBg="#ffffff" toBg="#fafbfc" />
        <FeaturesIntro />
        <DiagonalDivider fromBg="#fafbfc" toBg="#f8fafc" flip />
        <LinkSection />
        <DiagonalDivider fromBg="#ffffff" toBg="#ffffff" flip />
        <Customization />
        <DiagonalDivider fromBg="#ffffff" toBg="#f8fafc" />
        <FeatureLists />
        <DiagonalDivider fromBg="#f8fafc" toBg="#ffffff" flip />
        <PricingAndPath />
        <DiagonalDivider fromBg="#ffffff" toBg="#ffffff" />

        <Faq />
        
      </main>
      <FooterSmart />
    </ThemeProvider>
  );
}