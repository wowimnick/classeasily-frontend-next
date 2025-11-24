// --- START OF FILE /src/app/business/help/_components/BusinessHelpArticlePage.jsx ---

"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { redirect } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import { ArrowRight, ThumbsUp, ThumbsDown, FileText } from "lucide-react";
import { message } from "antd";
import Link from "next/link";

import { helpCenterData } from "@/components/common/_pages/docs/helpCenterData";
import { LordIcon } from "@/services/ReactUtils";
import BusinessHelpCenterLayout from "./BusinessHelpCenterLayout";

const ArticleLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 3rem;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const ArticleWrapper = styled(motion.article)`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);

  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 8px;
  }
`;

const ArticleHeader = styled.div`
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #f1f5f9;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
  }
`;

const ArticleTitle = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 1rem 0;
  line-height: 1.2;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const ArticleMeta = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  display: flex;
  gap: 1rem;
`;

const ContentArea = styled.div`
  color: #334155;
  font-size: 1rem;
  line-height: 1.75;

  p {
    margin: 0 0 1.5rem 0;
  }

  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    margin: 2.5rem 0 1rem;
    letter-spacing: -0.01em;
    scroll-margin-top: 120px;

    &:first-child {
      margin-top: 0;
    }

    @media (max-width: 768px) {
      font-size: 1.25rem;
      margin: 2rem 0 0.75rem;
    }
  }
  
  h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin: 1.5rem 0 0.75rem;
  }

  ul,
  ol {
    margin: 0 0 1.5rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin-bottom: 0.5rem;
    position: relative;

    &::marker {
      color: #64748b;
    }
  }

  strong {
    font-weight: 600;
    color: #0f172a;
  }

  code {
    background: #f1f5f9;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.875em;
    color: #0f172a;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    word-break: break-word;
  }

  blockquote {
    background: #fff0f2;
    padding: 1.25rem 1.5rem;
    margin: 2rem 0;
    border-radius: 8px;
    border-left: 4px solid #f83a54;
    
    p {
      margin: 0;
      color: #f83a54;
      font-weight: 500;
    }

    strong {
      color: #f83a54;
    }
  }
  
  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    margin: 1.5rem 0;
  }
`;

const TableOfContents = styled(motion.div)`
  position: sticky;
  top: 120px;
  align-self: start;

  @media (max-width: 1200px) {
    display: none;
  }
`;

const TocTitle = styled.h4`
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 1rem;
`;

const TocList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TocItem = styled.li`
  font-size: 0.875rem;
  
  a {
    color: #64748b;
    text-decoration: none;
    transition: all 0.2s;
    display: block;
    padding-left: 10px;
    border-left: 2px solid transparent;

    &:hover {
      color: #f83a54;
      border-left-color: #f83a54;
    }
    
    &.active {
      color: #f83a54;
      font-weight: 500;
      border-left-color: #f83a54;
    }
  }
`;

const FeedbackSection = styled.div`
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 640px) {
    margin-top: 3rem;
    flex-direction: column;
    align-items: flex-start;
  }
`;

const FeedbackTitle = styled.div`
  font-weight: 500;
  color: #475569;
`;

const FeedbackButtons = styled.div`
  display: flex;
  gap: 1rem;
`;

const FeedbackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.disabled ? "transparent" : "#fff0f2")};
    border-color: ${(props) => (props.disabled ? "#cbd5e1" : "#f83a54")};
    color: ${(props) => (props.disabled ? "#475569" : "#f83a54")};
  }

  ${(props) =>
    props.disabled &&
    `
    opacity: 0.5;
    cursor: not-allowed;
  `}
  
  ${(props) =>
    props.$active &&
    `
    background: #fff0f2;
    border-color: #f83a54;
    color: #f83a54;
  `}
`;

// Category Landing Components
const CategoryLandingPage = styled(motion.div)`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #f1f5f9;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }
`;

const CategoryIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: #fff0f2;
  border-radius: 12px;
  border: 1px solid #ffe0e5;
  flex-shrink: 0;
`;

const CategoryInfo = styled.div`
  flex: 1;
`;

const CategoryTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.75rem 0;
  line-height: 1.1;

  @media (max-width: 640px) {
    font-size: 1.75rem;
  }
`;

const CategoryDescription = styled.p`
  font-size: 1.125rem;
  color: #64748b;
  margin: 0;
  line-height: 1.6;

  @media (max-width: 640px) {
    font-size: 1rem;
  }
`;

const ArticleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ArticleCard = styled(Link)`
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  text-decoration: none;
  background: #ffffff;
  transition: all 0.2s ease;
  height: 100%;

  &:hover {
    border-color: #f83a54;
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(248, 58, 84, 0.05);
    
    h3 {
      color: #f83a54;
    }
  }
`;

const ArticleCardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
  transition: color 0.2s;
`;

const ArticleCardPreview = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1.5rem 0;
  flex-grow: 1;
  line-height: 1.5;
`;

const ReadMore = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #f83a54;
  margin-top: auto;
`;

const ArticleRenderer = ({ content = [] }) => {
  return content.map((item, index) => {
    const key = `content-${index}`;
    switch (item.type) {
      case "h3":
        return (
          <motion.h3
            id={item.text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {item.text}
          </motion.h3>
        );
      case "h4":
        return (
          <motion.h4
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {item.text}
          </motion.h4>
        );
      case "p":
        return (
          <motion.p
            key={key}
            dangerouslySetInnerHTML={{ __html: item.text }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          />
        );
      case "ul":
      case "ol":
        const ListTag = item.type;
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <ListTag>
              {item.items.map((li, i) => (
                <li
                  key={`${key}-${i}`}
                  dangerouslySetInnerHTML={{ __html: li }}
                />
              ))}
            </ListTag>
          </motion.div>
        );
      case "blockquote":
        return (
          <motion.blockquote
            key={key}
            dangerouslySetInnerHTML={{ __html: item.text }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          />
        );
      default:
        return null;
    }
  });
};

const BusinessHelpArticlePage = () => {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category") || "getting-started";
  const articleSlug = searchParams.get("article");

  const category = helpCenterData.find((c) => c.slug === categorySlug);

  const [feedbackState, setFeedbackState] = useState(null);

  useEffect(() => {
    setFeedbackState(null);
  }, [articleSlug]);

  if (!category) {
    redirect("/business/help?category=getting-started&article=setup-guide");
  }

  const article = articleSlug
    ? category.articles.find((a) => a.slug === articleSlug)
    : null;

  if (articleSlug && !article) {
    redirect(`/business/help?category=${category.slug}`);
  }

  const [toc, setToc] = useState([]);
  
  useEffect(() => {
    if (article) {
      const headers = article.content
        .filter(item => item.type === 'h3')
        .map(item => ({
          id: item.text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
          text: item.text
        }));
      setToc(headers);
    }
  }, [article]);

  const handleFeedback = (isHelpful) => {
    if (feedbackState !== null) return;

    if (isHelpful) {
      setFeedbackState('yes');
      message.success("Thanks for your feedback!");
    } else {
      setFeedbackState('no');
      message.success("Thanks for your feedback! We will work to improve this article.");
    }
  };

  const getIconSrc = (categorySlug) => {
    const iconMap = {
      "getting-started": "https://cdn.lordicon.com/upjgggre.json",
      "classes-and-scheduling": "https://cdn.lordicon.com/abfverha.json",
      "finances": "https://cdn.lordicon.com/yycecovd.json",
      "team-and-community": "https://cdn.lordicon.com/cniwvohj.json",
      "bookings-and-students": "https://cdn.lordicon.com/meaqueth.json",
      "marketing-and-promotions": "https://cdn.lordicon.com/abgykmtd.json",
    };
    return iconMap[categorySlug] || "https://cdn.lordicon.com/nocovwne.json";
  };

  if (!article) {
    return (
      <BusinessHelpCenterLayout categorySlug={categorySlug}>
        <CategoryLandingPage
          key={categorySlug}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <CategoryHeader>
            <CategoryIconWrapper>
              <LordIcon
                key={category.slug}
                src={getIconSrc(category.slug)}
                size="32px"
                trigger="hover"
                colors="primary:#f83a54,secondary:#64748b"
                playOnLoad={true}
              />
            </CategoryIconWrapper>
            <CategoryInfo>
              <CategoryTitle>{category.title}</CategoryTitle>
              <CategoryDescription>{category.description}</CategoryDescription>
            </CategoryInfo>
          </CategoryHeader>
          <ArticleGrid>
            {category.articles.map((art, index) => (
              <motion.div
                key={art.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
              >
                <ArticleCard
                  href={`/business/help?category=${category.slug}&article=${art.slug}`}
                >
                  <ArticleCardTitle>{art.title}</ArticleCardTitle>
                  <ArticleCardPreview>
                    {art.content.find(c => c.type === 'p')?.text.replace(/<[^>]*>/g, '').substring(0, 80)}...
                  </ArticleCardPreview>
                  <ReadMore>
                    Read article <ArrowRight size={16} />
                  </ReadMore>
                </ArticleCard>
              </motion.div>
            ))}
          </ArticleGrid>
        </CategoryLandingPage>
      </BusinessHelpCenterLayout>
    );
  }

  return (
    <BusinessHelpCenterLayout
      categorySlug={categorySlug}
      articleSlug={articleSlug}
    >
      <ArticleLayout>
        <ArticleWrapper
          key={`${categorySlug}-${articleSlug}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ArticleHeader>
            <ArticleTitle>{article.title}</ArticleTitle>
            <ArticleMeta>
              <span><FileText size={14} style={{marginRight: 6, verticalAlign: 'middle'}}/>{Math.ceil(JSON.stringify(article.content).length / 1000)} min read</span>
            </ArticleMeta>
          </ArticleHeader>
          
          <ContentArea>
            <ArticleRenderer content={article.content} />
          </ContentArea>

          <FeedbackSection>
            <FeedbackTitle>Was this article helpful?</FeedbackTitle>
            <FeedbackButtons>
              <FeedbackButton 
                onClick={() => handleFeedback(true)} 
                disabled={feedbackState !== null}
                $active={feedbackState === 'yes'}
              >
                <ThumbsUp size={16} /> Yes
              </FeedbackButton>
              <FeedbackButton 
                onClick={() => handleFeedback(false)} 
                disabled={feedbackState !== null}
                $active={feedbackState === 'no'}
              >
                <ThumbsDown size={16} /> No
              </FeedbackButton>
            </FeedbackButtons>
          </FeedbackSection>
        </ArticleWrapper>

        {toc.length > 0 && (
          <TableOfContents
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <TocTitle>On this page</TocTitle>
            <TocList>
              {toc.map((item) => (
                <TocItem key={item.id}>
                  <a 
                    href={`#${item.id}`} 
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {item.text}
                  </a>
                </TocItem>
              ))}
            </TocList>
          </TableOfContents>
        )}
      </ArticleLayout>
    </BusinessHelpCenterLayout>
  );
};

export default BusinessHelpArticlePage;