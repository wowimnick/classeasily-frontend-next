"use client";

import React, { useState, useRef, Suspense, useEffect } from "react";
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

const ringPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 56, 92, 0.25); }
  50%       { box-shadow: 0 0 0 5px rgba(255, 56, 92, 0); }
`;

const HeaderWrapper = styled.header`
  background: #ffffff;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 20px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  z-index: 999;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 0 14px;
  }
`;

const LogoLinkWrapper = styled.div`
  color: inherit;
  display: flex;
  align-items: center;
  padding: 6px 8px;
  margin-right: 16px;
  border-radius: 8px;
  transition: background 0.15s ease;
  cursor: pointer;

  &:hover {
    background: #f5f5f5;
  }

  @media (max-width: 768px) {
    margin-right: 8px;
  }
`;

const CenterSection = styled.div`
  flex: 1;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    gap: 6px;
  }
`;

const UserProfileContainer = styled.div`
  position: relative;
`;

const UserProfileContainerMobileHidden = styled(UserProfileContainer)`
  @media (max-width: 768px) {
    display: none;
  }
`;

const UserProfileButton = styled.div`
  display: flex;
  align-items: center;
  padding: 5px 12px 5px 5px;
  height: 38px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 8px;

  @media (max-width: 768px) {
    padding: 5px;
    gap: 0;
  }

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }

  ${(props) =>
    props.$isActive &&
    css`
      background: rgba(255, 56, 92, 0.06);
      border-color: rgba(255, 56, 92, 0.25);
      animation: ${ringPulse} 2s infinite;
    `}
`;

const UserAvatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #ff385c, #e91e63);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(255, 56, 92, 0.25);
`;

const UserNameDisplay = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
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

  useEffect(() => {
    return () => {
      setUserMenuVisible(false);
      setSettingsDrawerVisible(false);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
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

  const handleNavigate = (path) => {
    setUserMenuVisible(false);
    setSettingsDrawerVisible(false);
    setTimeout(() => {
      router.push(path);
    }, 100);
  };

  const getUserInitials = () => {
    if (currentUser?.first_name && currentUser?.last_name) {
      return `${currentUser.first_name.charAt(0)}${currentUser.last_name.charAt(0)}`.toUpperCase();
    }
    if (currentUser?.first_name) return currentUser.first_name.charAt(0).toUpperCase();
    if (currentUser?.username) return currentUser.username.charAt(0).toUpperCase();
    return "U";
  };

  const getUserDisplayName = () => {
    if (currentUser?.first_name && currentUser?.last_name) {
      return `${currentUser.first_name} ${currentUser.last_name.charAt(0)}.`;
    }
    if (currentUser?.first_name) return currentUser.first_name;
    if (currentUser?.username) return currentUser.username;
    return null;
  };

  const userDisplayName = getUserDisplayName();

  return (
    <>
      <HeaderWrapper>
        <Link href="/" passHref legacyBehavior>
          <LogoLinkWrapper as="a">
            <LogoIcon size="1.75rem" activeColor="#ff385c" restingColor="#111827" />
          </LogoLinkWrapper>
        </Link>

        <CenterSection />

        <RightSection>
          {currentUser && <NotificationsButton />}

          {currentUser && (
            <UserProfileContainerMobileHidden ref={userProfileRef}>
              <UserProfileButton
                onClick={() => setUserMenuVisible(!userMenuVisible)}
                $isActive={userMenuVisible}
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
            </UserProfileContainerMobileHidden>
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
