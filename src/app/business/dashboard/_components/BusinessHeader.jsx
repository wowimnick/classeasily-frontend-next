"use client";

import React, { useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import styled, { css, keyframes } from "styled-components";
import { useAuth } from "@/lib/auth-client";
import Link from "next/link";
import dynamic from "next/dynamic";

const LogoIcon = dynamic(() => import("@/components/common/logoIcon"), {
  ssr: false,
});

const SettingsModal = dynamic(
  () => import("@/components/header/SettingsDrawer"),
  { ssr: false }
);
import NotificationsButton from "./NotificationsButton";

const CustomUserMenu = dynamic(
  () => import("@/components/header/CustomUserMenu.jsx"),
  { ssr: false }
);

// Animations
const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 56, 92, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(255, 56, 92, 0);
  }
`;

// Styled Components
const HeaderWrapper = styled.header`
  background: linear-gradient(135deg, #1a1a1a, #141414);
  color: #ffffff;
  display: flex;
  align-items: center;
  height: 4rem;
  padding: 0 2rem;
  border-bottom: 1px solid rgba(255, 56, 92, 0.2);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 999;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }

  &::before {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 56, 92, 0.5),
      transparent
    );
  }
`;

const LogoLinkWrapper = styled.div`
  color: inherit;
  display: flex;
  align-items: center;
  padding: 0.75rem;
  margin-right: 2rem;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;

  @media (max-width: 768px) {
    margin-right: 1rem;
    padding: 0.5rem;
  }

  &:hover {
    transform: translateY(-1px);
  }
`;

const CenterSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const UserProfileContainer = styled.div`
  position: relative;
`;

const UserProfileButton = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  padding: 6px 12px 6px 6px;
  height: 44px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05)
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  gap: 8px;

  @media (max-width: 768px) {
    padding: 6px;
    gap: 0;
  }

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.15),
      rgba(255, 255, 255, 0.08)
    );
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }

  ${(props) =>
    props.isActive &&
    css`
      background: linear-gradient(
        135deg,
        rgba(255, 56, 92, 0.2),
        rgba(255, 56, 92, 0.1)
      );
      border-color: rgba(255, 56, 92, 0.4);
      animation: ${pulseGlow} 2s infinite;
    `}
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff385c, #e91e63);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(255, 56, 92, 0.3);
  flex-shrink: 0;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
    border-radius: 10px;
  }
`;

const UserNameDisplay = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const BusinessHeader = () => {
  const { user: currentUser, signOut } = useAuth();
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const router = useRouter();
  const userProfileRef = useRef(null);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
      // Force reload as fallback
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  const showSettingsDrawer = () => {
    setSettingsDrawerVisible(true);
    setTimeout(() => setSettingsLoading(false), 1000);
  };

  const onCloseSettingsDrawer = () => {
    setSettingsDrawerVisible(false);
    setSettingsLoading(true);
  };

  // FIX 1: Create proper navigation handler function
  const handleNavigate = (path) => {
    router.push(path);
  };

  const getUserInitials = () => {
    if (currentUser?.first_name && currentUser?.last_name) {
      return `${currentUser.first_name.charAt(0)}${currentUser.last_name.charAt(
        0
      )}`.toUpperCase();
    }
    if (currentUser?.first_name) {
      return currentUser.first_name.charAt(0).toUpperCase();
    }
    if (currentUser?.username) {
      return currentUser.username.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (currentUser?.first_name && currentUser?.last_name) {
      return `${currentUser.first_name} ${currentUser.last_name.charAt(0)}.`;
    }
    if (currentUser?.first_name) {
      return currentUser.first_name;
    }
    if (currentUser?.username) {
      return currentUser.username;
    }
    return null;
  };

  const userDisplayName = getUserDisplayName();

  return (
    <>
      <HeaderWrapper>
        <Link href="/" passHref legacyBehavior>
          <LogoLinkWrapper as="a">
            <LogoIcon
              size="2rem"
              activeColor="#ff385c"
              restingColor="#ffffff"
            />
          </LogoLinkWrapper>
        </Link>

        <CenterSection></CenterSection>

        <RightSection>
          {currentUser && <NotificationsButton />}

          {currentUser && (
            <UserProfileContainer ref={userProfileRef}>
              <UserProfileButton
                onClick={() => setUserMenuVisible(!userMenuVisible)}
                isActive={userMenuVisible}
              >
                <UserAvatar>{getUserInitials()}</UserAvatar>
                {userDisplayName && (
                  <UserNameDisplay>{userDisplayName}</UserNameDisplay>
                )}
              </UserProfileButton>

              <Suspense>
                <CustomUserMenu
                  isOpen={userMenuVisible}
                  onClose={() => setUserMenuVisible(false)}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  onNavigate={handleNavigate}
                  onShowSettings={showSettingsDrawer}
                  triggerRef={userProfileRef}
                />
              </Suspense>
            </UserProfileContainer>
          )}
        </RightSection>
      </HeaderWrapper>

      {currentUser && (
        <Suspense>
          <SettingsModal
            open={settingsDrawerVisible}
            onClose={onCloseSettingsDrawer}
            loading={settingsLoading}
            currentUser={currentUser}
          />
        </Suspense>
      )}
    </>
  );
};

export default BusinessHeader;
