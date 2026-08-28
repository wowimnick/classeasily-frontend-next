"use client";
import React from "react";
import styled from "styled-components";
import { Clock } from "lucide-react";

const ArticleHeader = styled.header`
  margin-bottom: 2rem;
`;

const ArticleTitle = styled.h1`
  font-size: clamp(2.2rem, 5vw, 3rem);
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
  margin: 0 0 1rem;
`;

const PostMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: #000;
`;

const MetaDetails = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PostHeader = ({ post }) => (
  <ArticleHeader>
    <ArticleTitle>{post.title}</ArticleTitle>
    <PostMeta>
      <MetaDetails>
        {new Date(post.publishedDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        <span>·</span>
        <Clock size={14} aria-hidden />
        {post.readTime != null ? `${post.readTime} min read` : "Read"}
      </MetaDetails>
    </PostMeta>
  </ArticleHeader>
);

export default PostHeader;
