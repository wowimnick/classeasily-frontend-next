"use client";
import styled from "styled-components";
import FeaturedPost from "./FeaturedPost";
import BlogCard from "./BlogCard";

const PageWrapper = styled.div`
  min-height: 100vh;
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem 5rem;
  @media (max-width: 768px) {
    padding: 2rem 1rem 4rem;
  }
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
  max-width: 600px;
  margin: 0 auto;
`;

const PostGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2.5rem;
`;

export default function BlogPageClient({ posts }) {
  const featuredPost = posts?.[0];
  const otherPosts = posts?.slice(1);

  return (
    <PageWrapper>
      <MainContent>
        <BlogHeader>
          <BlogTitle>The ClassEasily Blog</BlogTitle>
          <BlogSubtitle>
            Inspiration and insights for our community of learners and
            instructors.
          </BlogSubtitle>
        </BlogHeader>

        {featuredPost && <FeaturedPost post={featuredPost} />}

        {otherPosts?.length > 0 && (
          <PostGrid>
            {otherPosts.map((post, index) => (
              <BlogCard key={post.slug} post={post} index={index + 1} />
            ))}
          </PostGrid>
        )}
      </MainContent>
    </PageWrapper>
  );
}
