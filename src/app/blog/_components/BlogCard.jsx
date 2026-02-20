"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";
import { motion } from "framer-motion";

// --- Styled Components ---
const CardWrapper = styled(motion.article)`
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.07);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const CardImageLink = styled(Link)`
  display: block;
  overflow: hidden;
  position: relative;
  width: 100%;
  height: 200px;

  img {
    transition: transform 0.3s ease;
  }
  &:hover img {
    transform: scale(1.05);
  }
`;

const CardContent = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const PostCategory = styled(Link)`
  font-size: 0.875rem;
  font-weight: 600;
  color: #d32f2f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const CardTitleLink = styled(Link)`
  text-decoration: none;
  color: #1a1a1a;
  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.3;
    margin: 0 0 0.75rem;
    transition: color 0.3s ease;
  }
  &:hover h3 {
    color: #e63946;
  }
`;

const CardExcerpt = styled.p`
  font-size: 0.95rem;
  color: #666;
  line-height: 1.6;
  margin: 0 0 1rem;
  flex-grow: 1;
`;

const PostMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
`;

const AuthorAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const AuthorInfo = styled.div`
  font-size: 0.875rem;
  line-height: 1.4;
`;

const AuthorName = styled.span`
  font-weight: 600;
  color: #1a1a1a;
  display: block;
`;

const MetaDetails = styled.span`
  color: #595959;
`;

const BlogCard = ({ post, index = 0 }) => {
  // Load first 6 images with priority (above the fold)
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
        {post.category && (
          <PostCategory href={`/blog/category/${post.category.slug}`}>
            {post.category.name}
          </PostCategory>
        )}
        <CardTitleLink href={`/blog/${post.slug}`}>
          <h3 id={`post-title-${post.slug}`}>{post.title}</h3>
        </CardTitleLink>
        <CardExcerpt>{post.excerpt}</CardExcerpt>
        {post.author && (
          <PostMeta>
            <AuthorAvatar src={post.author.avatarUrl} alt={post.author.name} />
            <AuthorInfo>
              <AuthorName>{post.author.name}</AuthorName>
              <MetaDetails>
                {new Date(post.publishedDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                · {post.readTime != null ? `${post.readTime} min read` : "Read"}
              </MetaDetails>
            </AuthorInfo>
          </PostMeta>
        )}
      </CardContent>
    </CardWrapper>
  );
};

export default BlogCard;
