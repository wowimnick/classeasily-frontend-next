"use client";

import Image from "next/image";
import styled from "styled-components";
import { motion } from "framer-motion";
import { formatMoney } from "./formatMoney";

const CardContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  cursor: pointer;
  group: hover;
`;

const ImageWrapper = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 16px;
  overflow: hidden;
  background: #f0f0f0;
  isolation: isolate;
`;

const StyledImage = styled(Image)`
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  ${CardContainer}:hover & {
    transform: scale(1.05);
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  color: #000000;
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Host = styled.p`
  font-size: 0.9375rem;
  color: #000000;
  margin: 0;
  line-height: 1.3;
  font-weight: 400;
`;

const PriceRow = styled.div`
  margin-top: 0.25rem;
  font-size: 0.9375rem;
  color: #000000;
`;

const Price = styled.span`
  font-weight: 500;
`;

const ActionOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  ${CardContainer}:hover & {
    opacity: 1;
  }
`;

const ViewButton = styled.div`
  background: white;
  color: #000000;
  padding: 0.75rem 1.5rem;
  border-radius: 100px;
  font-weight: 500;
  font-size: 0.9375rem;
  transform: translateY(10px);
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);

  ${CardContainer}:hover & {
    transform: translateY(0);
  }
`;

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.1,
      type: "spring",
      stiffness: 100,
      damping: 20,
      mass: 1,
    },
  }),
};

export default function OptionCard({ option, index, currency, onDetails, onChoose, onHighlight }) {
  const src = option.cover_image_url;

  return (
    <CardContainer
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => onHighlight?.(option)}
      onClick={() => onDetails(option)}
    >
      <ImageWrapper>
        {src ? (
          <StyledImage
            src={src}
            alt={option.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : null}
        <ActionOverlay>
          <ViewButton>View details</ViewButton>
        </ActionOverlay>
      </ImageWrapper>
      
      <Content>
        <TitleRow>
          <Title>{option.title}</Title>
        </TitleRow>
        {option.host_name && <Host>{option.host_name}</Host>}
        <PriceRow>
          <Price>{formatMoney(option.price_total_cents, currency)}</Price> total
        </PriceRow>
      </Content>
    </CardContainer>
  );
}
