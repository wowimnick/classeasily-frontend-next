"use client";

import React from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { signOutFull } from "@/lib/auth-client";
import styled from "styled-components";

const BannerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #dc3545;
  color: white;
  padding: 8px 16px;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
`;

const BannerContent = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StopButton = styled.button`
  background: none;
  border: 1px solid white;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
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

const ImpersonationBanner = () => {
  const { user: currentUser } = useAuthUser();
  const isImpersonating = currentUser?.is_impersonating || false;

  const handleStopImpersonation = async () => {
    try {
      await signOutFull();
      message.success("Stopped impersonation");
    } catch (error) {
      console.error("Error stopping impersonation:", error);
    }
  };

  if (!isImpersonating || !currentUser) {
    return null;
  }

  const impersonatedUserName =
    currentUser.first_name && currentUser.last_name
      ? `${currentUser.first_name} ${currentUser.last_name}`
      : currentUser.email || "Unknown User";

  return (
    <BannerContainer>
      <BannerContent>
        <span>
          Impersonating <strong>{impersonatedUserName}</strong>
        </span>
        <StopButton onClick={handleStopImpersonation}>Stop</StopButton>
      </BannerContent>
    </BannerContainer>
  );
};

export default ImpersonationBanner;
