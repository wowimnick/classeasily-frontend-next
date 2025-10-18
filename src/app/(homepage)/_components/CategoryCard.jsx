import React from "react";
import styled from "styled-components";
import Image from "next/image";

const CategoryCardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 1.2rem;
  width: 250px;
  aspect-ratio: 1 / 1;
  border-radius: 0.75rem;
  position: relative;
  color: #fff;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.85) 0%,
      rgba(0, 0, 0, 0.55) 35%,
      transparent 65%
    );
    z-index: 1;
  }

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
  }

  h2 {
    margin: 0 0 0.25rem 0;
    font-size: 1.2rem;
    font-weight: 700;
    text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.7);
    z-index: 2;
    position: relative;
    color: inherit;
    line-height: 1.3;
  }

  p {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 400;
    line-height: 1.4;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
    z-index: 2;
    position: relative;
    color: inherit;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 992px) {
    width: 220px;
    padding: 1rem;
    h2 {
      font-size: 1.1rem;
    }
    p {
      font-size: 0.8rem;
    }
  }

  @media (max-width: 768px) {
    width: 200px;
    h2 {
      font-size: 1rem;
    }
    p {
      font-size: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    width: 180px;
    padding: 0.8rem;
    h2 {
      font-size: 0.9rem;
    }
    p {
      font-size: 0.7rem;
    }
  }
`;

const StyledImage = styled(Image)`
  object-fit: cover;
  object-position: center;
`;

const CategoryCard = ({ category, description, image, onClick, alt }) => {
  return (
    <CategoryCardWrapper
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Explore ${category} classes`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <StyledImage
        src={image}
        alt={alt || `${category} category`}
        fill
        sizes="(max-width: 480px) 180px, (max-width: 768px) 200px, (max-width: 992px) 220px, 250px"
        style={{ zIndex: 0 }}
        priority={false}
      />
      <h2>{category}</h2>
      <p>{description}</p>
    </CategoryCardWrapper>
  );
};

export default CategoryCard;
