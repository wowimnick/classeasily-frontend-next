"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Input, AutoComplete } from "antd";
import Link from "next/link";

import { helpCenterData } from "@/components/common/_pages/docs/helpCenterData";
import { ChevronRight, Home, Search } from "lucide-react";
import { LordIcon } from "@/services/ReactUtils";
import FooterClient from "@/components/homepage/FooterClient";
import ExploreHeader from "@/components/explore/ExploreHeader";

// ─── Page Shell ──────────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  background: #ffffff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

// ─── Top Section — uses same 260px | 1fr grid as body ────────────────────────

const TopSection = styled.div`
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 40;
`;

const TopGrid = styled.div`
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 260px 1fr;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`;

const TopLogoCell = styled.div`
  padding: 0.75rem 1.25rem;
  border-right: 1px solid #e2e8f0;
  display: flex;
  align-items: center;

  @media (max-width: 992px) {
    display: none;
  }
`;

const TopLogoLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
`;

const TopNavCell = styled.div`
  padding: 0.75rem 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
`;

const Breadcrumbs = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8125rem;
  color: #94a3b8;
  flex-wrap: wrap;

  a {
    color: #64748b;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    transition: color 0.15s;

    &:hover {
      color: #f83a54;
    }
  }

  span {
    color: #334155;
    font-weight: 500;
  }
`;

const SearchContainer = styled.div`
  flex-shrink: 0;
  width: 340px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const StyledAutoComplete = styled(AutoComplete)`
  width: 100%;

  .ant-input-affix-wrapper {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 6px 14px;
    transition: all 0.2s;

    &:hover,
    &:focus-within {
      background-color: #ffffff;
      border-color: #cbd5e1;
      box-shadow: 0 0 0 3px rgba(248, 58, 84, 0.06);
    }

    input {
      background-color: transparent;
      font-size: 0.875rem;
    }
  }
`;

// ─── Body Layout ─────────────────────────────────────────────────────────────

const ContentGrid = styled.div`
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 260px 1fr;
  align-items: start;
  flex: 1;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`;

// ─── Left Navigation ─────────────────────────────────────────────────────────

const Sidebar = styled(motion.aside)`
  border-right: 1px solid #e2e8f0;
  position: sticky;
  top: 45px;
  height: calc(100vh - 45px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 2px;
  }

  @media (max-width: 992px) {
    position: static;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
`;

const SidebarContent = styled.div`
  padding: 1.75rem 0 3rem;
`;

const SidebarSectionDivider = styled.div`
  height: 1px;
  background: #f1f5f9;
  margin: 0.75rem 0;
`;

const CategorySection = styled.div``;

const CategoryLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.5rem 1.25rem;
  color: #64748b;
  text-decoration: none;
  border-left: 2px solid transparent;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: #0f172a;
    background: #f8fafc;
  }

  ${(props) =>
    props.$active &&
    `
    color: #f83a54;
    font-weight: 700;
    border-left-color: #f83a54;
    background: #fff8f8;
  `}
`;

const CategoryIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
`;

const ArticlesContainer = styled(motion.div)`
  padding-bottom: 0.5rem;
  overflow: hidden;
`;

const ArticleLink = styled(Link)`
  display: block;
  font-size: 0.8rem;
  font-weight: 400;
  padding: 0.35rem 1rem 0.35rem 2.75rem;
  color: #64748b;
  text-decoration: none;
  border-left: 2px solid transparent;
  transition: color 0.15s;
  line-height: 1.45;

  &:hover {
    color: #334155;
  }

  ${(props) =>
    props.$active &&
    `
    color: #f83a54;
    font-weight: 500;
    border-left-color: #f83a54;
  `}
`;

// ─── Main Content ─────────────────────────────────────────────────────────────

const MainContent = styled.main`
  min-width: 0;
  padding: 2.5rem 3rem;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`;

// ─── Search Result Dropdown ───────────────────────────────────────────────────

const SearchResultWrapper = styled.div`
  padding: 0.5rem 0.25rem;
`;

const ResultTitle = styled.div`
  font-weight: 600;
  color: #0f172a;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const ResultPreview = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  white-space: normal;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  strong {
    color: #f83a54;
    font-weight: 600;
  }
`;

const ResultCategory = styled.div`
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
`;

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const getIconSrc = (categorySlug) => {
  const iconMap = {
    "getting-started": "https://cdn.lordicon.com/upjgggre.json",
    "classes-and-scheduling": "https://cdn.lordicon.com/abfverha.json",
    finances: "https://cdn.lordicon.com/yycecovd.json",
    "team-and-community": "https://cdn.lordicon.com/cniwvohj.json",
    "bookings-and-students": "https://cdn.lordicon.com/meaqueth.json",
    "marketing-and-promotions": "https://cdn.lordicon.com/abgykmtd.json",
  };
  return iconMap[categorySlug] || "https://cdn.lordicon.com/nocovwne.json";
};

// ─── Component ────────────────────────────────────────────────────────────────

const BusinessHelpCenterLayout = ({ children, categorySlug, articleSlug }) => {
  const router = useRouter();
  const currentCategory = helpCenterData.find((c) => c.slug === categorySlug);
  const currentArticle = currentCategory?.articles.find(
    (a) => a.slug === articleSlug
  );

  const [searchResults, setSearchResults] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const handleSearchChange = (query) => {
    setInputValue(query);
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    const lowerCaseQuery = query.toLowerCase();
    const results = [];

    helpCenterData.forEach((category) => {
      category.articles.forEach((article) => {
        let matchFound = false;
        let previewText = "";

        if (article.title.toLowerCase().includes(lowerCaseQuery)) {
          matchFound = true;
          previewText = article.content[0]?.text || "Read more about this topic.";
        }

        if (!matchFound) {
          for (const contentItem of article.content) {
            let textToSearch =
              contentItem.type === "ul" || contentItem.type === "ol"
                ? contentItem.items.join(" ")
                : contentItem.text || "";

            const cleanText = textToSearch.replace(/<[^>]*>?/gm, "");
            if (cleanText.toLowerCase().includes(lowerCaseQuery)) {
              matchFound = true;
              const matchIndex = cleanText.toLowerCase().indexOf(lowerCaseQuery);
              const start = Math.max(0, matchIndex - 40);
              const end = Math.min(
                cleanText.length,
                matchIndex + query.length + 60
              );
              const snippet = cleanText.substring(start, end);
              previewText = `${start > 0 ? "..." : ""}${snippet.replace(
                new RegExp(query, "gi"),
                (match) => `<strong>${match}</strong>`
              )}${end < cleanText.length ? "..." : ""}`;
              break;
            }
          }
        }

        if (matchFound) {
          results.push({
            category: category.title,
            article,
            preview: previewText,
            path: `/business/help?category=${category.slug}&article=${article.slug}`,
          });
        }
      });
    });

    setSearchResults(results);
  };

  const onSelectArticle = (path) => {
    router.push(path);
    setInputValue("");
    setSearchResults([]);
  };

  const renderOptions = (results) =>
    results.map((result, index) => ({
      value: result.path,
      key: `${result.path}-${index}`,
      label: (
        <SearchResultWrapper>
          <ResultTitle>{result.article.title}</ResultTitle>
          <ResultPreview
            dangerouslySetInnerHTML={{ __html: result.preview }}
          />
          <ResultCategory>{result.category}</ResultCategory>
        </SearchResultWrapper>
      ),
    }));

  return (
    <>
      <ExploreHeader showOptionsWrapper={false} />
      <PageWrapper>
        {/* Top bar — grid-aligned with sidebar */}
        <TopSection>
          <TopGrid>
            <TopLogoCell>
              <TopLogoLabel>Help Center</TopLogoLabel>
            </TopLogoCell>
            <TopNavCell>
              <Breadcrumbs
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Link href="/business/help">
                  <Home size={14} />
                  Help Center
                </Link>
                {currentCategory && (
                  <>
                    <ChevronRight size={13} />
                    <Link href={`/business/help?category=${categorySlug}`}>
                      {currentCategory.title}
                    </Link>
                  </>
                )}
                {currentArticle && (
                  <>
                    <ChevronRight size={13} />
                    <span>{currentArticle.title}</span>
                  </>
                )}
              </Breadcrumbs>

              <SearchContainer>
                <StyledAutoComplete
                  options={renderOptions(searchResults)}
                  onSearch={handleSearchChange}
                  onSelect={onSelectArticle}
                  value={inputValue}
                  dropdownMatchSelectWidth={350}
                >
                  <Input
                    placeholder="Search articles…"
                    prefix={<Search size={15} color="#94a3b8" />}
                  />
                </StyledAutoComplete>
              </SearchContainer>
            </TopNavCell>
          </TopGrid>
        </TopSection>

        {/* Body */}
        <ContentGrid>
          {/* Left Navigation */}
          <Sidebar
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <SidebarContent>
              {helpCenterData.map((category, idx) => {
                const isActive = category.slug === categorySlug;
                const iconKey = `sidebar-${category.slug}-${isActive}`;

                return (
                  <CategorySection key={category.slug}>
                    {idx > 0 && <SidebarSectionDivider />}
                    <CategoryLink
                      href={`/business/help?category=${category.slug}`}
                      $active={isActive}
                    >
                      <CategoryIcon>
                        <LordIcon
                          key={iconKey}
                          src={getIconSrc(category.slug)}
                          size="18px"
                          trigger="morph"
                          colors={`primary:${isActive ? "#f83a54" : "#64748b"},secondary:${isActive ? "#f83a54" : "#94a3b8"}`}
                          playOnLoad={isActive}
                        />
                      </CategoryIcon>
                      {category.title}
                    </CategoryLink>

                    <AnimatePresence initial={false}>
                      {isActive && (
                        <ArticlesContainer
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                        >
                          {category.articles.map((article) => (
                            <ArticleLink
                              key={article.slug}
                              href={`/business/help?category=${category.slug}&article=${article.slug}`}
                              $active={article.slug === articleSlug}
                            >
                              {article.title}
                            </ArticleLink>
                          ))}
                        </ArticlesContainer>
                      )}
                    </AnimatePresence>
                  </CategorySection>
                );
              })}
            </SidebarContent>
          </Sidebar>

          {/* Main Content */}
          <MainContent>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
            >
              {children}
            </motion.div>
          </MainContent>
        </ContentGrid>
      </PageWrapper>
      <FooterClient />
    </>
  );
};

export default BusinessHelpCenterLayout;
