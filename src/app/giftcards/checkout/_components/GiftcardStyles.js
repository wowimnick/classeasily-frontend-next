import styled, { css } from "styled-components";
import { motion } from "framer-motion";

export const CORPORATE_COLOR = "#ff385c";

export const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  padding-top: 100px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #000;
  display: flex;
  flex-direction: column;
  align-items: center; /* Ensures content is centered vertically if needed, but mostly for horizontal */

  @media (max-width: 768px) {
    padding-top: 80px;
  }
`;

export const MainContainer = styled.div`
  max-width: 1120px; /* Standard Airbnb max-width */
  width: 100%;
  margin: 0 auto; /* Centers the container */
  padding: 40px 24px;
  position: relative;

  /* Flex fallback or Grid can be defined in specific steps, 
     but this ensures the container itself is always centered on screen */

  @media (max-width: 900px) {
    padding: 20px 16px;
    padding-bottom: 120px;
  }
`;

export const SectionHeader = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const SectionBlock = styled.section`
  margin-bottom: 48px;
`;

export const StickyCard = styled.div`
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  background: white;
`;

export const ActionButton = styled(motion.button)`
  background: ${CORPORATE_COLOR};
  color: white;
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  margin-top: 16px;
  cursor: pointer;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &:hover {
    background: #d9324e;
  }
`;

export const CheckoutLink = styled.button`
  text-decoration: underline;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
  color: #222;
`;
