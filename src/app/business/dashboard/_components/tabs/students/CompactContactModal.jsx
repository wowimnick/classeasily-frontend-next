"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Avatar,
  ConfigProvider,
  Typography,
  Button,
  Tag,
  Skeleton,
  Space,
} from "antd";
import { User, Mail, Phone, X } from "lucide-react";
import { businessStudentService } from "@/services/apiService";
import styled from "styled-components";
import NotesSection from "./NotesSection";
import { formatPhoneNumber } from "@/services/utils";
import { theme as appTheme } from "@/components/theme";
import { Drawer } from "vaul";

const { Text } = Typography;

// --- Vaul Drawer Styles ---
const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
`;

const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 85vh;
  max-height: 85vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;

const DrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DrawerHeader = styled.div`
  flex-shrink: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
`;

const DrawerTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  background: #f8fafc;

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
`;

// --- Desktop Modal Styles ---
const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }
  .ant-modal-header {
    display: none;
  }
  .ant-modal-body {
    padding: 0;
    max-height: 70vh;
    overflow: hidden;
    background: #f8fafc;
  }
  .ant-modal-close {
    top: 16px;
    right: 16px;
    z-index: 10;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    &:hover {
      background: rgba(255, 255, 255, 1);
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .ant-modal-close-x {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const CompactContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const CompactHeader = styled.div`
  background: #ffffff;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e2e8f0;
`;

const HeaderLayout = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
`;

const CompactAvatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f8fafc;
  flex-shrink: 0;
  border: 2px solid #ffffff;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  .ant-avatar {
    width: 100% !important;
    height: 100% !important;
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px !important;
    color: white;
  }
`;

const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1e293b;
  line-height: 1.2;
`;

const ContactDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 13px;
  svg {
    color: #64748b;
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
  a {
    color: #475569;
    text-decoration: none;
    &:hover {
      color: #ff385c;
    }
  }
`;

const CompactBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 24px;
`;

const HeaderSkeleton = () => (
  <CompactHeader>
    <HeaderLayout>
      <Skeleton.Avatar
        active
        shape="circle"
        style={{ width: 56, height: 56 }}
      />
      <div style={{ flex: 1 }}>
        <Skeleton
          active
          title={{ width: "60%" }}
          paragraph={{ rows: 2, width: ["80%", "60%"] }}
        />
      </div>
    </HeaderLayout>
  </CompactHeader>
);

const CompactContactModal = ({ guest: initialGuest, onClose, currentUser }) => {
  const [guest, setGuest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const fetchGuestDetails = async () => {
      if (!initialGuest?.id) {
        setError("No contact selected.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await businessStudentService.getBusinessStudentProfile(
          initialGuest.id
        );

        if (response.success && response.data) {
          setGuest(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch contact details");
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError("The requested contact could not be found.");
        } else {
          setError(err.message || "Could not load contact details.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuestDetails();
  }, [initialGuest]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <CompactContainer>
          <HeaderSkeleton />
          <CompactBody>
            <Skeleton active paragraph={{ rows: 4 }} />
          </CompactBody>
        </CompactContainer>
      );
    }

    if (error || !guest) {
      return (
        <CompactContainer>
          <CompactHeader>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Text type="danger">
                {error || "Failed to load contact details"}
              </Text>
            </div>
          </CompactHeader>
        </CompactContainer>
      );
    }

    const avatarLetter = guest.first_name
      ? guest.first_name[0].toUpperCase()
      : guest.email
      ? guest.email[0].toUpperCase()
      : "?";

    const { display: phoneDisplay, link: phoneLink } = formatPhoneNumber(
      guest.phone_number || ""
    );

    return (
      <CompactContainer>
        <CompactHeader>
          <HeaderLayout>
            <CompactAvatar>
              <Avatar src={guest.avatar_thumb_url} icon={<User />}>
                {!guest.avatar_thumb_url && avatarLetter}
              </Avatar>
            </CompactAvatar>
            <ContactInfo>
              <ContactName>
                {guest.first_name || "Unknown"} {guest.last_name || ""}
              </ContactName>
              <Tag color="default" size="small">
                Imported Contact
              </Tag>
              <ContactDetails>
                {guest.email && (
                  <ContactItem>
                    <Mail />
                    <a href={`mailto:${guest.email}`}>{guest.email}</a>
                  </ContactItem>
                )}
                {guest.phone_number && (
                  <ContactItem>
                    <Phone />
                    {phoneLink ? (
                      <a href={phoneLink}>{phoneDisplay}</a>
                    ) : (
                      <span>{phoneDisplay}</span>
                    )}
                  </ContactItem>
                )}
                {!guest.phone_number && !guest.email && (
                  <ContactItem>
                    <span style={{ color: "#64748b", fontStyle: "italic" }}>
                      No contact information available
                    </span>
                  </ContactItem>
                )}
              </ContactDetails>
            </ContactInfo>
          </HeaderLayout>
        </CompactHeader>

        <CompactBody>
          <NotesSection
            guest={guest}
            currentUser={currentUser}
            compact={true}
          />
        </CompactBody>
      </CompactContainer>
    );
  };

  return (
    <ConfigProvider theme={appTheme}>
      {/* Mobile Drawer */}
      {isMobile ? (
        <Drawer.Root
          open={true}
          onOpenChange={(open) => !open && onClose()}
          repositionInputs={false}
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent>
              <DrawerHandle />
              <DrawerBody>{renderContent()}</DrawerBody>
            </StyledDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        /* Desktop Modal */
        <StyledModal
          open={true}
          onCancel={onClose}
          footer={null}
          width={500}
          closable={true}
          closeIcon={<X size={18} />}
          centered
          destroyOnClose
        >
          {renderContent()}
        </StyledModal>
      )}
    </ConfigProvider>
  );
};

export default CompactContactModal;
