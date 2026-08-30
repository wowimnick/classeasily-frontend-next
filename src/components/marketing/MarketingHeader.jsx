"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styled, { css } from "styled-components";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, LogIn, Menu, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useAuthModal } from "@/context/AuthContext";
import { marketingTheme as t, REGISTER_HREF, PRICING_HREF, BP } from "./tokens";

const BANNER_OFFSET = 58;
const BANNER_OFFSET_MOBILE = 36;
const DOCK_TOP_DESKTOP = 14;
const DOCK_TOP_MOBILE = 10;
const MOBILE_MQ = `(max-width: ${BP.mobile}px)`;

const LogoIcon = dynamic(() => import("@/components/common/logoIcon"), {
  ssr: false,
});
const CustomUserMenu = dynamic(
  () => import("@/components/header/CustomUserMenu"),
  { ssr: false, loading: () => null },
);
const SettingsModal = dynamic(() => import("@/components/header/SettingsDrawer"), {
  ssr: false,
});

const GuestUserIcon = ({ color, size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.97444 29.1576C8.88693 27.0078 11.0174 25.5 13.5 25.5H22.5C24.9826 25.5 27.1131 27.0078 28.0256 29.1576M24 14.25C24 17.5637 21.3137 20.25 18 20.25C14.6863 20.25 12 17.5637 12 14.25C12 10.9363 14.6863 8.25 18 8.25C21.3137 8.25 24 10.9363 24 14.25ZM33 18C33 26.2843 26.2843 33 18 33C9.71573 33 3 26.2843 3 18C3 9.71573 9.71573 3 18 3C26.2843 3 33 9.71573 33 18Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PromoBanner = styled.div`
  position: relative;
  width: 100%;
  background: linear-gradient(90deg, #f92346 0%, #ff3d5c 50%, #f92346 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
  padding: 12px 24px 34px;
  min-height: 76px;
  box-shadow:
    inset 0 -1px 0 0 rgba(255, 255, 255, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.12);

  @media (max-width: ${BP.mobile}px) {
    padding: 6px 16px 20px;
    min-height: 40px;
  }
`;

const PromoInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 8px;
  width: 100%;
  max-width: 1200px;
  text-align: center;
  font-family: ${t.fonts.body};
  font-size: clamp(13px, 0.8vw + 11px, 15px);
  line-height: 1.2;
  color: #fff;

  @media (max-width: ${BP.mobile}px) {
    gap: 6px;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const PromoCopy = styled.p`
  margin: 0;
  font-weight: 650;
  letter-spacing: -0.2px;
  color: #fff;
`;

const PromoUnderline = styled.span`
  font-weight: 750;
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 3px;
  text-decoration-color: rgba(255, 255, 255, 0.88);
`;

const PromoRest = styled.span`
  font-weight: 500;
  opacity: 0.92;

  @media (max-width: ${BP.mobile}px) {
    display: none;
  }
`;

const glassSurface = css`
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(24px) saturate(190%);
  -webkit-backdrop-filter: blur(24px) saturate(190%);
  border-color: rgba(255, 255, 255, 0.68);
  box-shadow:
    0 12px 40px rgba(15, 18, 30, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.88);
`;

const HeaderCluster = styled.div`
  position: relative;
`;

const HeaderBar = styled.header`
  background: rgba(255, 255, 255, 0);
  border: 1px solid transparent;
  box-shadow:
    0 12px 40px rgba(15, 18, 30, 0),
    0 0 0 1px rgba(255, 255, 255, 0),
    inset 0 1px 0 rgba(255, 255, 255, 0);
  backdrop-filter: blur(0) saturate(100%);
  -webkit-backdrop-filter: blur(0) saturate(100%);
  padding: ${(p) => (p.$isScrolled ? "0.35rem 1.15rem" : "0.5rem 3rem")};
  position: ${(p) => (p.$isScrolled ? "fixed" : "absolute")};
  top: max(
    ${(p) => (p.$isScrolled ? DOCK_TOP_DESKTOP : BANNER_OFFSET)}px,
    env(safe-area-inset-top, 0px)
  );
  left: 0;
  right: 0;
  z-index: 999;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  color: #000;
  text-align: center;
  border-radius: 0;
  box-sizing: border-box;
  transition:
    background 0.35s ease,
    padding 0.35s ease,
    box-shadow 0.35s ease,
    border-radius 0.35s ease,
    border-color 0.35s ease,
    backdrop-filter 0.35s ease,
    -webkit-backdrop-filter 0.35s ease;

  ${(p) =>
    p.$contained &&
    css`
      left: 20px;
      right: 20px;
      width: auto;
      max-width: 1140px;
      margin-left: auto;
      margin-right: auto;
      padding-left: 20px;
      padding-right: 20px;
    `}

  ${(p) =>
    p.$isScrolled &&
    css`
      border-radius: 22px;
      ${glassSurface}
    `}

  @media (max-width: ${BP.mobile}px) {
    top: max(
      ${(p) => (p.$isScrolled ? DOCK_TOP_MOBILE : BANNER_OFFSET_MOBILE)}px,
      env(safe-area-inset-top, 0px)
    );
    padding: ${(p) => (p.$isScrolled ? "0.35rem 0.7rem" : "10px 1rem")};
    overflow: hidden;

    ${(p) =>
      p.$contained &&
      css`
        left: 12px;
        right: 12px;
        padding-left: 14px;
        padding-right: 14px;
      `}

    ${(p) =>
      p.$isScrolled &&
      css`
        border-radius: 20px;
      `}

    ${(p) =>
      p.$menuOpen &&
      css`
        left: 12px;
        right: 12px;
        width: auto;
        ${glassSurface}
        border-radius: 24px;
        overflow: hidden;
      `}
  }
`;

export const MarketingSheet = styled.div`
  position: relative;
  z-index: 95;
  margin-top: -22px;
  box-sizing: border-box;
  background-color: #fff;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
  border-left: 1px solid rgba(0, 0, 0, 0.055);
  border-right: 1px solid rgba(0, 0, 0, 0.055);
  box-shadow:
    0 -10px 32px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  overflow-x: clip;
  overflow-y: visible;
  padding-top: 4.25rem;

  @media (max-width: 768px) {
    margin-top: -14px;
    border-top-left-radius: 18px;
    border-top-right-radius: 18px;
    box-shadow:
      0 -8px 24px rgba(0, 0, 0, 0.07),
      inset 0 1px 0 rgba(255, 255, 255, 0.95);
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  & > svg {
    width: ${(p) => (p.$isScrolled ? "2.5rem" : "3rem")};
    height: ${(p) => (p.$isScrolled ? "2.5rem" : "3rem")};
    transition: all 0.3s ease;
  }
  @media (max-width: ${BP.mobile}px) {
    & > svg {
      width: 2.25rem;
      height: 2.25rem;
    }
  }
`;

const Title = styled.p`
  font-family: ${t.fonts.body};
  font-weight: 600;
  font-size: ${(p) => (p.$isScrolled ? "2rem" : "2.5rem")};
  margin: ${(p) => (p.$isScrolled ? "0.2rem" : "0.4rem")} 0
    ${(p) => (p.$isScrolled ? "0.2rem" : "0.4rem")} 0.15rem;
  color: #fb2243;
  transition: all 0.3s ease;
  @media (max-width: ${BP.mobile}px) {
    display: none;
  }
`;

const Spacer = styled.div``;

const Selection = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
  align-items: center;
`;

const HeaderNavLink = styled(Link)`
  color: #000;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.7rem 1rem;
  border-radius: 24px;
  border: 1px solid transparent;
  display: inline-block;
  text-decoration: none;
  transition: background 0.2s ease;
  &:hover {
    color: #000;
    background-color: rgba(0, 0, 0, 0.06);
  }
  @media (max-width: ${BP.mobile}px) {
    display: none;
  }
`;

const AuthContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const RoundedButton = styled(motion.button)`
  height: 48px;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px 4px 14px;
  border-radius: 28px;
  background-color: transparent;
  cursor: pointer;
  color: #000;
  gap: 5px;
  margin-left: 0.5rem;
  transition: box-shadow 0.2s ease;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  @media (max-width: ${BP.mobile}px) {
    height: 40px;
    padding: 4px 6px 4px 10px;
    margin-left: 0.25rem;
  }
`;

const GuestMenuDropdown = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  width: 240px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  padding: 0.5rem 0;
  z-index: 1000;
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
  text-align: left;

  @media (max-width: ${BP.mobile}px) {
    display: none;
  }
`;

const GuestMenuItem = styled.button`
  width: 100%;
  background: none;
  border: 0;
  padding: 0.8rem 1.2rem;
  font-size: 0.95rem;
  color: #000;
  font-weight: ${(p) => (p.$bold ? "600" : "400")};
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  &:hover {
    background-color: #f7f7f7;
  }
`;

const GuestMenuLink = styled(Link)`
  display: block;
  padding: 0.8rem 1.2rem;
  font-size: 0.95rem;
  color: #000;
  font-weight: 400;
  text-decoration: none;
  &:hover {
    background-color: #f7f7f7;
  }
`;

const MobileBackdrop = styled(motion.div)`
  display: none;

  @media (max-width: ${BP.mobile}px) {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 998;
    background: rgba(15, 18, 30, 0.28);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
`;

const MobilePanel = styled(motion.div)`
  display: none;

  @media (max-width: ${BP.mobile}px) {
    display: block;
    grid-column: 1 / -1;
    overflow: hidden;
    text-align: left;
  }
`;

const MobilePanelInner = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 4px 14px;
`;

const MobileNavLink = styled(motion(Link))`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px;
  border-radius: 16px;
  color: #111;
  font-weight: 600;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
  text-decoration: none;
  background: transparent;
  transition: background 0.2s ease;

  &:hover,
  &:focus-visible {
    background: rgba(0, 0, 0, 0.045);
    color: #111;
  }
`;

const MobileNavMeta = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.04);
  color: #111;
`;

const MobileRule = styled(motion.div)`
  height: 1px;
  margin: 10px 8px 12px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 0, 0, 0.08) 12%,
    rgba(0, 0, 0, 0.08) 88%,
    transparent
  );
`;

const MobilePrimary = styled(motion(Link))`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 48px;
  padding: 12px 16px;
  border-radius: 16px;
  background: ${t.colors.primary};
  color: #fff;
  font-weight: 700;
  font-size: 0.98rem;
  text-decoration: none;
  box-shadow: 0 8px 20px rgba(252, 64, 86, 0.22);

  &:hover,
  &:focus-visible {
    color: #fff;
    background: ${t.colors.primaryHover};
  }
`;

const MobileSecondary = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 46px;
  padding: 12px 16px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.55);
  color: #111;
  font-weight: 650;
  font-size: 0.95rem;
  font-family: inherit;
  cursor: pointer;
`;

const MenuIconSlot = styled.span`
  position: relative;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const MenuIconLayer = styled(motion.span)`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const panelEase = [0.22, 1, 0.36, 1];

const mobilePanelVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.46, ease: panelEase },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] },
  },
};

const mobileListVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.055, delayChildren: 0.08 },
  },
};

const mobileItemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: panelEase },
  },
};

export default function MarketingHeader({ contained = true }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthUser();
  const { openLoginModal } = useAuthModal();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuTriggerRef = useRef(null);
  const headerRef = useRef(null);
  const didMountRef = useRef(false);
  const bannerOffset = isMobile ? BANNER_OFFSET_MOBILE : BANNER_OFFSET;
  const dockTop = isMobile ? DOCK_TOP_MOBILE : DOCK_TOP_DESKTOP;

  const hasBusiness = Boolean(user?.has_business);
  const primaryHref = hasBusiness ? "/business/dashboard" : REGISTER_HREF;
  const primaryLabel = hasBusiness ? "Dashboard" : "Get started";

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const y = window.scrollY || window.pageYOffset;
      setIsScrolled(y >= bannerOffset - dockTop);
    };
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [dockTop, bannerOffset]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setIsMenuOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (isAuthenticated && !isMobile) return;
    const handleClickOutside = (event) => {
      const root = isMobile ? headerRef.current : menuTriggerRef.current;
      if (root && !root.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen, isAuthenticated, isMobile]);

  useEffect(() => {
    const open = isMenuOpen && isMobile;
    document.documentElement.dataset.marketingMenu = open ? "open" : "";
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.dataset.marketingMenu = "";
    };
  }, [isMenuOpen, isMobile]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <HeaderCluster>
      <PromoBanner role="note" aria-label="First three months: no fee per booking, just a flat monthly plan">
        <PromoInner>
          <PromoCopy>
            First 3 months:{" "}
            <PromoUnderline>no fee per booking</PromoUnderline>
            <PromoRest> — just a flat monthly plan.</PromoRest>
          </PromoCopy>
        </PromoInner>
      </PromoBanner>
      <AnimatePresence>
        {isMenuOpen && isMobile && (
          <MobileBackdrop
            key="header-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>
      <HeaderBar
        ref={headerRef}
        $isScrolled={isScrolled}
        $contained={contained}
        $menuOpen={isMenuOpen && isMobile}
      >
          <LogoLink href="/" aria-label="ClassEasily home">
            <LogoContainer $isScrolled={isScrolled}>
              <LogoIcon
                isScrolled={isScrolled}
                activeColor="#fb2243"
                restingColor="#fb2243"
              />
              <Title $isScrolled={isScrolled}>ClassEasily</Title>
            </LogoContainer>
          </LogoLink>
          <Spacer />
          <Selection>
            <HeaderNavLink href="/#features">Product</HeaderNavLink>
            <HeaderNavLink
              href={PRICING_HREF}
              aria-current={pathname === PRICING_HREF ? "page" : undefined}
            >
              Pricing
            </HeaderNavLink>
            <HeaderNavLink href={primaryHref}>{primaryLabel}</HeaderNavLink>
            <AuthContainer>
              <RoundedButton
                type="button"
                ref={menuTriggerRef}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((v) => !v)}
                whileTap={{ scale: 0.96 }}
              >
                <MenuIconSlot>
                  <AnimatePresence mode="wait" initial={false}>
                    {isMenuOpen && isMobile ? (
                      <MenuIconLayer
                        key="close"
                        initial={{ opacity: 0, rotate: -80, scale: 0.6 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 80, scale: 0.6 }}
                        transition={{ duration: 0.22, ease: panelEase }}
                      >
                        <X size={18} strokeWidth={2.5} color="#000" />
                      </MenuIconLayer>
                    ) : (
                      <MenuIconLayer
                        key="menu"
                        initial={{ opacity: 0, rotate: 80, scale: 0.6 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: -80, scale: 0.6 }}
                        transition={{ duration: 0.22, ease: panelEase }}
                      >
                        <Menu size={18} strokeWidth={2.5} color="#000" />
                      </MenuIconLayer>
                    )}
                  </AnimatePresence>
                </MenuIconSlot>
                <GuestUserIcon color="#000" size={28} />
              </RoundedButton>
              {isAuthenticated && !isMobile && (
                <CustomUserMenu
                  isOpen={isMenuOpen}
                  onClose={closeMenu}
                  onNavigate={(p) => router.push(p)}
                  onShowSettings={() => {
                    closeMenu();
                    setIsSettingsOpen(true);
                  }}
                  triggerRef={menuTriggerRef}
                />
              )}
              {!isAuthenticated && !isMobile && (
                <AnimatePresence>
                  {isMenuOpen && (
                    <GuestMenuDropdown
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <GuestMenuItem
                        $bold
                        type="button"
                        onClick={() => {
                          closeMenu();
                          openLoginModal();
                        }}
                      >
                        Log in
                      </GuestMenuItem>
                      <GuestMenuLink
                        href={REGISTER_HREF}
                        onClick={closeMenu}
                      >
                        Get started
                      </GuestMenuLink>
                    </GuestMenuDropdown>
                  )}
                </AnimatePresence>
              )}
            </AuthContainer>
          </Selection>
          <AnimatePresence initial={false}>
            {isMenuOpen && isMobile && (
              <MobilePanel
                key="mobile-panel"
                variants={mobilePanelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <MobilePanelInner
                  variants={mobileListVariants}
                  initial="hidden"
                  animate="visible"
                  aria-label="Site"
                >
                  <MobileNavLink
                    href="/#features"
                    variants={mobileItemVariants}
                    onClick={closeMenu}
                  >
                    Product
                    <MobileNavMeta>
                      <ArrowRight size={14} />
                    </MobileNavMeta>
                  </MobileNavLink>
                  <MobileNavLink
                    href={PRICING_HREF}
                    variants={mobileItemVariants}
                    aria-current={pathname === PRICING_HREF ? "page" : undefined}
                    onClick={closeMenu}
                  >
                    Pricing
                    <MobileNavMeta>
                      <ArrowRight size={14} />
                    </MobileNavMeta>
                  </MobileNavLink>
                  <MobileRule variants={mobileItemVariants} />
                  <MobilePrimary
                    href={primaryHref}
                    variants={mobileItemVariants}
                    onClick={closeMenu}
                  >
                    {primaryLabel}
                    <ArrowRight size={16} />
                  </MobilePrimary>
                  {!isAuthenticated && (
                    <MobileSecondary
                      type="button"
                      variants={mobileItemVariants}
                      onClick={() => {
                        closeMenu();
                        openLoginModal();
                      }}
                    >
                      <LogIn size={16} />
                      Log in
                    </MobileSecondary>
                  )}
                  {isAuthenticated && (
                    <MobileSecondary
                      type="button"
                      variants={mobileItemVariants}
                      onClick={() => {
                        closeMenu();
                        setIsSettingsOpen(true);
                      }}
                    >
                      Account settings
                    </MobileSecondary>
                  )}
                </MobilePanelInner>
              </MobilePanel>
            )}
          </AnimatePresence>
      </HeaderBar>
      </HeaderCluster>
      <SettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}

export const MarketingHeaderSpacer = styled.div`
  display: none;
`;
