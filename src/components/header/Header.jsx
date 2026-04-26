"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useAuth, getOptimisticAuthState } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash/debounce";
import { useAuthModal } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Menu, Search } from "lucide-react";
import dayjs from "dayjs";
import { useSearch, formatCollectionDisplayName } from "@/context/SearchContext";

// --- DYNAMIC IMPORTS ---
const CustomUserMenu = dynamic(() => import("./CustomUserMenu"), {
  ssr: false,
});
const SettingsModal = dynamic(() => import("./SettingsDrawer"), { ssr: false });
const LogoIcon = dynamic(() => import("@/components/common/logoIcon"));

// --- ICONS ---

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

// --- STYLED COMPONENTS ---

const scrolledStyling = {
  logoColor: "#fb2243",
  color: "#000000", // STRICTLY BLACK
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  borderColor: "#e5e7eb", // Light grey border when scrolled for better aesthetic against white bg
};

const HeaderWrapper = styled.header`
  background-color: ${(props) =>
    props.$isScrolled ? scrolledStyling.backgroundColor : "transparent"};
  box-shadow: ${(props) =>
    props.$isScrolled ? "0 2px 10px rgba(0, 0, 0, 0.1)" : "none"};
  backdrop-filter: ${(props) => (props.$isScrolled ? "blur(8px)" : "none")};
  padding: ${(props) => (props.$isScrolled ? "0.3rem 2rem" : "0.5rem 3rem")};
  color: ${(props) =>
    props.$isScrolled ? scrolledStyling.color : props.$initialColor};
  text-align: center;
  display: grid;
  grid-template-columns: auto 1fr auto;

  position: ${(props) => (props.$isScrolled ? "fixed" : "absolute")};

  top: ${(props) => {
    const baseTop = props.$isImpersonating ? 48 : 0;
    const offset = props.$isScrolled ? 0 : props.$topOffset || 0;
    return `${baseTop + offset}px`;
  }};

  left: 0;
  right: 0;
  align-items: center;

  transition:
    background-color 0.3s ease,
    padding 0.3s ease,
    box-shadow 0.3s ease,
    color 0.3s ease;
  z-index: 999;

  @media (min-width: 757px) and (max-width: 768px) {
    top: ${(props) => (props.$isImpersonating ? "48px" : "0px")};
  }

  @media (min-width: 757px) {
    ${(props) =>
      props.$isScrolled &&
      `
      background-color: rgba(255, 255, 255, 0.95);
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

    top: ${(props) => {
      const baseTop = props.$isImpersonating ? 56 : 8;
      return `${baseTop}px`;
    }};

    border-radius: 9999px;
    padding: 0.5rem 1rem;
    background-color: ${(props) =>
      props.$isScrolled
        ? "rgba(255, 255, 255, 0.95)"
        : "rgba(255, 255, 255, 0.15)"};
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.08),
      0 2px 8px rgba(0, 0, 0, 0.04),
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
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 8px 8px 8px 20px;
  border-radius: 100px;
  cursor: pointer;
  z-index: 990;
  width: max-content;
  max-width: 85vw;
  padding-right: 8px;

  @media (min-width: 1089px) {
    display: none;
  }
`;

const NotchText = styled.div`
  display: flex;
  flex-direction: column;
  text-align: left;
  line-height: 1.2;
  flex: 1;
  min-width: 0;
`;

const NotchTitle = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
  font-family: "ProximaSoft", sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
`;

const NotchSubtitle = styled.span`
  font-size: 12px;
  color: #666;
  font-weight: 600;
  font-family: "ProximaSoft", sans-serif;
`;

const NotchIcon = styled.div`
  width: 36px;
  height: 36px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #222;
  flex-shrink: 0;
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
  gap: 0.4rem;
  align-items: center;
  @media (max-width: 756px) {
    gap: 0.5rem;
  }
`;

// --- BUTTON STYLE: FIXED TRANSPARENCY ---
const RoundedButton = styled(motion.button)`
  height: 48px;
  border: 1px solid ${(props) => props.$borderColor || "#e5e7eb"};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px 4px 14px;
  border-radius: 28px;
  background-color: transparent !important; /* FORCED TRANSPARENT */
  cursor: pointer;
  overflow: hidden;
  color: ${(props) => props.color};
  gap: 5px;
  margin-left: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 756px) {
    height: 40px;
    padding: 4px 6px 4px 10px;
    gap: 6px;
    margin-left: 0.5rem;
  }
`;

const MenuIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.$iconColor};
`;

const Title = styled.p`
  font-family: "ProximaSoft";
  font-weight: 600;
  font-size: ${(props) => (props.$isScrolled ? "2rem" : "2.5rem")};
  margin: ${(props) => (props.$isScrolled ? "0.2rem" : "0.4rem")};
  color: ${(props) => props.color};
  transition: all 0.3s ease;
  @media (max-width: 756px) {
    display: none;
  }
`;
const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  & > svg {
    width: ${(props) => (props.$isScrolled ? "2.5rem" : "3rem")};
    height: ${(props) => (props.$isScrolled ? "2.5rem" : "3rem")};
    transition: all 0.3s ease;
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
  padding: ${(props) => (props.$isScrolled ? "0.7rem 1rem" : "0.7rem")};
  border-radius: 24px;
  border: 1px solid transparent;
  display: inline-block;
  transition: all 0.3s ease;
  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }
  @media (max-width: 756px) {
    font-size: 0.8rem;
    padding: 0.55rem 0.9rem;
    display: none;
  }
`;
const AuthContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  @media (max-width: 756px) {
    gap: 0.25rem;
  }
`;
const AvatarWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

// --- GUEST MENU COMPONENTS ---
const GuestMenuDropdown = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  width: 240px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  padding: 0.5rem 0;
  z-index: 1000;
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
  text-align: left;
`;

const GuestMenuItem = styled.div`
  padding: 0.8rem 1.2rem;
  font-size: 0.95rem;
  color: #333;
  font-weight: ${(props) => (props.$bold ? "600" : "400")};
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background-color: #f7f7f7;
  }
  &:first-child {
    border-bottom: 1px solid #f0f0f0;
  }
`;

// --- HELPER COMPONENTS ---
const UserAvatar = ({ size = 28, color }) => {
  const { user: currentUser } = useAuthUser();
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [currentUser?.avatar_thumb_url]);
  const initials = currentUser?.first_name?.[0] || "U";

  // Case 1: Logged in, no image (or failed), show Initials
  if (currentUser && (!currentUser?.avatar_thumb_url || imageFailed)) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: "#ff385c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 600,
          fontSize: size / 2.5,
        }}
      >
        {initials}
      </div>
    );
  }

  // Case 2: Guest (Not logged in) -> Show the specific SVG Icon with Dynamic Color
  if (!currentUser) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <GuestUserIcon color={color} size={size + 8} />
      </div>
    );
  }

  // Case 3: Logged in with valid image
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        border: "1px solid #e0e0e0",
      }}
    >
      <img
        src={currentUser.avatar_thumb_url}
        alt="User"
        onError={() => setImageFailed(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
};

// --- MAIN HEADER CONTENT ---
const HeaderContent = ({
  logoTitleColor = "#fff",
  dropdownButtonColor = "#fff",
  dropdownButtonHoverColor = "#d3000e",
  dropdownButtonOutlineColor = "#fff",
  topOffset = 0,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser } = useAuthUser();
  const { isImpersonating: storeImpersonating } = useAuth();
  const [optimisticImpersonating, setOptimisticImpersonating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const menuTriggerRef = useRef(null);
  const { openLoginModal, openRegisterModal } = useAuthModal();
  useEffect(() => {
    setOptimisticImpersonating(getOptimisticAuthState().isImpersonating || false);
  }, []);
  const isImpersonating =
    storeImpersonating ||
    optimisticImpersonating ||
    currentUser?.is_impersonating ||
    false;

  const {
    searchTerm,
    datePickerValue,
    selectedCollection,
    setIsDrawerOpen,
  } = useSearch();

  useEffect(() => {
    const scrollThreshold = topOffset > 0 ? topOffset : 100;
    const checkScrollPosition = () => {
      setIsScrolled(window.pageYOffset >= scrollThreshold);
    };
    checkScrollPosition();
    const handleScroll = debounce(checkScrollPosition, 5);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [topOffset]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // FIX: This listener was closing the menu when clicking inside CustomUserMenu because
  // CustomUserMenu is a Portal (physically outside menuTriggerRef).
  useEffect(() => {
    // If logged in, CustomUserMenu handles "click outside" internally via triggerRef.
    // We should not interfere here.
    if (currentUser) return;

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen, currentUser]);

  const getNotchDateDisplay = () => {
    if (!datePickerValue) return "Any week";
    if (datePickerValue.start && datePickerValue.end) {
      const s = dayjs(datePickerValue.start);
      const e = dayjs(datePickerValue.end);
      if (s.month() === e.month()) {
        return `${s.format("MMM D")} - ${e.format("D")}`;
      }
      return `${s.format("MMM D")} - ${e.format("MMM D")}`;
    }
    return dayjs(datePickerValue).format("MMM D");
  };

  // --- DYNAMIC COLOR LOGIC ---
  const activeColor = isScrolled
    ? scrolledStyling.color // #000000
    : dropdownButtonColor; // usually #fff

  const activeBorderColor = isScrolled
    ? scrolledStyling.borderColor // #e5e7eb
    : dropdownButtonOutlineColor; // usually #fff

  return (
    <>
      <HeaderWrapper
        $isScrolled={isScrolled}
        $initialColor={logoTitleColor}
        $isImpersonating={isImpersonating}
        $topOffset={topOffset}
      >
        <LogoLink href="/" aria-label="ClassEasily home">
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
              ClassEasily
            </Title>
          </LogoContainer>
        </LogoLink>

        <Spacer />

        <Selection>
          <Link href="/corporate" legacyBehavior>
            <AuthLink
              color={activeColor}
              $borderColor="transparent"
              $hoverColor="rgba(255,255,255,0.2)"
              $isScrolled={isScrolled}
            >
              For teams
            </AuthLink>
          </Link>
          <Link href="/business" legacyBehavior>
            <AuthLink
              color={activeColor}
              $borderColor="transparent"
              $hoverColor="rgba(255,255,255,0.2)"
              $isScrolled={isScrolled}
            >
              Become a host
            </AuthLink>
          </Link>

          <AuthContainer key="auth">
            <RoundedButton
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              ref={menuTriggerRef}
              color={activeColor}
              $borderColor={activeBorderColor}
              $isScrolled={isScrolled}
            >
              <MenuIconWrapper $iconColor={activeColor}>
                <Menu size={18} strokeWidth={2.5} />
              </MenuIconWrapper>

              <AvatarWrapper>
                <UserAvatar size={28} color={activeColor} />
              </AvatarWrapper>
            </RoundedButton>

            {currentUser && (
              <CustomUserMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={(p) => router.push(p)}
                onShowSettings={() => {
                  setIsMenuOpen(false);
                  setIsSettingsModalOpen(true);
                }}
                triggerRef={menuTriggerRef}
              />
            )}

            {!currentUser && (
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
                      onClick={() => {
                        setIsMenuOpen(false);
                        openLoginModal();
                      }}
                    >
                      Log in
                    </GuestMenuItem>
                    <GuestMenuItem
                      onClick={() => {
                        setIsMenuOpen(false);
                        openRegisterModal();
                      }}
                    >
                      Sign up
                    </GuestMenuItem>
                  </GuestMenuDropdown>
                )}
              </AnimatePresence>
            )}
          </AuthContainer>
        </Selection>
      </HeaderWrapper>

      <AnimatePresence>
        {isScrolled && (
          <NotchContainer
            initial={{ y: -40, scale: 0.85, opacity: 0, x: "-50%" }}
            animate={{ y: 0, scale: 1, opacity: 1, x: "-50%" }}
            exit={{ y: -20, scale: 0.9, opacity: 0, x: "-50%" }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 18,
              mass: 0.8,
            }}
            onClick={() => setIsDrawerOpen(true)}
            whileTap={{ scale: 0.98 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flex: 1,
                minWidth: 0,
              }}
            >
              <NotchText>
                <NotchTitle>{searchTerm || "Find a class?"}</NotchTitle>
                <NotchSubtitle>
                  {getNotchDateDisplay()} •{" "}
                  {selectedCollection
                    ? formatCollectionDisplayName(
                        selectedCollection.name || selectedCollection.slug,
                      )
                    : "Any experience"}
                </NotchSubtitle>
              </NotchText>
              <NotchIcon>
                <Search size={18} strokeWidth={2.5} />
              </NotchIcon>
            </div>
          </NotchContainer>
        )}
      </AnimatePresence>

      <SettingsModal
        open={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
};

// --- FALLBACK LOGO (inline so it shows immediately on mobile without dynamic import) ---
// No width/height on SVG so LogoContainer & > svg controls size = same as real header (no layout shift).
const FallbackLogoIcon = ({ color = "#fff" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64.81 105.86"
    fill={color}
    role="img"
    aria-label="ClassEasily logo"
    style={{ flexShrink: 0 }}
  >
    <circle cx="64" cy="30" r="4" fill={color} />
    <circle cx="36" cy="30" r="4" fill={color} />
    <path
      d="M55,64c0-3.3,2.7-6,6-6v10c0,10.5,8.5,19,19,19V10c0,0-10-9-30.1-9C29.9,1,20,10,20,10v47c0,23.2,18.8,42,42,42h18v-6 c-13.8,0-25-11.2-25-25V64z M49.9,51C35.1,51,26,43,26,38V14c23,0,23,25,24,28c1-3,1-28,24-28v24C74,42.1,64.8,51,49.9,51z"
      fill={color}
    />
  </svg>
);

// Shimmer animation for skeleton (matches RoundedButton exact shape/size to avoid layout shift).
const headerShimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const FallbackMenuSkeleton = styled.div`
  height: 48px;
  padding: 4px 8px 4px 14px;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-left: 0.5rem;
  min-width: 73px;
  box-sizing: border-box;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.35) 50%,
    rgba(255, 255, 255, 0.2) 100%
  );
  background-size: 1000px 100%;
  animation: ${headerShimmer} 2s infinite linear;

  @media (max-width: 756px) {
    height: 40px;
    padding: 4px 6px 4px 10px;
    gap: 6px;
    margin-left: 0.5rem;
    min-width: 68px;
  }
`;

// --- FALLBACK COMPONENT ---
const HeaderFallback = ({ logoTitleColor = "#fff", topOffset = 0 }) => {
  return (
    <HeaderWrapper
      $isScrolled={false}
      $initialColor={logoTitleColor}
      $isImpersonating={false}
      $topOffset={topOffset}
    >
      <LogoLink href="/" aria-label="ClassEasily home">
        <LogoContainer $isScrolled={false}>
          <FallbackLogoIcon color={logoTitleColor} />
          <Title color={logoTitleColor} $isScrolled={false}>
            ClassEasily
          </Title>
        </LogoContainer>
      </LogoLink>
      <Spacer />
      <Selection>
        <FallbackMenuSkeleton aria-hidden />
      </Selection>
    </HeaderWrapper>
  );
};

// --- EXPORTED COMPONENT WITH SUSPENSE ---
const Header = (props) => {
  return (
    <Suspense fallback={<HeaderFallback {...props} />}>
      <HeaderContent {...props} />
    </Suspense>
  );
};

export default Header;