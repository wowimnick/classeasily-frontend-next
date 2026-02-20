"use client";
import React from "react";
import Link from "next/link";
import styled from "styled-components";
import { Clock } from "lucide-react";

const ArticleHeader = styled.header`
  margin-bottom: 2rem;
`;

const PostCategory = styled(Link)`
  font-size: 0.875rem;
  font-weight: 600;
  color: #d32f2f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const ArticleTitle = styled.h1`
  font-size: clamp(2.2rem, 5vw, 3rem);
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1.2;
  margin: 1rem 0;
`;

const PostMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const AuthorAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
`;

const AuthorInfo = styled.div`
  font-size: 0.95rem;
  line-height: 1.4;
`;

const AuthorName = styled.span`
  font-weight: 600;
  color: #1a1a1a;
  display: block;
`;

const MetaDetails = styled.span`
  color: #595959;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PostHeader = ({ post }) => (
  <ArticleHeader>
    {post.category && (
      <PostCategory href={`/blog/category/${post.category.slug}`}>
        {post.category.name}
      </PostCategory>
    )}
    <ArticleTitle>{post.title}</ArticleTitle>
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
            })}
            <span>·</span>
            <Clock size={14} />
            {post.readTime != null ? `${post.readTime} min read` : "Read"}
          </MetaDetails>
        </AuthorInfo>
      </PostMeta>
    )}
  </ArticleHeader>
);

export default PostHeader;
