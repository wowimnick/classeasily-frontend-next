"use client";

import React, { useState, useEffect } from "react";
import { Modal, Typography, Button, ConfigProvider } from "antd";
import { AlertTriangle } from "lucide-react";
import styled from "styled-components";
import { theme } from "@/components/theme";
import { LordIcon } from "@/services/ReactUtils";
import { Drawer } from "vaul";

const { Text, Title, Paragraph } = Typography;

// NEW: Vaul Drawer Styles for Mobile
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
  max-height: 70vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
  padding: 12px;

  @media (max-width: 480px) {
    padding: 4px;
  }
`;

const DrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const DrawerFooter = styled.div`
  padding: 16px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;

  @media (max-width: 480px) {
    padding: 12px 16px;
    flex-direction: column-reverse;
    .ant-btn {
      width: 100%;
    }
  }
`;

// Desktop Modal
const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
  }
  .ant-modal-header,
  .ant-modal-close {
    display: none;
  }
  .ant-modal-body {
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;

    @media (max-width: 480px) {
      padding: 4px;
    }
  }
  .ant-modal-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;

    @media (max-width: 480px) {
      padding: 16px;
      flex-direction: column-reverse;
      .ant-btn {
        width: 100%;
      }
    }
  }
`;

const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
`;

const WarningIconContainer = styled.div`
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  padding: 16px;
  box-shadow: 0px 0px 4px 0px rgb(0 0 0 / 13%);
`;

const StyledTitle = styled(Title)`
  &.ant-typography {
    margin-bottom: 8px !important;
    font-weight: 700;
    color: ${theme.token.colorText};
    font-size: 22px !important;

    @media (max-width: 768px) {
      font-size: 20px !important;
    }
  }
`;

const StyledParagraph = styled(Paragraph)`
  &.ant-typography {
    color: ${theme.token.colorTextSecondary};
    font-size: 15px;
    line-height: 1.6;
    max-width: 400px;
    margin: 0 !important;

    @media (max-width: 768px) {
      font-size: 14px;
    }
  }
`;

const FinalWarning = styled(Paragraph)`
  &.ant-typography {
    background: #fff5f5;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 13px;
    color: #991b1b;
    line-height: 1.5;
    strong {
      color: #7f1d1d;
    }
  }
`;

const DeleteClassModal = ({
  visible,
  onCancel,
  onConfirm,
  classData,
  isDeleting,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderContent = () => (
    <>
      <HeaderSection>
        <WarningIconContainer>
          <lord-icon
            src="https://cdn.lordicon.com/oqeixref.json"
            trigger="in"
            state="in-trash-empty"
            colors="primary:#94a3b8"
            style={{ width: 40, height: 40 }}
          />
        </WarningIconContainer>
        <StyledTitle level={3}>Permanently Delete Class?</StyledTitle>
        <StyledParagraph>
          This action is irreversible. Please review the class details below
          before proceeding.
        </StyledParagraph>
      </HeaderSection>
      <FinalWarning>
        <strong>This cannot be undone.</strong> All associated bookings will be
        cancelled, and refunds may be issued automatically.
      </FinalWarning>
    </>
  );

  const renderFooterButtons = () => (
    <>
      <Button
        key="cancel"
        onClick={onCancel}
        disabled={isDeleting}
        size="middle"
      >
        Cancel
      </Button>
      <Button
        key="delete"
        danger
        type="primary"
        onClick={onConfirm}
        loading={isDeleting}
        size="middle"
        icon={
          <LordIcon
            src="https://cdn.lordicon.com/oqeixref.json"
            trigger="in"
            delay="1500"
            state="in-trash-empty"
            colors="primary:#ffffff,secondary:#ffffff,tertiary:#ffffff"
          ></LordIcon>
        }
      >
        Yes, Delete Class
      </Button>
    </>
  );

  if (!visible) return null;

  return (
    <ConfigProvider theme={theme}>
      {isMobile ? (
        <Drawer.Root
          open={visible}
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              onCancel();
            }
          }}
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent>
              <DrawerHandle />
              <DrawerBody>{renderContent()}</DrawerBody>
              <DrawerFooter>{renderFooterButtons()}</DrawerFooter>
            </StyledDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        <StyledModal
          open={visible}
          onCancel={onCancel}
          footer={renderFooterButtons()}
          centered
          width={500}
          destroyOnClose
          maskClosable={!isDeleting}
        >
          {renderContent()}
        </StyledModal>
      )}
    </ConfigProvider>
  );
};

export default DeleteClassModal;
