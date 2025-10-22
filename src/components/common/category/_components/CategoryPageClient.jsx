"use client";
import styled from "styled-components";
import BlogCard from "../../_components/BlogCard";

const PageWrapper = styled.div`
  min-height: 100vh;
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem 5rem;
`;

const BlogHeader = styled.header`
  text-align: center;
  margin-bottom: 4rem;
`;

const BlogTitle = styled.h1`
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 1rem;
`;

const BlogSubtitle = styled.p`
  font-size: 1.25rem;
  color: #555;
`;

const PostGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2.5rem;
`;

export default function CategoryPageClient({ posts, category }) {
  const pageTitle = category ? `Category: ${category.name}` : "Category";
  const pageSubtitle = `Exploring all posts in the "${
    category?.name || "this"
  }" category.`;

  return (
    <PageWrapper>
      <MainContent>
        <BlogHeader>
          <BlogTitle>{pageTitle}</BlogTitle>
          <BlogSubtitle>{pageSubtitle}</BlogSubtitle>
        </BlogHeader>

        {posts.length > 0 ? (
          <PostGrid>
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </PostGrid>
        ) : (
          <p>No posts found in this category.</p>
        )}
      </MainContent>
    </PageWrapper>
  );
}
