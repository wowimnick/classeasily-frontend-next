// --- START OF FILE CategoryCard.jsx ---
import React from "react";
import styled from "styled-components";
import Image from "next/image";

const CardContent = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 1.5rem;
  z-index: 2;
  transform: translateY(0);
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
`;

const ImageContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  img {
    transition: transform 0.5s ease;
  }
`;

const CategoryCardWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  /* Fuller Dimensions: Taller aspect ratio (approx 3:4) */
  width: 230px;
  height: 250px;
  border-radius: 1rem; /* More modern rounded corners */
  overflow: hidden;
  cursor: pointer;
  background-color: #f0f0f0; /* Fallback */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;

  /* Gradient Overlay */
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.8) 0%,
      rgba(0, 0, 0, 0.4) 40%,
      rgba(0, 0, 0, 0) 70%
    );
    z-index: 1;
    transition: opacity 0.3s ease;
  }

  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 19px;
    font-weight: 700;
    color: #fff;
    line-height: 1.1;
    letter-spacing: -0.02em;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  p {
    margin: 0;
    font-size: 14px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Responsive Adjustments */
  @media (max-width: 992px) {
    width: 190px;
    height: 220px;

    h2 {
      font-size: 17px;
    }
  }

  @media (max-width: 768px) {
    width: 190px;
    height: 220px;
    border-radius: 0.85rem;

    ${CardContent} {
      padding: 1.25rem;
    }
  }
`;

const CategoryCard = ({ category, description, image, onClick, alt }) => {
  return (
    <CategoryCardWrapper
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Explore ${category} experiences`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <ImageContainer>
        <Image
          src={image}
          alt={alt || `${category} category`}
          fill
          sizes="(max-width: 768px) 220px, (max-width: 992px) 240px, 280px"
          style={{ objectFit: "cover" }}
          priority={false}
        />
      </ImageContainer>

      <CardContent>
        <h2>{category}</h2>
        {description && <p>{description}</p>}
      </CardContent>
    </CategoryCardWrapper>
  );
};

export default CategoryCard;
