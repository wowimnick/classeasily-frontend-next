"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAuth,
  getOptimisticAuthState,
  useAuthStore,
} from "@/lib/auth-client";
import { signOutFull } from "@/lib/auth-client";
import { userAdminService } from "@/services/adminDash";
import message from "@/lib/message";
import styled from "styled-components";

const BANNER_HEIGHT_PX = 48;

const BannerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: ${BANNER_HEIGHT_PX}px;
  background: #dc3545;
  color: white;
  padding: 0 16px;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const BannerContent = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BannerButton = styled.button`
  background: none;
  border: 1px solid white;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
`;

function readPersistedImpersonating() {
  if (typeof window === "undefined") return false;
  return getOptimisticAuthState().isImpersonating || false;
}

const ImpersonationBanner = () => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const storeImpersonating = useAuthStore((state) => state.isImpersonating);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [persistedImpersonating, setPersistedImpersonating] = useState(
    readPersistedImpersonating,
  );

  useEffect(() => {
    setPersistedImpersonating(readPersistedImpersonating());
  }, [storeImpersonating, hasHydrated]);

  const isImpersonating = storeImpersonating || persistedImpersonating;

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isImpersonating) {
      document.body.style.paddingTop = `${BANNER_HEIGHT_PX}px`;
    } else {
      document.body.style.paddingTop = "";
    }
    return () => {
      document.body.style.paddingTop = "";
    };
  }, [isImpersonating]);

  const handleStopImpersonation = async () => {
    try {
      await signOutFull();
      message.success("Stopped impersonation");
    } catch (error) {
      console.error("Error stopping impersonation:", error);
    }
  };

  const handleReturnToAdmin = async () => {
    try {
      const result = await userAdminService.endImpersonation();
      if (result.success && result.data?.user) {
        useAuthStore.setState({
          user: result.data.user,
          isAuthenticated: true,
          isImpersonating: false,
          isLoading: false,
        });
        message.success("Back to your admin account.");
        router.push("/admin/class-listings");
      } else {
        await signOutFull();
        message.info("Session expired. Log back in as admin to continue.");
        router.push("/admin/class-listings");
      }
    } catch (error) {
      console.error("Error returning to admin:", error);
      await signOutFull();
      message.info("Could not restore session. Log back in as admin.");
      router.push("/admin/class-listings");
    }
  };

  if (!isImpersonating) {
    return null;
  }

  const impersonatedUserName = currentUser
    ? currentUser.first_name && currentUser.last_name
      ? `${currentUser.first_name} ${currentUser.last_name}`
      : currentUser.email || "Unknown User"
    : "User";

  return (
    <BannerContainer>
      <BannerContent>
        <span>
          Impersonating <strong>{impersonatedUserName}</strong>
        </span>
        <BannerButton onClick={handleReturnToAdmin}>
          Return to admin
        </BannerButton>
        <BannerButton onClick={handleStopImpersonation}>Stop</BannerButton>
      </BannerContent>
    </BannerContainer>
  );
};

export default ImpersonationBanner;
