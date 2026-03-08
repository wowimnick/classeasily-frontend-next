"use client";
import styled from "styled-components";
import FeaturedPost from "./FeaturedPost";
import OtherFeaturedList from "./OtherFeaturedList";
import BlogCard from "./BlogCard";
import Link from "next/link";

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #ffffff;
  font-family: var(--font-sans, "Inter", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
`;

const MainContent = styled.main`
  max-width: 1320px;
  margin: 0 auto;
  padding: 3rem 1.5rem 5rem;
  @media (max-width: 768px) {
    padding: 2rem 1rem 4rem;
  }
`;

const FeaturedSection = styled.section`
  display: grid;
  grid-template-columns: 65fr 35fr;
  gap: 40px;
  align-items: start;
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const RecentSection = styled.section`
  margin-top: 72px;
  @media (max-width: 768px) {
    margin-top: 56px;
  }
`;

const RecentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
`;

const RecentTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const AllPostsButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
`;

const RecentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
  @media (max-width: 992px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export default function BlogPageClient({ posts }) {
  const featuredPost = posts?.[0];
  const otherFeatured = posts?.slice(1, 6) ?? [];
  const recentPosts = posts?.slice(6, 9) ?? [];

  return (
    <PageWrapper>
      <MainContent>
        {featuredPost && (
          <FeaturedSection>
            <FeaturedPost post={featuredPost} />
            <aside>
              <OtherFeaturedList posts={otherFeatured} />
            </aside>
          </FeaturedSection>
        )}

        <RecentSection>
          <RecentHeader>
            <RecentTitle>Recent Posts</RecentTitle>
            <AllPostsButton href="/blog">All Posts</AllPostsButton>
          </RecentHeader>
          {recentPosts.length > 0 ? (
            <RecentGrid>
              {recentPosts.map((post, index) => (
                <BlogCard key={post.slug} post={post} index={index} />
              ))}
            </RecentGrid>
          ) : (
            <RecentGrid>
              {(posts?.slice(1, 4) ?? []).map((post, index) => (
                <BlogCard key={post.slug} post={post} index={index} />
              ))}
            </RecentGrid>
          )}
        </RecentSection>
      </MainContent>
    </PageWrapper>
  );
}
