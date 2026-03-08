"use client";
import React from "react";
import Link from "next/link";
import styled from "styled-components";
import { Clock } from "lucide-react";

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
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RecentPostItem = styled.div`
  &:not(:last-child) {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  a {
    text-decoration: none;
  }
  h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.25rem;
    transition: color 0.3s ease;
  }
  span {
    font-size: 0.8rem;
    color: #6b7280;
  }
  &:hover h4 {
    color: #4b5563;
  }
`;

const BlogSidebar = ({ recentPosts = [], currentPostSlug }) => (
  <SidebarContainer>
    {recentPosts.length > 0 && (
      <SidebarWidget>
        <WidgetTitle>
          <Clock size={16} aria-hidden /> Recent Posts
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
