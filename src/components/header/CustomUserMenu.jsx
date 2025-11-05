"use client";

import React, { useRef, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import styled, { createGlobalStyle } from "styled-components";
import { useAuthModal } from "@/context/AuthContext";
import { useAuthUser } from "@/hooks/useAuthUser";
import { signOutFull } from "@/lib/auth-client";
import { getRoleDisplayName } from "@/services/apiService.js";
import { LordIcon } from "@/services/ReactUtils.jsx";
import message from "@/lib/message";
import FavoritesModal from "@/components/MyFavoritesPage";
import { ChevronRight, LogOutIcon, X } from "lucide-react";

const MOBILE_BREAKPOINT = "768px";

// --- Styled Components ---
const GlobalStyle = createGlobalStyle`
  body.mobile-menu-open {
    overflow: hidden;
  }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99998;
  display: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: block;
  }
`;

const MobileOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: 99998;
  display: none;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: block;
  }
`;

const MenuContainer = styled(motion.div)`
  position: fixed;
  width: 300px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 99999;
  padding: 8px 0;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  text-align: left;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    top: 24px;
    right: 24px;
    width: 320px;
    max-width: calc(100vw - 48px);
    height: auto;
    max-height: calc(100vh - 48px);
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    padding: 0;
    z-index: 99999;
  }
`;

const CloseButton = styled(motion.button)`
  background: rgba(0, 0, 0, 0.05);
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #666;
  padding: 8px;
  display: none;
  line-height: 1;
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: #ff4757;
    color: white;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: flex;
  }
`;

const MenuHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  text-align: left;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 20px 24px;
    background: white;
    border-radius: 20px 20px 0 0;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: ${(props) => (props.$hasRole ? "8px" : "0")};
  text-align: left;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    margin-bottom: 0;
    flex-grow: 1;
    min-width: 0;
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${(props) =>
    props.$image ? `url('${props.$image}')` : "#ff385c"};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow: hidden;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #1a1a1a;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  text-align: left;
`;

const UserRoleStyled = styled.div`
  font-size: 13px;
  color: ${(props) => props.$color || "#666"};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  text-align: left;

  &::before {
    content: "";
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${(props) => props.$color || "#666"};
    flex-shrink: 0;
  }
`;

const MenuGroup = styled.div`
  padding: 12px 0;
  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }
  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 10px 0;
  }
`;

const GroupLabel = styled.div`
  padding: 0px 20px;
  color: #666;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 0px 24px;
  }
`;

const MenuItem = styled(motion.div)`
  padding: 8px 20px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
  color: #1a1a1a;
  position: relative;
  transition: background 0.2s ease, color 0.2s ease;
  text-align: left;

  &:hover {
    background: #f8f8f8;
    color: #ff385c;
  }

  lord-icon {
    width: 22px;
    height: 22px;
    margin-right: 14px;
    flex-shrink: 0;
    transition: color 0.2s ease;
  }

  &:hover lord-icon {
    --lord-icon-primary: #ff385c;
    --lord-icon-secondary: #ff385c;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    padding: 12px 24px;
    lord-icon {
      width: 24px;
      height: 24px;
      margin-right: 16px;
    }
  }
`;

const MenuText = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    font-size: 15px;
  }
`;

const ArrowIcon = styled(ChevronRight)`
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: all 0.2s ease;
  width: 16px;
  height: 16px;
  color: #aaa;

  ${MenuItem}:hover & {
    opacity: 1;
    transform: translateY(-50%) translateX(4px);
    color: #ff385c;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    display: none;
  }
`;

const MenuContentContainer = styled.div`
  @media (max-width: ${MOBILE_BREAKPOINT}) {
    flex-grow: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px 0;
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
    }
    scrollbar-width: thin;
  }
`;

const desktopMenuVariants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.95,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.95,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

const mobileMenuVariants = {
  hidden: { scale: 0.2, opacity: 0, x: 0, y: 0, borderRadius: "50px" },
  visible: {
    scale: 1,
    opacity: 1,
    x: 0,
    y: 0,
    borderRadius: "20px",
    transition: { type: "spring", damping: 25, stiffness: 300, duration: 0.4 },
  },
  exit: {
    scale: 0.2,
    opacity: 0,
    borderRadius: "50px",
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

const overlayVariants = {
  hidden: { opacity: 0, transition: { duration: 0.2 } },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const closeButtonVariants = {
  hover: { scale: 1.1, backgroundColor: "#ff4757", color: "#ffffff" },
  tap: { scale: 0.95 },
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= parseInt(MOBILE_BREAKPOINT));
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return isClient ? isMobile : false;
};

const MenuContents = React.forwardRef(
  (
    {
      isMobile,
      onClose,
      currentUser,
      onNavigate,
      onShowSettings,
      onShowFavorites,
      hasPermission,
      getUserInitials,
      handleLogin,
      handleRegister,
      handleLogout,
      menuPosition,
      transformOrigin,
    },
    ref
  ) => {
    const handleMenuItemEnter = (e) => {
      const icon = e.currentTarget.querySelector("lord-icon");
      if (icon) {
        if (icon.playerInstance) icon.playerInstance.play();
        else if (icon.player) icon.player.play();
        else
          icon.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      }
    };

    const handleMenuItemLeave = (e) => {
      const icon = e.currentTarget.querySelector("lord-icon");
      if (icon) {
        if (icon.playerInstance) {
          icon.playerInstance.pause();
          icon.playerInstance.goToFirstFrame();
        } else if (icon.player) {
          icon.player.pause();
          icon.player.goToFirstFrame();
        } else {
          icon.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
        }
      }
    };

    const renderAdminSection = () => {
      if (!currentUser || !hasPermission("quickstart.access_admin_dashboard")) {
        return null;
      }
      return (
        <MenuGroup>
          <GroupLabel>Admin</GroupLabel>
          <MenuItem
            onClick={() => onNavigate("/admin")}
            onMouseEnter={handleMenuItemEnter}
            onMouseLeave={handleMenuItemLeave}
          >
            <LordIcon
              src="https://cdn.lordicon.com/osuxyevn.json"
              colors="primary:#1a1a1a,secondary:#1a1a1a"
            />
            <MenuText>Admin Dashboard</MenuText>
            <ArrowIcon />
          </MenuItem>
        </MenuGroup>
      );
    };

    const renderBusinessSection = () => {
      if (
        !currentUser ||
        !hasPermission("quickstart.access_business_dashboard") ||
        !currentUser.has_business
      )
        return null;
      return (
        <MenuGroup>
          <GroupLabel>Business Management</GroupLabel>
          <MenuItem
            onClick={() => onNavigate("/business/dashboard")}
            onMouseEnter={handleMenuItemEnter}
            onMouseLeave={handleMenuItemLeave}
          >
            <LordIcon
              src="https://cdn.lordicon.com/cnpvyndp.json"
              colors="primary:#1a1a1a,secondary:#1a1a1a"
            />
            <MenuText>Business Dashboard</MenuText>
            <ArrowIcon />
          </MenuItem>
        </MenuGroup>
      );
    };

    return (
      <>
        <GlobalStyle />
        {isMobile ? (
          <MobileOverlay
            key="custom-user-menu-mobile-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
        ) : (
          <Overlay
            key="custom-user-menu-desktop-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
        )}
        <MenuContainer
          key="custom-user-menu-container"
          ref={ref}
          variants={isMobile ? mobileMenuVariants : desktopMenuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            ...(isMobile ? {} : menuPosition),
            transformOrigin: isMobile ? transformOrigin : "center",
          }}
        >
          {currentUser ? (
            <>
              <MenuHeader>
                <UserInfo $hasRole={!!currentUser.role?.name}>
                  <Avatar $image={currentUser.avatar_thumb_url}>
                    {!currentUser.avatar_thumb_url &&
                      getUserInitials(currentUser)}
                  </Avatar>
                  <UserDetails>
                    <UserName>
                      {currentUser.first_name} {currentUser.last_name}
                    </UserName>
                    {currentUser.role?.name && (
                      <UserRoleStyled $color={currentUser.role.color || "#666"}>
                        {getRoleDisplayName(currentUser.role.name)}
                      </UserRoleStyled>
                    )}
                  </UserDetails>
                </UserInfo>
                {isMobile && (
                  <CloseButton
                    onClick={onClose}
                    aria-label="Close menu"
                    variants={closeButtonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <X size={20} />
                  </CloseButton>
                )}
              </MenuHeader>
              <MenuContentContainer>
                {renderAdminSection()}
                {renderBusinessSection()}
                <MenuGroup>
                  <GroupLabel>Academic</GroupLabel>
                  <MenuItem
                    onClick={() => onNavigate("/my-classes")}
                    onMouseEnter={handleMenuItemEnter}
                    onMouseLeave={handleMenuItemLeave}
                  >
                    <LordIcon
                      src="https://cdn.lordicon.com/wxnxiano.json"
                      colors="primary:#1a1a1a,secondary:#1a1a1a"
                    />
                    <MenuText>My Classes</MenuText>
                    <ArrowIcon />
                  </MenuItem>
                  <MenuItem
                    onClick={onShowFavorites}
                    onMouseEnter={handleMenuItemEnter}
                    onMouseLeave={handleMenuItemLeave}
                  >
                    <LordIcon
                      src="https://cdn.lordicon.com/xyboiuok.json"
                      colors="primary:#1a1a1a,secondary:#1a1a1a"
                    />
                    <MenuText>My Favorites</MenuText>
                    <ArrowIcon />
                  </MenuItem>
                </MenuGroup>
                <MenuGroup>
                  <GroupLabel>Personal</GroupLabel>
                  <MenuItem
                    onClick={onShowSettings}
                    onMouseEnter={handleMenuItemEnter}
                    onMouseLeave={handleMenuItemLeave}
                  >
                    <LordIcon
                      src="https://cdn.lordicon.com/lecprnjb.json"
                      colors="primary:#1a1a1a,secondary:#1a1a1a"
                    />
                    <MenuText>Account Settings</MenuText>
                    <ArrowIcon />
                  </MenuItem>
                </MenuGroup>
                <MenuGroup>
                  <GroupLabel>Support & Actions</GroupLabel>
                  <MenuItem
                    onClick={() => onNavigate("/business")}
                    onMouseEnter={handleMenuItemEnter}
                    onMouseLeave={handleMenuItemLeave}
                  >
                    <LordIcon
                      src="https://cdn.lordicon.com/lewtedlh.json"
                      colors="primary:#1a1a1a,secondary:#1a1a1a"
                    />
                    <MenuText>Business? List your classes</MenuText>
                    <ArrowIcon />
                  </MenuItem>
                  <MenuItem
                    onClick={() => onNavigate("/my-tickets")}
                    onMouseEnter={handleMenuItemEnter}
                    onMouseLeave={handleMenuItemLeave}
                  >
                    <LordIcon
                      src="https://cdn.lordicon.com/axteoudt.json"
                      colors="primary:#1a1a1a,secondary:#1a1a1a"
                    />
                    <MenuText>Resolution Center</MenuText>
                    <ArrowIcon />
                  </MenuItem>
                  <MenuItem
                    onClick={handleLogout}
                    onMouseEnter={handleMenuItemEnter}
                    onMouseLeave={handleMenuItemLeave}
                  >
                    <LogOutIcon
                      size={18}
                      style={{ marginRight: 16, marginLeft: 4 }}
                    />
                    <MenuText>Logout</MenuText>
                    <ArrowIcon />
                  </MenuItem>
                </MenuGroup>
              </MenuContentContainer>
            </>
          ) : (
            <>
              <MenuHeader>
                <UserInfo>
                  <Avatar>G</Avatar>
                  <UserDetails>
                    <UserName>Welcome Guest</UserName>
                  </UserDetails>
                </UserInfo>
                {isMobile && (
                  <CloseButton
                    onClick={onClose}
                    aria-label="Close menu"
                    variants={closeButtonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <X size={20} />
                  </CloseButton>
                )}
              </MenuHeader>
              <MenuContentContainer>
                <MenuGroup>
                  <GroupLabel>Account</GroupLabel>
                  <MenuItem
                    onClick={handleLogin}
                    onMouseEnter={handleMenuItemEnter}
                    onMouseLeave={handleMenuItemLeave}
                  >
                    <LordIcon
                      src="https://cdn.lordicon.com/hrjifpbq.json"
                      colors="primary:#1a1a1a,secondary:#1a1a1a"
                    />
                    <MenuText>Login</MenuText>
                    <ArrowIcon />
                  </MenuItem>
                  <MenuItem
                    onClick={handleRegister}
                    onMouseEnter={handleMenuItemEnter}
                    onMouseLeave={handleMenuItemLeave}
                  >
                    <LordIcon
                      src="https://cdn.lordicon.com/kthelypq.json"
                      colors="primary:#1a1a1a,secondary:#1a1a1a"
                    />
                    <MenuText>Register</MenuText>
                    <ArrowIcon />
                  </MenuItem>
                </MenuGroup>
                <MenuGroup>
                  <GroupLabel>Information</GroupLabel>
                  <MenuItem
                    onClick={() => onNavigate("/about-us")}
                    onMouseEnter={handleMenuItemEnter}
                    onMouseLeave={handleMenuItemLeave}
                  >
                    <LordIcon
                      src="https://cdn.lordicon.com/yhtmwrae.json"
                      colors="primary:#1a1a1a,secondary:#1a1a1a"
                    />
                    <MenuText>About Us</MenuText>
                    <ArrowIcon />
                  </MenuItem>
                  <MenuItem
                    onClick={() => onNavigate("/my-tickets")}
                    onMouseEnter={handleMenuItemEnter}
                    onMouseLeave={handleMenuItemLeave}
                  >
                    <LordIcon
                      src="https://cdn.lordicon.com/biqqsrac.json"
                      colors="primary:#1a1a1a,secondary:#1a1a1a"
                    />
                    <MenuText>Help Center</MenuText>
                    <ArrowIcon />
                  </MenuItem>
                </MenuGroup>
              </MenuContentContainer>
            </>
          )}
        </MenuContainer>
      </>
    );
  }
);
MenuContents.displayName = "MenuContents";

// SIMPLIFIED VERSION: Just use document.body and let React handle cleanup
const CustomUserMenu = ({
  isOpen,
  onClose,
  onNavigate,
  onShowSettings,
  triggerRef,
}) => {
  const { user: currentUser, isLoading } = useAuthUser();
  const { openLoginModal, openRegisterModal } = useAuthModal();
  const menuRef = useRef(null);
  const isMobile = useIsMobile();
  const [menuPosition, setMenuPosition] = useState(null);
  const [transformOrigin, setTransformOrigin] = useState("center");
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hasPermission = (perm) =>
    currentUser?.permissions?.includes(perm) ?? false;

  useEffect(() => {
    const calculatePosition = () => {
      if (isOpen && triggerRef.current && typeof window !== "undefined") {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        if (!isMobile) {
          const menuWidth = 300;
          setMenuPosition({
            top: `${triggerRect.bottom + 8}px`,
            left: `${triggerRect.right - menuWidth}px`,
          });
        } else {
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const triggerCenterX = triggerRect.left + triggerRect.width / 2;
          const triggerCenterY = triggerRect.top + triggerRect.height / 2;
          const popupLeft = viewportWidth - 24 - 320;
          const popupTop = 24;
          const originX = ((triggerCenterX - popupLeft) / 320) * 100;
          const originY =
            ((triggerCenterY - popupTop) / (viewportHeight - 48)) * 100;
          const clampedX = Math.max(0, Math.min(100, originX));
          const clampedY = Math.max(0, Math.min(100, originY));
          setTransformOrigin(`${clampedX}% ${clampedY}%`);
        }
      }
    };

    if (isOpen) {
      calculatePosition();
      window.addEventListener("resize", calculatePosition);
      window.addEventListener("scroll", calculatePosition, true);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", calculatePosition);
        window.removeEventListener("scroll", calculatePosition, true);
      }
    };
  }, [isOpen, isMobile, triggerRef]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, menuRef, triggerRef]);

  useEffect(() => {
    if (isOpen && isMobile) document.body.classList.add("mobile-menu-open");
    else document.body.classList.remove("mobile-menu-open");
    return () => document.body.classList.remove("mobile-menu-open");
  }, [isOpen, isMobile]);

  const handleActualNavigate = (path) => {
    onClose();
    setTimeout(() => onNavigate(path), 150);
  };

  const handleActualShowSettings = () => {
    onClose();
    onShowSettings();
  };

  const handleShowFavorites = () => {
    onClose();
    setIsFavoritesModalOpen(true);
  };

  const handleLogin = () => {
    onClose();
    openLoginModal();
  };

  const handleRegister = () => {
    onClose();
    openRegisterModal();
  };

  const handleLogout = async () => {
    onClose();
    try {
      await signOutFull();
      message.success("Logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
      message.error("Logout failed. Please try again.");
    }
  };

  const getUserInitials = (user) => {
    if (!user) return "G";
    const f = user.first_name?.[0] || "";
    const l = user.last_name?.[0] || "";
    return `${f}${l}`.toUpperCase() || "U";
  };

  if (!isClient || typeof document === "undefined") {
    return null;
  }

  // SIMPLER: Just portal directly to document.body, let React handle cleanup
  return ReactDOM.createPortal(
    <>
      <AnimatePresence mode="wait">
        {isOpen && (
          <MenuContents
            key="menu-contents-wrapper"
            ref={menuRef}
            isMobile={isMobile}
            onClose={onClose}
            currentUser={currentUser}
            onNavigate={handleActualNavigate}
            onShowSettings={handleActualShowSettings}
            onShowFavorites={handleShowFavorites}
            hasPermission={hasPermission}
            getUserInitials={getUserInitials}
            handleLogin={handleLogin}
            handleRegister={handleRegister}
            handleLogout={handleLogout}
            menuPosition={menuPosition}
            transformOrigin={transformOrigin}
          />
        )}
      </AnimatePresence>
      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
      />
    </>,
    document.body
  );
};

export default CustomUserMenu;
