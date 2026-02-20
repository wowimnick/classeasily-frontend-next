"use client";
import React from "react";
import DOMPurify from "isomorphic-dompurify";
import styled from "styled-components";

const ArticleBodyWrapper = styled.div`
  font-size: 1.125rem;
  line-height: 1.8;
  color: #333;

  h2,
  h3,
  h4 {
    font-weight: 700;
    margin: 2.5rem 0 1.5rem;
    line-height: 1.3;
  }
  h2 {
    font-size: 1.8rem;
  }
  h3 {
    font-size: 1.5rem;
  }
  p {
    margin-bottom: 1.5rem;
  }
  img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 2rem 0;
    loading: lazy;
  }
  blockquote {
    border-left: 4px solid #e63946;
    padding-left: 1.5rem;
    margin: 2rem 0;
    font-style: italic;
    font-size: 1.2rem;
    color: #555;
  }
  ul,
  ol {
    padding-left: 1.5rem;
    margin-bottom: 1.5rem;
  }
  li {
    margin-bottom: 0.5rem;
  }
  a {
    color: #e63946;
    text-decoration: underline;
    font-weight: 500;
  }
`;

const ArticleBody = ({ content }) => {
  if (!content || typeof content !== "string") return null;
  const sanitizedContent = DOMPurify.sanitize(content, {
    ADD_ATTR: ["loading"],
  });

  // Add loading="lazy" to all images in the content
  const contentWithLazyImages = sanitizedContent.replace(
    /<img /g,
    '<img loading="lazy" '
  );

  return (
    <ArticleBodyWrapper
      dangerouslySetInnerHTML={{ __html: contentWithLazyImages }}
    />
  );
};

export default ArticleBody;
