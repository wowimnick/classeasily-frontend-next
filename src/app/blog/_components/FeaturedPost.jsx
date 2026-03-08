"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";

const FeaturedCardLink = styled(Link)`
  display: block;
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 16px;
  overflow: hidden;
  background: #111827;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  &:hover img {
    transform: scale(1.03);
  }
`;

const GradientOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.85) 0%,
    rgba(0, 0, 0, 0.4) 40%,
    transparent 70%
  );
  pointer-events: none;
`;

const TextContent = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32px;
  pointer-events: none;

  h2 {
    margin: 0;
    font-size: clamp(1.75rem, 2.5vw, 2rem);
    font-weight: 700;
    line-height: 1.2;
    color: #ffffff;
    white-space: pre-line;
  }
`;

const FeaturedPost = ({ post }) => (
  <FeaturedCardLink href={`/blog/${post.slug}`}>
    <Image
      src={post.imageUrl}
      alt={post.title}
      fill
      priority
      fetchPriority="high"
      sizes="(max-width: 992px) 100vw, 65vw"
    />
    <GradientOverlay />
    <TextContent>
      <h2>{post.title}</h2>
    </TextContent>
  </FeaturedCardLink>
);

export default FeaturedPost;
