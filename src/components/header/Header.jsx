"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styled from "styled-components";
import { useAuthUser } from "@/hooks/useAuthUser";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";
import { useAuthModal } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";

// --- DYNAMIC IMPORTS ---
const CustomUserMenu = dynamic(() => import("./CustomUserMenu"), {
  ssr: false,
});
const SettingsModal = dynamic(() => import("./SettingsDrawer"), {
  ssr: false,
});
const LogoIcon = dynamic(() => import("@/components/common/logoIcon"));

// --- STYLED COMPONENTS ---
const scrolledStyling = {
  logoColor: "#fb2243",
  outlineAndIconColor: "#353535",
  backgroundColor: "rgba(255, 255, 255, 0.22)",
  textColor: "#000000ff",
};

const UserAvatar = ({ size = 28 }) => {
  const { user: currentUser } = useAuthUser();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [currentUser?.avatar_thumb_url]);

  const getUserInitials = (user) => {
    if (!user) return "";
    const f = user.first_name?.[0] || "";
    const l = user.last_name?.[0] || "";
    return `${f}${l}`.toUpperCase() || "U";
  };

  const handleError = () => setImageFailed(true);

  const showFallback = !currentUser?.avatar_thumb_url || imageFailed;

  const wrapperStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #e0e0e0",
  };
  const imageStyle = { width: "100%", height: "100%", objectFit: "cover" };
  const fallbackStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: `${size / 2.5}px`,
    fontWeight: "600",
    color: "#ffffff",
    backgroundColor: "#ff385c",
  };

  return (
    <div style={wrapperStyle}>
      {showFallback ? (
        <div style={fallbackStyle}>{getUserInitials(currentUser)}</div>
      ) : (
        <img
          src={currentUser.avatar_thumb_url}
          alt="User Avatar"
          onError={handleError}
          style={imageStyle}
        />
      )}
    </div>
  );
};

const UserCircleIcon = ({ size = "36px", color = "#ffffff", style }) => {
  const iconRef = useRef(null);
  useEffect(() => {
    if (iconRef.current) {
      setTimeout(() => iconRef.current?.playerInstance?.play(), 50);
    }
  }, [color]);
  return (
    <lord-icon
      ref={iconRef}
      src="https://cdn.lordicon.com/cniwvohj.json"
      trigger="in"
      state="in-account"
      colors={`primary:${color},secondary:${color}`}
      style={{
        width: size,
        height: size,
        transition: "all 0.1s ease",
        ...style,
      }}
    />
  );
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
    /* Desktop: Subtle glass effect when scrolled */
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
    /* iOS 26 Liquid Glass styling - detached, rounded, glassmorphic */
    width: calc(100% - 2rem);
    left: 1rem;
    right: 1rem;
    top: ${(props) => (props.$isImpersonating ? "48px" : "0.5rem")};
    border-radius: 9999px;
    padding: 0.5rem 1rem;
    background-color: ${(props) =>
      props.$isScrolled
        ? "rgba(255, 255, 255, 0.25)"
        : "rgba(255, 255, 255, 0.15)"};
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.25);
  }
`;

const LogoLink = styled(Link)`
  grid-column: 1 / 2;
  text-decoration: none;
  color: inherit;
`;

const Spacer = styled.div`
  grid-column: 2 / 3;
`;

const Selection = styled.div`
  grid-column: 3 / 4;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  align-items: center;
  @media (max-width: 756px) {
    gap: 0.5rem;
  }
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
  transition: box-shadow 0.2s ease-in-out, background-color 0.2s ease,
    color 0.2s ease, border-color 0.3s ease, padding 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 756px) {
    padding: 0.4rem 0.5rem;
    margin-left: 0.5rem;
    padding-left: 0.5rem;
    gap: 0.35rem;
  }
`;

const MenuIconStyled = styled(Menu)`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  color: ${(props) => props.$iconColor};
  transition: color 0.3s ease;
`;

const Title = styled.p`
  font-family: "ProximaSoft";
  font-weight: 600;
  font-size: ${(props) => (props.$isScrolled ? "2rem" : "2.5rem")};
  padding: 0;
  margin: ${(props) => (props.$isScrolled ? "0.2rem" : "0.4rem")};
  color: ${(props) => props.color};
  transition: font-size 0.3s ease, margin 0.3s ease, color 0.3s ease;
  @media (max-width: 756px) {
    display: none;
  }
  @media (max-width: 575px) {
    display: none;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  & > svg {
    width: ${(props) => (props.$isScrolled ? "2.5rem" : "3rem")};
    height: ${(props) => (props.$isScrolled ? "2.5rem" : "3rem")};
    transition: width 0.3s ease, height 0.3s ease;
  }
  @media (max-width: 756px) {
    & > svg {
      width: 2.25rem;
      height: 2.25rem;
    }
  }
`;

const AuthLink = styled.span`
  color: ${(props) => props.color};
  font-weight: 600;
  font-size: ${(props) => (props.$isScrolled ? "0.85rem" : "0.95rem")};
  cursor: pointer;
  padding: ${(props) => (props.$isScrolled ? "0.7rem 1rem" : "1.1rem 1.4rem")};
  border-radius: 24px;
  white-space: nowrap;
  border: 1px solid ${(props) => props.$borderColor};
  display: inline-block;
  transition: background-color 0.2s ease, color 0.2s ease,
    border-color 0.3s ease, font-size 0.3s ease, padding 0.3s ease;
  &:hover {
    background-color: ${(props) => props.$hoverColor};
    color: #fff;
    border-color: ${(props) => props.$hoverColor};
  }
  @media (max-width: 756px) {
    font-size: 0.8rem;
    padding: 0.55rem 0.9rem;
  }
`;

const AuthContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1rem;
  @media (max-width: 756px) {
    gap: 0.25rem;
  }
`;

const AvatarWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  @media (max-width: 756px) {
    transform: scale(0.8);
  }
`;

const Header = ({
  logoTitleColor = "#fff",
  dropdownButtonColor = "#fff",
  dropdownButtonHoverColor = "#d3000e",
  dropdownButtonOutlineColor = "#fff",
}) => {
  const router = useRouter();
  const { user: currentUser, isVerified } = useAuthUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const menuTriggerRef = useRef(null);
  const { openLoginModal, openRegisterModal } = useAuthModal();
  const isImpersonating = currentUser?.is_impersonating || false;

  useEffect(() => {
    const checkScrollPosition = () => {
      setIsScrolled(window.pageYOffset > 10);
    };

    checkScrollPosition();
    const handleScroll = debounce(checkScrollPosition, 10);
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu when component unmounts (route change)
  useEffect(() => {
    return () => {
      setIsMenuOpen(false);
      setIsSettingsModalOpen(false);
    };
  }, []);

  const handleNavigate = (path) => {
    // Close menu BEFORE navigation to prevent invisible overlay
    setIsMenuOpen(false);
    setIsSettingsModalOpen(false);
    // Small delay to ensure menu closes before navigation
    setTimeout(() => {
      router.push(path);
    }, 100);
  };

  const handleShowSettings = () => {
    setIsMenuOpen(false);
    setIsSettingsModalOpen(true);
  };

  const closeSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  const currentIconColor = isScrolled
    ? scrolledStyling.outlineAndIconColor
    : dropdownButtonColor;
  const currentBorderColor = isScrolled
    ? scrolledStyling.outlineAndIconColor
    : dropdownButtonOutlineColor;
  const currentTextColor = isScrolled
    ? scrolledStyling.textColor
    : dropdownButtonColor;

  const renderAuthSection = () => {
    const animationProps = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.3 },
    };

    return (
      <AnimatePresence mode="wait">
        {currentUser ? (
          <AuthContainer key="user-authenticated" {...animationProps}>
            <RoundedButton
              ref={menuTriggerRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              aria-label="User menu"
              color={currentTextColor}
              $borderColor={currentBorderColor}
              $isScrolled={isScrolled}
            >
              <MenuIconStyled
                aria-hidden="true"
                $iconColor={currentIconColor}
              />
              <AvatarWrapper>
                {currentUser?.avatar_thumb_url ? (
                  <UserAvatar size={32} />
                ) : (
                  <UserCircleIcon
                    size="32px"
                    color={currentIconColor}
                    style={{ flexShrink: 0 }}
                  />
                )}
              </AvatarWrapper>
            </RoundedButton>
            <CustomUserMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              onNavigate={handleNavigate}
              onShowSettings={handleShowSettings}
              triggerRef={menuTriggerRef}
            />
          </AuthContainer>
        ) : (
          <AuthContainer key="user-guest" {...animationProps}>
            <AuthLink
              onClick={openLoginModal}
              color={currentTextColor}
              $borderColor={currentBorderColor}
              $hoverColor={dropdownButtonHoverColor}
              $isScrolled={isScrolled}
            >
              Log In
            </AuthLink>
            <AuthLink
              onClick={openRegisterModal}
              color={currentTextColor}
              $borderColor={currentBorderColor}
              $hoverColor={dropdownButtonHoverColor}
              $isScrolled={isScrolled}
            >
              Sign Up
            </AuthLink>
          </AuthContainer>
        )}
      </AnimatePresence>
    );
  };

  return (
    <>
      <HeaderWrapper
        $isScrolled={isScrolled}
        $initialColor={logoTitleColor}
        $isImpersonating={isImpersonating}
      >
        <LogoLink href="/">
          <LogoContainer $isScrolled={isScrolled}>
            <LogoIcon
              isScrolled={isScrolled}
              activeColor={scrolledStyling.logoColor}
              restingColor={logoTitleColor}
            />
            <Title
              $isScrolled={isScrolled}
              color={isScrolled ? scrolledStyling.logoColor : logoTitleColor}
            >
              classeasily
            </Title>
          </LogoContainer>
        </LogoLink>

        <Spacer />

        <Selection>{renderAuthSection()}</Selection>
      </HeaderWrapper>

      <SettingsModal open={isSettingsModalOpen} onClose={closeSettingsModal} />
    </>
  );
};

export default Header;
