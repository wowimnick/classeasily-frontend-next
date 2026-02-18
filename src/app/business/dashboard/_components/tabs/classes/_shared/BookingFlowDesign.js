/**
 * Design tokens and styled components matching the booking flow
 * (MobileReserveReviewDrawer, ClassCheckoutClient, ReviewAndPaymentStep)
 */

import styled from "styled-components";

export const bookingTheme = {
  textPrimary: "#222222",
  textPrimaryAlt: "#111827",
  textSecondary: "#717171",
  textSecondaryAlt: "#6b7280",
  textMuted: "#4b5563",
  borderLight: "#e5e7eb",
  bg: "#ffffff",
  bgSecondary: "#f9fafb",
  primary: "#222222",
  primaryButton: "#222222",
};

// Card matching InfoCard from MobileReserveReviewDrawer
export const InfoCard = styled.div`
  background: ${bookingTheme.bg};
  border: 1px solid ${bookingTheme.borderLight};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  margin-bottom: 24px;
`;

// Row inside card - DetailRow pattern
export const DetailRow = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${bookingTheme.borderLight};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  &:last-child {
    border-bottom: none;
  }
`;

export const DetailContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

export const DetailLabel = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${bookingTheme.textPrimary};
`;

export const DetailValue = styled.div`
  font-size: 14px;
  color: ${bookingTheme.textSecondary};
  line-height: 1.4;
  margin-top: 2px;
`;

// Section header
export const SectionHeader = styled.div`
  padding: 20px 20px 16px;
  border-bottom: 1px solid ${bookingTheme.borderLight};

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: ${bookingTheme.textPrimary};
  }
`;

// Page/drawer title
export const PageTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: ${bookingTheme.textPrimary};
  letter-spacing: -0.01em;
`;

// Form label matching booking flow
export const FormLabel = styled.label`
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: ${bookingTheme.textPrimary};
  margin-bottom: 8px;
`;

export const FormHelpText = styled.div`
  font-size: 13px;
  color: ${bookingTheme.textSecondary};
  margin-top: 4px;
  margin-bottom: 8px;
  line-height: 1.4;
`;

// Small divider between form fields
export const FieldDivider = styled.div`
  height: 1px;
  background: ${bookingTheme.borderLight};
  margin: 16px 0;
`;

// Primary action button - NextButton from MobileReserveReviewDrawer
export const PrimaryButton = styled.button`
  width: 100%;
  padding: 16px;
  background: ${bookingTheme.primaryButton};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  &:active {
    opacity: 0.95;
    transform: scale(0.99);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Drawer handle
export const DrawerHandle = styled.div`
  width: 40px;
  height: 4px;
  background: ${bookingTheme.borderLight};
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;
