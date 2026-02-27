"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
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

// ─── Article Page Layout ──────────────────────────────────────────────────────

const ArticleLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 4rem;
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

// ─── Article Content (no card) ────────────────────────────────────────────────

const ArticleContent = styled(motion.article)`
  min-width: 0;
  max-width: 720px;
`;

const ArticleHeader = styled.div`
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #f1f5f9;
`;

const ArticleBreadcrumbs = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 1rem;
  flex-wrap: wrap;

  a {
    color: #94a3b8;
    text-decoration: none;
    transition: color 0.15s;

    &:hover {
      color: #64748b;
    }
  }

  span {
    color: #64748b;
    font-weight: 500;
  }
`;

const BreadcrumbSep = styled.span`
  color: #cbd5e1;
  user-select: none;
`;

const ArticleTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.875rem 0;
  line-height: 1.2;
  letter-spacing: -0.025em;

  @media (max-width: 768px) {
    font-size: 1.625rem;
  }
`;

const ArticleSubtitle = styled.p`
  font-size: 1.0625rem;
  color: #64748b;
  margin: 0 0 1.25rem 0;
  line-height: 1.6;
  font-weight: 400;
`;

const ArticleMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #94a3b8;
`;

// ─── Content Body ─────────────────────────────────────────────────────────────

const ContentArea = styled.div`
  color: #334155;
  font-size: 1rem;
  line-height: 1.75;

  p {
    margin: 0 0 1.375rem 0;
  }

  h3 {
    font-size: 1.3125rem;
    font-weight: 700;
    color: #0f172a;
    margin: 2.75rem 0 0.875rem;
    letter-spacing: -0.015em;
    scroll-margin-top: 110px;

    &:first-child {
      margin-top: 0;
    }

    @media (max-width: 768px) {
      font-size: 1.125rem;
      margin: 2rem 0 0.75rem;
    }
  }

  h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 1.5rem 0 0.625rem;
    scroll-margin-top: 110px;
  }

  ul,
  ol {
    margin: 0 0 1.375rem 0;
    padding-left: 1.375rem;
  }

  li {
    margin-bottom: 0.4rem;

    &::marker {
      color: #94a3b8;
    }
  }

  strong {
    font-weight: 600;
    color: #0f172a;
  }

  /* Inline code pill */
  code {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    font-size: 0.84em;
    color: #1e293b;
    font-family: "Menlo", "Monaco", "Courier New", monospace;
    word-break: break-word;
  }

  blockquote {
    background: #fff0f2;
    padding: 1rem 1.25rem;
    margin: 1.75rem 0;
    border-radius: 6px;
    border-left: 3px solid #f83a54;

    p {
      margin: 0;
      color: #be123c;
      font-weight: 500;
      font-size: 0.9375rem;
    }

    strong {
      color: #be123c;
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

// ─── Feedback ─────────────────────────────────────────────────────────────────

const FeedbackSection = styled.div`
  margin-top: 3.5rem;
  padding-top: 1.75rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const FeedbackTitle = styled.div`
  font-size: 0.9375rem;
  font-weight: 500;
  color: #475569;
`;

const FeedbackButtons = styled.div`
  display: flex;
  gap: 0.625rem;
`;

const FeedbackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: transparent;
  border: 1px solid #e2e8f0;
  padding: 0.4rem 0.875rem;
  border-radius: 6px;
  color: #64748b;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${(props) => (props.disabled ? "transparent" : "#fff0f2")};
    border-color: ${(props) => (props.disabled ? "#e2e8f0" : "#f83a54")};
    color: ${(props) => (props.disabled ? "#64748b" : "#f83a54")};
  }

  ${(props) =>
    props.disabled &&
    `
    opacity: 0.45;
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

// ─── Table of Contents ────────────────────────────────────────────────────────

const TableOfContents = styled(motion.div)`
  position: sticky;
  top: 110px;
  align-self: start;

  @media (max-width: 1200px) {
    display: none;
  }
`;

const TocTitle = styled.h4`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #94a3b8;
  margin: 0 0 0.875rem 0;
`;

const TocList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const TocItem = styled.li`
  a {
    display: block;
    font-size: 0.8125rem;
    color: #64748b;
    text-decoration: none;
    padding: 0.3rem 0 0.3rem 0.75rem;
    border-left: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
    line-height: 1.4;

    &:hover {
      color: #0f172a;
      border-left-color: #cbd5e1;
    }

    &.active {
      color: #0f172a;
      font-weight: 600;
      border-left-color: #0f172a;
    }
  }
`;

// ─── Category Landing ─────────────────────────────────────────────────────────

const CategoryLandingPage = styled(motion.div)``;

const CategoryHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  margin-bottom: 2rem;
  padding-bottom: 1.75rem;
  border-bottom: 1px solid #f1f5f9;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.875rem;
  }
`;

const CategoryIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background: #fff0f2;
  border-radius: 10px;
  border: 1px solid #ffe0e5;
  flex-shrink: 0;
`;

const CategoryInfo = styled.div`
  flex: 1;
`;

const CategoryTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
  line-height: 1.15;
  letter-spacing: -0.02em;
`;

const CategoryDescription = styled.p`
  font-size: 1rem;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
`;

const ArticleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ArticleCard = styled(Link)`
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1.375rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-decoration: none;
  background: #ffffff;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;

  &:hover {
    border-color: #f83a54;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px -4px rgba(248, 58, 84, 0.08);

    h3 {
      color: #f83a54;
    }
  }
`;

const ArticleCardTitle = styled.h3`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
  transition: color 0.15s;
  line-height: 1.35;
`;

const ArticleCardPreview = styled.p`
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0 0 1.25rem 0;
  flex-grow: 1;
  line-height: 1.5;
`;

const ReadMore = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #f83a54;
  margin-top: auto;
`;

// ─── Article Renderer ─────────────────────────────────────────────────────────

const ArticleRenderer = ({ content = [] }) =>
  content.map((item, index) => {
    const key = `content-${index}`;
    switch (item.type) {
      case "h3":
        return (
          <motion.h3
            id={item.text
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w-]/g, "")}
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
          >
            {item.text}
          </motion.h3>
        );
      case "h4":
        return (
          <motion.h4
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
          >
            {item.text}
          </motion.h4>
        );
      case "p":
        return (
          <motion.p
            key={key}
            dangerouslySetInnerHTML={{ __html: item.text }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
          />
        );
      case "ul":
      case "ol": {
        const ListTag = item.type;
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
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
      }
      case "blockquote":
        return (
          <motion.blockquote
            key={key}
            dangerouslySetInnerHTML={{ __html: item.text }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
          />
        );
      default:
        return null;
    }
  });

// ─── Category Icon Map ────────────────────────────────────────────────────────

const getIconSrc = (slug) => {
  const map = {
    "getting-started": "https://cdn.lordicon.com/upjgggre.json",
    "classes-and-scheduling": "https://cdn.lordicon.com/abfverha.json",
    finances: "https://cdn.lordicon.com/yycecovd.json",
    "team-and-community": "https://cdn.lordicon.com/cniwvohj.json",
    "bookings-and-students": "https://cdn.lordicon.com/meaqueth.json",
    "marketing-and-promotions": "https://cdn.lordicon.com/abgykmtd.json",
  };
  return map[slug] || "https://cdn.lordicon.com/nocovwne.json";
};

// ─── Main Component ───────────────────────────────────────────────────────────

const BusinessHelpArticlePage = () => {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category") || "getting-started";
  const articleSlug = searchParams.get("article");

  const category = helpCenterData.find((c) => c.slug === categorySlug);
  const [feedbackState, setFeedbackState] = useState(null);
  const [toc, setToc] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const observerRef = useRef(null);

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

  // Build TOC from h3 headings
  useEffect(() => {
    if (article) {
      const headers = article.content
        .filter((item) => item.type === "h3")
        .map((item) => ({
          id: item.text
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]/g, ""),
          text: item.text,
        }));
      setToc(headers);
      setActiveId(headers[0]?.id || null);
    }
  }, [article]);

  // Intersection Observer for active TOC item
  useEffect(() => {
    if (!toc.length) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Pick the topmost visible heading
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [toc]);

  const handleFeedback = (isHelpful) => {
    if (feedbackState !== null) return;
    if (isHelpful) {
      setFeedbackState("yes");
      message.success("Thanks for your feedback!");
    } else {
      setFeedbackState("no");
      message.success(
        "Thanks for your feedback! We'll work to improve this article."
      );
    }
  };

  // ─── Category Landing ───────────────────────────────────────────────────────

  if (!article) {
    return (
      <BusinessHelpCenterLayout categorySlug={categorySlug}>
        <CategoryLandingPage
          key={categorySlug}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CategoryHeader>
            <CategoryIconWrapper>
              <LordIcon
                key={category.slug}
                src={getIconSrc(category.slug)}
                size="28px"
                trigger="hover"
                colors="primary:#f83a54,secondary:#64748b"
                playOnLoad
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
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
              >
                <ArticleCard
                  href={`/business/help?category=${category.slug}&article=${art.slug}`}
                >
                  <ArticleCardTitle>{art.title}</ArticleCardTitle>
                  <ArticleCardPreview>
                    {art.content
                      .find((c) => c.type === "p")
                      ?.text.replace(/<[^>]*>/g, "")
                      .substring(0, 90)}
                    …
                  </ArticleCardPreview>
                  <ReadMore>
                    Read article <ArrowRight size={14} />
                  </ReadMore>
                </ArticleCard>
              </motion.div>
            ))}
          </ArticleGrid>
        </CategoryLandingPage>
      </BusinessHelpCenterLayout>
    );
  }

  // ─── Article View ───────────────────────────────────────────────────────────

  // Extract subtitle from first paragraph
  const subtitleRaw = article.content
    .find((c) => c.type === "p")
    ?.text.replace(/<[^>]*>/g, "");
  const subtitle =
    subtitleRaw && subtitleRaw.length > 140
      ? subtitleRaw.substring(0, 140) + "…"
      : subtitleRaw;

  const readTime = Math.ceil(JSON.stringify(article.content).length / 1000);

  return (
    <BusinessHelpCenterLayout
      categorySlug={categorySlug}
      articleSlug={articleSlug}
    >
      <ArticleLayout>
        {/* Article */}
        <ArticleContent
          key={`${categorySlug}-${articleSlug}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ArticleHeader>
            {/* In-article breadcrumbs */}
            <ArticleBreadcrumbs>
              <Link href="/business/help">Help Center</Link>
              <BreadcrumbSep>/</BreadcrumbSep>
              <Link href={`/business/help?category=${categorySlug}`}>
                {category.title}
              </Link>
              <BreadcrumbSep>/</BreadcrumbSep>
              <span>{article.title}</span>
            </ArticleBreadcrumbs>

            <ArticleTitle>{article.title}</ArticleTitle>

            {subtitle && <ArticleSubtitle>{subtitle}</ArticleSubtitle>}

            <ArticleMeta>
              <FileText size={13} />
              {readTime} min read
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
                $active={feedbackState === "yes"}
              >
                <ThumbsUp size={14} /> Yes
              </FeedbackButton>
              <FeedbackButton
                onClick={() => handleFeedback(false)}
                disabled={feedbackState !== null}
                $active={feedbackState === "no"}
              >
                <ThumbsDown size={14} /> No
              </FeedbackButton>
            </FeedbackButtons>
          </FeedbackSection>
        </ArticleContent>

        {/* Right — On This Page */}
        {toc.length > 0 && (
          <TableOfContents
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <TocTitle>On this page</TocTitle>
            <TocList>
              {toc.map((item) => (
                <TocItem key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={activeId === item.id ? "active" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      document
                        .getElementById(item.id)
                        ?.scrollIntoView({ behavior: "smooth" });
                      setActiveId(item.id);
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
