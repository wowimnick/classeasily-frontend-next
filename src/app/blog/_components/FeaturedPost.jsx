"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";
import { motion } from "framer-motion";

// --- Styled Components ---
const FeaturedPostContainer = styled(motion.article)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-bottom: 5rem;
  align-items: center;
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const FeaturedImageLink = styled(Link)`
  display: block;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
  &:hover {
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    aspect-ratio: 16 / 10;
    transition: transform 0.3s ease;
  }
  &:hover img {
    transform: scale(1.03);
  }
`;

const FeaturedContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const PostCategory = styled(Link)`
  font-size: 0.875rem;
  font-weight: 600;
  color: #d32f2f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1rem;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const PostTitleLink = styled(Link)`
  text-decoration: none;
  color: #1a1a1a;
  h2 {
    font-size: clamp(1.8rem, 3vw, 2.5rem);
    font-weight: 700;
    line-height: 1.2;
    margin: 0 0 1rem;
    transition: color 0.3s ease;
  }
  &:hover h2 {
    color: #e63946;
  }
`;

const PostExcerpt = styled.p`
  font-size: 1.1rem;
  color: #555;
  line-height: 1.6;
  margin: 0 0 1.5rem;
`;

const PostMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
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

const FeaturedPost = ({ post }) => (
  <FeaturedPostContainer>
    <FeaturedImageLink href={`/blog/${post.slug}`}>
      <Image
        src={post.imageUrl}
        alt={post.title}
        width={800}
        height={500}
        priority
        fetchPriority="high"
        sizes="(max-width: 992px) 100vw, 50vw"
      />
    </FeaturedImageLink>
    <FeaturedContent>
      {post.category && (
        <PostCategory href={`/blog/category/${post.category.slug}`}>
          {post.category.name}
        </PostCategory>
      )}
      <PostTitleLink href={`/blog/${post.slug}`}>
        <h2>{post.title}</h2>
      </PostTitleLink>
      <PostExcerpt>{post.excerpt}</PostExcerpt>
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
    </FeaturedContent>
  </FeaturedPostContainer>
);

export default FeaturedPost;
