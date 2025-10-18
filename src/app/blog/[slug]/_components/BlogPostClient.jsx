"use client";
import { useMemo } from "react";
import styled from "styled-components";
import PostHeader from "./PostHeader";
import ArticleBody from "./ArticleBody";
import BlogSidebar from "./BlogSidebar";

const PostWrapper = styled.div`
  background: #fff;
`;

const PostMainContent = styled.main`
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 1.5rem 5rem;
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 4rem;
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
`;

const ArticleContent = styled.article`
  max-width: 720px;
  @media (max-width: 992px) {
    max-width: 100%;
  }
`;

export default function BlogPostClient({ post, sidebarData }) {
  const processedTags = useMemo(() => {
    if (!post?.tags) return [];
    if (Array.isArray(post.tags)) return post.tags;
    if (typeof post.tags === "string" && post.tags.length > 0) {
      return post.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
    return [];
  }, [post]);

  return (
    <PostWrapper>
      <PostMainContent>
        <ArticleContent>
          <PostHeader post={post} />
          <ArticleBody content={post.content} />
        </ArticleContent>
        <BlogSidebar
          recentPosts={sidebarData.recentPosts}
          allCategories={sidebarData.categories}
          currentPostSlug={post.slug}
          tags={processedTags}
        />
      </PostMainContent>
    </PostWrapper>
  );
}
