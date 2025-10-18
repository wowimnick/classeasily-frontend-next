// --- START OF FILE BusinessHelpArticlePage.jsx (Fixed Navigation) ---

"use client";

import React from "react";
import { redirect } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { helpCenterData } from "@/components/common/_pages/docs/helpCenterData";
import { LordIcon } from "@/services/ReactUtils";
import BusinessHelpCenterLayout from "./BusinessHelpCenterLayout";

const ArticleWrapper = styled(motion.article)`
  background: #ffffff;
  border: 1px solid #e3e8ee;
  border-radius: 6px;
  padding: 2.5rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const ArticleHeader = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f0f4f8;
`;

const ArticleTitle = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #0a2540;
  margin: 0;
  line-height: 1.25;
  letter-spacing: -0.01em;
`;

const ContentArea = styled.div`
  color: #425a72;
  font-size: 0.9375rem;
  line-height: 1.6;

  p {
    margin: 0 0 1.25rem 0;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #0a2540;
    margin: 2rem 0 1rem;
    letter-spacing: -0.01em;

    &:first-child {
      margin-top: 0;
    }
  }

  ul,
  ol {
    margin: 0 0 1.25rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin-bottom: 0.5rem;
    line-height: 1.6;

    &:last-child {
      margin-bottom: 0;
    }
  }

  strong {
    font-weight: 600;
    color: #0a2540;
  }

  blockquote {
    border-left: 3px solid #ffc107;
    background: #fffbf0;
    padding: 1rem 1.25rem;
    margin: 1.5rem 0;
    border-radius: 0 4px 4px 0;
    position: relative;
    p {
      margin: 0;
      padding-left: 2rem;
      color: #92400e;
    }

    strong {
      color: #92400e;
    }
  }
`;

const CategoryLandingPage = styled(motion.div)`
  background: #ffffff;
  border: 1px solid #e3e8ee;
  border-radius: 6px;
  padding: 2.5rem;
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f0f4f8;
`;

const CategoryIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: #f6f9fc;
  border-radius: 8px;
  border: 1px solid #e3e8ee;
`;

const CategoryInfo = styled.div`
  flex: 1;
`;

const CategoryTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  color: #0a2540;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.01em;
`;

const CategoryDescription = styled.p`
  font-size: 1rem;
  color: #6b7c95;
  margin: 0;
`;

const ArticleGrid = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const ArticleListItem = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-radius: 6px;
  text-decoration: none;
  color: #425a72;
  font-weight: 500;
  font-size: 0.9375rem;
  border: 1px solid transparent;
  transition: all 0.15s ease;

  &:hover {
    background: #f6f9fc;
    border-color: #e3e8ee;
    color: #0a2540;
  }
`;

const ArticleArrow = styled(ArrowRight)`
  width: 16px;
  height: 16px;
  color: #8792a2;
  transition: all 0.15s ease;

  ${ArticleListItem}:hover & {
    color: #635bff;
    transform: translateX(2px);
  }
`;

const ArticleRenderer = ({ content = [] }) => {
  return content.map((item, index) => {
    const key = `content-${index}`;
    switch (item.type) {
      case "h3":
        return (
          <motion.h3
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {item.text}
          </motion.h3>
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

const BusinessHelpArticlePage = ({ categorySlug, articleSlug }) => {
  const currentCategorySlug = categorySlug || "getting-started";
  const category = helpCenterData.find((c) => c.slug === currentCategorySlug);

  if (!category) {
    redirect("/business/help?category=getting-started&article=setup-guide");
  }

  const article = articleSlug
    ? category.articles.find((a) => a.slug === articleSlug)
    : null;

  if (articleSlug && !article) {
    redirect(`/business/help?category=${category.slug}`);
  }

  const getIconSrc = (categorySlug) => {
    const iconMap = {
      "getting-started": "https://cdn.lordicon.com/upjgggre.json",
      "classes-and-scheduling": "https://cdn.lordicon.com/abfverha.json",
      finances: "https://cdn.lordicon.com/yycecovd.json",
      "website-integration": "https://cdn.lordicon.com/nqlwocyk.json",
      "team-and-community": "https://cdn.lordicon.com/cniwvohj.json",
      "bookings-and-students": "https://cdn.lordicon.com/meaqueth.json",
      "marketing-and-promotions": "https://cdn.lordicon.com/abgykmtd.json",
    };
    return iconMap[categorySlug] || "https://cdn.lordicon.com/nocovwne.json";
  };

  const getTrigger = (categorySlug) => {
    const triggerMap = {
      "getting-started": "hover",
      "classes-and-scheduling": "hover",
      finances: "click",
      "team-and-community": "hover",
      "bookings-and-students": "hover",
      "marketing-and-promotions": "hover",
    };
    return triggerMap[categorySlug] || "hover";
  };

  const getInState = (categorySlug) => {
    const stateMap = {
      "getting-started": "in-home",
      "classes-and-scheduling": "in-calendar",
      finances: "in-wallet",
      "team-and-community": "in-account",
      "bookings-and-students": "in-compare",
      "marketing-and-promotions": "in-label",
    };
    return stateMap[categorySlug] || "in-reveal";
  };

  if (!article) {
    return (
      <BusinessHelpCenterLayout categorySlug={categorySlug}>
        <CategoryLandingPage
          key={categorySlug} // Add key to force re-animation
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <CategoryHeader>
            <CategoryIconWrapper>
              <LordIcon
                key={category.slug}
                src={getIconSrc(category.slug)}
                size="24px"
                trigger={getTrigger(category.slug)}
                colors="primary:#f23951,secondary:#425a72"
                playOnLoad={true}
                inState={getInState(category.slug)}
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: 0.1 + index * 0.05,
                  ease: "easeOut",
                }}
              >
                <ArticleListItem
                  href={`/business/help?category=${category.slug}&article=${art.slug}`}
                >
                  <span>{art.title}</span>
                  <ArticleArrow />
                </ArticleListItem>
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
      <ArticleWrapper
        key={`${categorySlug}-${articleSlug}`} // Add key to force re-animation
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ArticleHeader>
          <ArticleTitle>{article.title}</ArticleTitle>
        </ArticleHeader>
        <ContentArea>
          <ArticleRenderer content={article.content} />
        </ContentArea>
      </ArticleWrapper>
    </BusinessHelpCenterLayout>
  );
};

export default BusinessHelpArticlePage;
