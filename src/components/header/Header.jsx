"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styled, { createGlobalStyle } from "styled-components";
import { useAuthUser } from "@/hooks/useAuthUser";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";
import { useAuthModal } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Menu, Search } from "lucide-react";
import dayjs from "dayjs";
import { useSearch } from "@/context/SearchContext";
import SearchDrawer from "@/components/common/SearchDrawer";

// --- DYNAMIC IMPORTS ---
const CustomUserMenu = dynamic(() => import("./CustomUserMenu"), { ssr: false });
const SettingsModal = dynamic(() => import("./SettingsDrawer"), { ssr: false });
const LogoIcon = dynamic(() => import("@/components/common/logoIcon"));

// --- STYLED COMPONENTS ---

const scrolledStyling = {
  logoColor: "#fb2243",
  outlineAndIconColor: "#353535",
  backgroundColor: "rgba(255, 255, 255, 0.22)",
  textColor: "#000000ff",
};

const HeaderWrapper = styled.header`
  background-color: ${(props) =>
    props.$isScrolled ? scrolledStyling.backgroundColor : "transparent"};
  box-shadow: ${(props) =>
    props.$isScrolled ? "0 2px 10px rgba(0, 0, 0, 0.1)" : "none"};
  backdrop-filter: ${(props) => (props.$isScrolled ? "blur(8px)" : "none")};
  padding: ${(props) => (props.$isScrolled ? "0.3rem 2rem" : "0.5rem 3rem")};
  color: ${(props) =>
    props.$isScrolled ? scrolledStyling.textColor : props.$initialColor};
  text-align: center;
  display: grid;
  grid-template-columns: auto 1fr auto;
  position: fixed;
  width: 100%;
  font-weight: bold;
  top: ${(props) => (props.$isImpersonating ? "40px" : "0")};
  left: 0;
  right: 0;
  align-items: center;
  transition: all 0.3s ease-in-out;
  z-index: 999;

  @media (min-width: 757px) {
    ${(props) =>
      props.$isScrolled &&
      `
      background-color: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px) saturate(180%);
      -webkit-backdrop-filter: blur(12px) saturate(180%);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06), 
                  inset 0 1px 0 rgba(255, 255, 255, 0.4);
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    `}
  }

  @media (max-width: 756px) {
    width: calc(100% - 2rem);
    left: 1rem;
    right: 1rem;
    top: ${(props) => (props.$isImpersonating ? "48px" : "0.5rem")};
    border-radius: 9999px;
    padding: 0.5rem 1rem;
    background-color: ${(props) =>
      props.$isScrolled
        ? "rgba(255, 255, 255, 0.4)"
        : "rgba(255, 255, 255, 0.15)"};
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.25);
  }
`;

/* --- NOTCH SEARCH STYLES --- */
const NotchContainer = styled(motion.div)`
  position: fixed;
  left: 50%;
  transform: translateX(-50%); 
  top: 75px; 
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: rgba(255, 255, 255, 0.6); 
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 8px 8px 8px 20px;
  border-radius: 100px;
  cursor: pointer;
  z-index: 990;
  width: max-content;
  max-width: 85vw;
  padding-right: 8px; /* Ensure icon has space */

  @media (min-width: 1089px) {
    display: none; /* Only show on mobile/tablet */
  }
`;

const NotchText = styled.div`
  display: flex;
  flex-direction: column;
  text-align: left;
  line-height: 1.2;
  flex: 1;
  min-width: 0; /* Allows children to truncate correctly within flex container */
`;

const NotchTitle = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
  font-family: "Proxima Soft", sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block; /* Required for ellipsis */
`;

const NotchSubtitle = styled.span`
  font-size: 12px;
  color: #666;
  font-weight: 600;
  font-family: "Proxima Soft", sans-serif;
`;

const NotchIcon = styled.div`
  width: 36px;
  height: 36px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  color: #222;
  flex-shrink: 0; /* Prevent icon from squishing */
`;

const LogoLink = styled(Link)`
  grid-column: 1 / 2;
  text-decoration: none;
  color: inherit;
`;
const Spacer = styled.div` grid-column: 2 / 3; `;
const Selection = styled.div`
  grid-column: 3 / 4;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  align-items: center;
  @media (max-width: 756px) { gap: 0.5rem; }
`;
const RoundedButton = styled(motion.button)`
  border: 1px solid ${(props) => props.$borderColor || "#ddd"};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${(props) => (props.$isScrolled ? "0.5rem 0.7rem" : "0.8rem")};
  border-radius: 30px;
  background-color: transparent;
  cursor: pointer;
  overflow: hidden;
  color: ${(props) => props.color};
  gap: 0.5rem;
  margin-left: 1rem;
  padding-left: ${(props) => (props.$isScrolled ? "0.7rem" : "1rem")};
  transition: all 0.2s ease;
  @media (max-width: 756px) { padding: 0.4rem 0.5rem; margin-left: 0.5rem; padding-left: 0.5rem; gap: 0.35rem; }
`;
const MenuIconStyled = styled(Menu)`
  width: 24px; height: 24px; flex-shrink: 0; color: ${(props) => props.$iconColor};
`;
const Title = styled.p`
  font-family: "ProximaSoft"; font-weight: 600;
  font-size: ${(props) => (props.$isScrolled ? "2rem" : "2.5rem")};
  margin: ${(props) => (props.$isScrolled ? "0.2rem" : "0.4rem")};
  color: ${(props) => props.color};
  transition: all 0.3s ease;
  @media (max-width: 756px) { display: none; }
`;
const LogoContainer = styled.div`
  display: flex; align-items: center;
  & > svg {
    width: ${(props) => (props.$isScrolled ? "2.5rem" : "3rem")};
    height: ${(props) => (props.$isScrolled ? "2.5rem" : "3rem")};
    transition: all 0.3s ease;
  }
  @media (max-width: 756px) { & > svg { width: 2.25rem; height: 2.25rem; } }
`;
const AuthLink = styled.span`
  color: ${(props) => props.color};
  font-weight: 600;
  font-size: ${(props) => (props.$isScrolled ? "0.85rem" : "0.95rem")};
  cursor: pointer;
  padding: ${(props) => (props.$isScrolled ? "0.7rem 1rem" : "1.1rem 1.4rem")};
  border-radius: 24px;
  border: 1px solid ${(props) => props.$borderColor};
  display: inline-block;
  transition: all 0.3s ease;
  &:hover { background-color: ${(props) => props.$hoverColor}; color: #fff; border-color: ${(props) => props.$hoverColor}; }
  @media (max-width: 756px) { font-size: 0.8rem; padding: 0.55rem 0.9rem; }
`;
const AuthContainer = styled(motion.div)` display: flex; align-items: center; gap: 1rem; @media (max-width: 756px) { gap: 0.25rem; } `;
const AvatarWrapper = styled.div` display: flex; align-items: center; justify-content: center; @media (max-width: 756px) { transform: scale(0.8); } `;

// --- HELPER COMPONENTS ---
const UserAvatar = ({ size = 28 }) => {
  const { user: currentUser } = useAuthUser();
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [currentUser?.avatar_thumb_url]);
  const initials = currentUser?.first_name?.[0] || "U";

  if (!currentUser?.avatar_thumb_url || imageFailed) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#ff385c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: size/2.5 }}>
        {initials}
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: '1px solid #e0e0e0' }}>
      <img src={currentUser.avatar_thumb_url} alt="User" onError={() => setImageFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
};

const Header = ({
  logoTitleColor = "#fff",
  dropdownButtonColor = "#fff",
  dropdownButtonHoverColor = "#d3000e",
  dropdownButtonOutlineColor = "#fff",
}) => {
  const router = useRouter();
  const { user: currentUser } = useAuthUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const menuTriggerRef = useRef(null);
  const { openLoginModal, openRegisterModal } = useAuthModal();
  const isImpersonating = currentUser?.is_impersonating || false;

  // --- SHARED SEARCH STATE ---
  const { 
    searchTerm, 
    datePickerValue, 
    participantCount,
    setIsDrawerOpen 
  } = useSearch();

  // Scroll Listener
  useEffect(() => {
    const checkScrollPosition = () => {
        setIsScrolled(window.pageYOffset > 100);
    };
    checkScrollPosition();
    const handleScroll = debounce(checkScrollPosition, 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Computed Colors
  const currentIconColor = isScrolled ? scrolledStyling.outlineAndIconColor : dropdownButtonColor;
  const currentBorderColor = isScrolled ? scrolledStyling.outlineAndIconColor : dropdownButtonOutlineColor;
  const currentTextColor = isScrolled ? scrolledStyling.textColor : dropdownButtonColor;

  return (
    <>
      <HeaderWrapper $isScrolled={isScrolled} $initialColor={logoTitleColor} $isImpersonating={isImpersonating}>
        {/* LOGO */}
        <LogoLink href="/">
          <LogoContainer $isScrolled={isScrolled}>
            <LogoIcon isScrolled={isScrolled} activeColor={scrolledStyling.logoColor} restingColor={logoTitleColor} />
            <Title $isScrolled={isScrolled} color={isScrolled ? scrolledStyling.logoColor : logoTitleColor}>
              classeasily
            </Title>
          </LogoContainer>
        </LogoLink>

        <Spacer />

        {/* AUTH / MENU */}
        <Selection>
            <AnimatePresence mode="wait">
                {currentUser ? (
                  <AuthContainer key="auth">
                    <RoundedButton 
                        onClick={() => setIsMenuOpen(!isMenuOpen)} 
                        ref={menuTriggerRef}
                        color={currentTextColor} 
                        $borderColor={currentBorderColor} 
                        $isScrolled={isScrolled}
                    >
                      <MenuIconStyled $iconColor={currentIconColor} />
                      <AvatarWrapper><UserAvatar size={32} /></AvatarWrapper>
                    </RoundedButton>
                    <CustomUserMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onNavigate={(p) => { setIsMenuOpen(false); router.push(p); }} onShowSettings={() => { setIsMenuOpen(false); setIsSettingsModalOpen(true); }} triggerRef={menuTriggerRef} />
                  </AuthContainer>
                ) : (
                  <AuthContainer key="guest">
                    <AuthLink onClick={openLoginModal} color={currentTextColor} $borderColor={currentBorderColor} $hoverColor={dropdownButtonHoverColor} $isScrolled={isScrolled}>Log In</AuthLink>
                    <AuthLink onClick={openRegisterModal} color={currentTextColor} $borderColor={currentBorderColor} $hoverColor={dropdownButtonHoverColor} $isScrolled={isScrolled}>Sign Up</AuthLink>
                  </AuthContainer>
                )}
            </AnimatePresence>
        </Selection>
      </HeaderWrapper>

      {/* NOTCH SEARCH PILL */}
      <AnimatePresence>
          {isScrolled && (
              <NotchContainer
                  initial={{ y: -40, scale: 0.85, opacity: 0, x: "-50%" }}
                  animate={{ y: 0, scale: 1, opacity: 1, x: "-50%" }}
                  exit={{ y: -20, scale: 0.9, opacity: 0, x: "-50%" }}
                  transition={{ type: "spring", stiffness: 400, damping: 18, mass: 0.8 }}
                  onClick={() => setIsDrawerOpen(true)}
                  whileTap={{ scale: 0.98 }}
              >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      <NotchText>
                          <NotchTitle>{searchTerm || "Find a class?"}</NotchTitle>
                          <NotchSubtitle>
                              {datePickerValue ? dayjs(datePickerValue).format("MMM D") : "Any week"} • {participantCount} guests
                          </NotchSubtitle>
                      </NotchText>
                      <NotchIcon>
                          <Search size={18} strokeWidth={2.5} />
                      </NotchIcon>
                  </div>
              </NotchContainer>
          )}
      </AnimatePresence>

      <SettingsModal open={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </>
  );
};

export default Header;