"use client";
import React from "react";
import Link from "next/link";
import styled from "styled-components";
import { Clock, Layers, Tag as TagIcon } from "lucide-react";

// --- Styled Components ---
const SidebarContainer = styled.aside`
  position: sticky;
  top: 120px;
  align-self: start;
`;

const SidebarWidget = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
`;

const WidgetTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 1rem;
  border-bottom: 2px solid #e63946;
  padding-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RecentPostItem = styled.div`
  &:not(:last-child) {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e0e0e0;
  }
  a {
    text-decoration: none;
  }
  h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 0.25rem;
    transition: color 0.3s ease;
  }
  span {
    font-size: 0.8rem;
    color: #595959;
  }
  &:hover h4 {
    color: #e63946;
  }
`;

const TagsWidgetContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TagLink = styled(Link)`
  background: #d0d0d0;
  color: #333;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  text-decoration: none;
  transition: all 0.2s ease;
  &:hover {
    background: #e63946;
    color: #fff;
  }
`;

const BlogSidebar = ({
  recentPosts = [],
  currentPostSlug,
  allCategories = [],
  tags = [],
}) => (
  <SidebarContainer>
    {tags.length > 0 && (
      <SidebarWidget>
        <WidgetTitle>
          <TagIcon size={16} /> Tags
        </WidgetTitle>
        <TagsWidgetContainer>
          {tags.map((tag) => (
            <TagLink
              key={tag}
              href={`/blog/tag/${tag.toLowerCase().replace(/ /g, "-")}`}
            >
              {tag}
            </TagLink>
          ))}
        </TagsWidgetContainer>
      </SidebarWidget>
    )}

    {allCategories.length > 0 && (
      <SidebarWidget>
        <WidgetTitle>
          <Layers size={16} /> Categories
        </WidgetTitle>
        {allCategories.map((cat) => (
          <RecentPostItem key={cat.slug}>
            <Link href={`/blog/category/${cat.slug}`}>
              <h4>{cat.name}</h4>
              <span>
                {cat.post_count} {cat.post_count === 1 ? "post" : "posts"}
              </span>
            </Link>
          </RecentPostItem>
        ))}
      </SidebarWidget>
    )}

    {recentPosts.length > 0 && (
      <SidebarWidget>
        <WidgetTitle>
          <Clock size={16} /> Recent Posts
        </WidgetTitle>
        {recentPosts
          .filter((p) => p.slug !== currentPostSlug)
          .slice(0, 3)
          .map((p) => (
            <RecentPostItem key={p.slug}>
              <Link href={`/blog/${p.slug}`}>
                <h4>{p.title}</h4>
                <span>
                  {new Date(p.publishedDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </Link>
            </RecentPostItem>
          ))}
      </SidebarWidget>
    )}
  </SidebarContainer>
);

export default BlogSidebar;
