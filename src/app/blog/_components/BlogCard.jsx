"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";

const CardWrapper = styled.article`
  display: flex;
  flex-direction: column;
`;

const CardImageLink = styled(Link)`
  display: block;
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  border-radius: 16px;
  overflow: hidden;
  background: #e5e7eb;

  img {
    transition: transform 0.3s ease;
  }
  &:hover img {
    transform: scale(1.03);
  }
`;

const CardContent = styled.div`
  margin-top: 16px;
`;

const CardTitleLink = styled(Link)`
  text-decoration: none;
  color: #111827;

  h3 {
    font-size: 1.125rem;
    font-weight: 700;
    line-height: 1.3;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  &:hover h3 {
    color: #4b5563;
  }
`;

const CardExcerpt = styled.p`
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
  margin: 8px 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MetaFooter = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
  font-size: 13px;
  color: #6b7280;
`;

const ReadTime = styled.span`
  font-weight: 400;
`;

const BlogCard = ({ post, index = 0 }) => {
  const shouldPrioritize = index < 6;

  return (
    <CardWrapper role="article" aria-labelledby={`post-title-${post.slug}`}>
      <CardImageLink href={`/blog/${post.slug}`}>
        <Image
          src={post.imageUrl}
          alt={post.title}
          fill
          style={{ objectFit: "cover" }}
          priority={shouldPrioritize}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={85}
        />
      </CardImageLink>
      <CardContent>
        <CardTitleLink href={`/blog/${post.slug}`}>
          <h3 id={`post-title-${post.slug}`}>{post.title}</h3>
        </CardTitleLink>
        <CardExcerpt>{post.excerpt}</CardExcerpt>
        <MetaFooter>
          <ReadTime>
            {post.readTime != null ? `${post.readTime} min read` : "Read"}
          </ReadTime>
        </MetaFooter>
      </CardContent>
    </CardWrapper>
  );
};

export default BlogCard;
