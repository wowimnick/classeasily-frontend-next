"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { Menu, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useAuthModal } from "@/context/AuthContext";
import { marketingTheme as t, REGISTER_HREF, PRICING_HREF } from "./tokens";
import { Button, ButtonLink } from "./primitives";

const LogoIcon = dynamic(() => import("@/components/common/logoIcon"), {
  ssr: false,
});

const Bar = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: ${t.headerHeight}px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid ${t.colors.border};
`;

const Inner = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 24px;
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: ${t.colors.dark};
  font-weight: 800;
  font-size: 18px;
  letter-spacing: -0.02em;
  flex-shrink: 0;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavA = styled(Link)`
  font-size: 15px;
  font-weight: 600;
  color: ${(p) => (p.$active ? t.colors.dark : t.colors.text)};
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;

  &:hover {
    color: ${t.colors.dark};
    background: ${t.colors.bgLight};
  }
`;

const Spacer = styled.div`
  flex: 1;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const Burger = styled.button`
  display: none;
  margin-left: auto;
  background: none;
  border: 0;
  color: ${t.colors.dark};
  cursor: pointer;
  padding: 8px;

  @media (max-width: 768px) {
    display: inline-flex;
  }
`;

const Drawer = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: ${(p) => (p.$open ? "flex" : "none")};
    position: fixed;
    inset: ${t.headerHeight}px 0 0 0;
    background: #fff;
    flex-direction: column;
    padding: 24px;
    gap: 8px;
    z-index: 99;
  }
`;

const DrawerLink = styled(Link)`
  font-size: 18px;
  font-weight: 700;
  color: ${t.colors.dark};
  text-decoration: none;
  padding: 12px 0;
`;

export default function MarketingHeader() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthUser();
  const { openLoginModal } = useAuthModal();
  const [open, setOpen] = useState(false);

  const hasBusiness = Boolean(user?.has_business);
  const primaryHref = hasBusiness ? "/business/dashboard" : REGISTER_HREF;
  const primaryLabel = hasBusiness ? "Dashboard" : "Get started";

  return (
    <>
      <Bar>
        <Inner>
          <Brand href="/" aria-label="ClassEasily home">
            <LogoIcon
              size={28}
              isScrolled
              restingColor={t.colors.accent}
              activeColor={t.colors.accent}
            />
            ClassEasily
          </Brand>
          <Nav>
            <NavA href="/#features" $active={false}>
              Product
            </NavA>
            <NavA href={PRICING_HREF} $active={pathname === PRICING_HREF}>
              Pricing
            </NavA>
          </Nav>
          <Spacer />
          <Actions>
            {!isAuthenticated && (
              <Button type="button" $variant="ghost" onClick={() => openLoginModal()}>
                Log in
              </Button>
            )}
            <ButtonLink href={primaryHref} $variant="primary">
              {primaryLabel}
            </ButtonLink>
          </Actions>
          <Burger
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </Burger>
        </Inner>
      </Bar>
      <Drawer $open={open}>
        <DrawerLink href="/#features" onClick={() => setOpen(false)}>
          Product
        </DrawerLink>
        <DrawerLink href={PRICING_HREF} onClick={() => setOpen(false)}>
          Pricing
        </DrawerLink>
        {!isAuthenticated && (
          <Button
            type="button"
            $variant="secondary"
            onClick={() => {
              setOpen(false);
              openLoginModal();
            }}
          >
            Log in
          </Button>
        )}
        <ButtonLink href={primaryHref} $variant="primary" onClick={() => setOpen(false)}>
          {primaryLabel}
        </ButtonLink>
      </Drawer>
    </>
  );
}

export const MarketingHeaderSpacer = styled.div`
  height: ${t.headerHeight}px;
`;
