"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styled from "styled-components";
import { AnimatePresence, motion } from "framer-motion";
import debounce from "lodash/debounce";
import { Menu } from "lucide-react";
import dynamic from "next/dynamic";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useAuthModal } from "@/context/AuthContext";
import { marketingTheme as t, REGISTER_HREF, PRICING_HREF } from "./tokens";

const BANNER_OFFSET = 58;

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
  padding: 18px 24px 14px;
  min-height: 76px;
  box-shadow:
    inset 0 -1px 0 0 rgba(255, 255, 255, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.12);

  @media (max-width: 768px) {
    padding: 14px 16px 12px;
    min-height: 64px;
  }
`;

const PromoInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 10px;
  width: 100%;
  max-width: 1200px;
  text-align: center;
  font-family: ${t.fonts.body};
  font-size: clamp(13px, 0.8vw + 11px, 15px);
  line-height: 1.35;
  transform: translate3d(0, -11px, 0);
`;

const PromoStrong = styled.strong`
  font-weight: 700;
  letter-spacing: -0.2px;
  color: #fff;
`;

const PromoSep = styled.span`
  opacity: 0.45;
  font-weight: 300;
  @media (max-width: 560px) {
    display: none;
  }
`;

const PromoDesc = styled.span`
  opacity: 0.95;
  font-weight: 400;
  color: #fff;
`;

const HeaderBar = styled.header`
  background-color: ${(p) =>
    p.$isScrolled ? "rgba(255, 255, 255, 0.95)" : "transparent"};
  box-shadow: ${(p) => (p.$isScrolled ? "0 2px 10px rgba(0, 0, 0, 0.1)" : "none")};
  backdrop-filter: ${(p) => (p.$isScrolled ? "blur(8px)" : "none")};
  -webkit-backdrop-filter: ${(p) => (p.$isScrolled ? "blur(8px)" : "none")};
  padding: ${(p) => (p.$isScrolled ? "0.3rem 2rem" : "0.5rem 3rem")};
  position: ${(p) => (p.$isScrolled ? "fixed" : "absolute")};
  top: ${(p) => (p.$isScrolled ? "0" : `${BANNER_OFFSET}px`)};
  left: 0;
  right: 0;
  z-index: 999;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  color: #000;
  text-align: center;
  border-radius: 0;
  transition:
    background-color 0.3s ease,
    padding 0.3s ease,
    box-shadow 0.3s ease;

  @media (min-width: 757px) {
    ${(p) =>
      p.$isScrolled &&
      `
      backdrop-filter: blur(12px) saturate(180%);
      -webkit-backdrop-filter: blur(12px) saturate(180%);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
    `}
  }

  @media (max-width: 756px) {
    padding: ${(p) =>
      p.$isScrolled
        ? "0.3rem 1rem"
        : "calc(10px + env(safe-area-inset-top, 0px)) 1rem 10px"};
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
  @media (max-width: 756px) {
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
  @media (max-width: 756px) {
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
  @media (max-width: 756px) {
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
  @media (max-width: 756px) {
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

export default function MarketingHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthUser();
  const { openLoginModal } = useAuthModal();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuTriggerRef = useRef(null);

  const hasBusiness = Boolean(user?.has_business);
  const primaryHref = hasBusiness ? "/business/dashboard" : REGISTER_HREF;
  const primaryLabel = hasBusiness ? "Dashboard" : "Get started";

  useEffect(() => {
    const check = () => setIsScrolled(window.pageYOffset >= BANNER_OFFSET);
    check();
    const handleScroll = debounce(check, 5);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isAuthenticated) return;
    const handleClickOutside = (event) => {
      if (
        menuTriggerRef.current &&
        !menuTriggerRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen, isAuthenticated]);

  return (
    <>
      <PromoBanner role="note" aria-label="First three months, no per-booking fee">
        <PromoInner>
          <PromoStrong>First 3 months: a flat monthly subscription.</PromoStrong>
          <PromoSep aria-hidden>|</PromoSep>
          <PromoDesc>No fee per booking.</PromoDesc>
        </PromoInner>
      </PromoBanner>
      <HeaderBar $isScrolled={isScrolled}>
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
                aria-label="Account menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((v) => !v)}
              >
                <Menu size={18} strokeWidth={2.5} color="#000" />
                <GuestUserIcon color="#000" size={28} />
              </RoundedButton>
              {isAuthenticated && (
                <CustomUserMenu
                  isOpen={isMenuOpen}
                  onClose={() => setIsMenuOpen(false)}
                  onNavigate={(p) => router.push(p)}
                  onShowSettings={() => {
                    setIsMenuOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  triggerRef={menuTriggerRef}
                />
              )}
              {!isAuthenticated && (
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
                          setIsMenuOpen(false);
                          openLoginModal();
                        }}
                      >
                        Log in
                      </GuestMenuItem>
                      <GuestMenuLink
                        href={REGISTER_HREF}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Get started
                      </GuestMenuLink>
                    </GuestMenuDropdown>
                  )}
                </AnimatePresence>
              )}
            </AuthContainer>
          </Selection>
      </HeaderBar>
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
