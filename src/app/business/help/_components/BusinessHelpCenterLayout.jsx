// --- START OF FILE BusinessHelpCenterLayout.jsx ---

"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Input, AutoComplete } from "antd";
import Link from "next/link";

import { helpCenterData } from "@/components/common/_pages/docs/helpCenterData";
import { ChevronRight, Home, Search } from "lucide-react";
import { LordIcon } from "@/services/ReactUtils";
import FooterClient from "@/components/homepage/FooterClient";
import ExploreHeader from "@/components/explore/ExploreHeader";

const PageWrapper = styled.div`
  background: #f8f9fa;
  min-height: 100vh;
`;

const TopSection = styled.div`
  background: #ffffff;
  border-bottom: 1px solid #e3e8ee;
  padding: 1rem 0;
`;

const TopContainer = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    padding: 0 1rem;
    gap: 1rem;
  }
`;

const Breadcrumbs = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
  flex-wrap: wrap;

  a {
    color: #64748b;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: color 0.15s ease;
    font-weight: 500;

    &:hover {
      color: #f83a54;
    }
  }

  span {
    color: #94a3b8;
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  max-width: 500px;
`;

const StyledAutoComplete = styled(AutoComplete)`
  width: 100%;

  .ant-input-affix-wrapper {
    background-color: #f1f5f9;
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 8px 16px;
    transition: all 0.2s ease;

    &:hover, &:focus-within {
      background-color: #ffffff;
      border-color: #f83a54;
      box-shadow: 0 4px 6px -1px rgba(248, 58, 84, 0.05);
    }

    input {
      background-color: transparent;
    }
  }
`;

const ContentContainer = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 2.5rem 2rem;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 3rem;
  align-items: start;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    padding: 1.5rem 1rem;
    gap: 2rem;
  }
`;

const Sidebar = styled(motion.aside)`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  position: sticky;
  top: 100px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);

  @media (max-width: 992px) {
    position: static;
    border: none;
    background: transparent;
    box-shadow: none;
    /* Add slight bottom border/margin to separate from content on mobile */
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
  }
`;

const SidebarContent = styled.div`
  padding: 0.5rem;
`;

const MainContent = styled.main`
  min-width: 0;
`;

const CategorySection = styled.div`
  margin-bottom: 0.25rem;
`;

const CategoryLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
  color: #475569;
  text-decoration: none;
  transition: all 0.15s ease;
  border-radius: 8px;

  &:hover {
    background: #fff0f2;
    color: #f83a54;
  }

  ${(props) =>
    props.$active &&
    `
    background: #fff0f2;
    color: #f83a54;
    
    &:hover {
      background: #ffe0e5;
      color: #d92e45;
    }
  `}
`;

const CategoryIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  opacity: 0.8;

  ${(props) => props.$active && `opacity: 1;`}
`;

const ArticlesContainer = styled(motion.div)`
  margin-left: 1rem;
  margin-top: 0.25rem;
  padding-left: 1rem;
  border-left: 2px solid #e2e8f0;
  margin-bottom: 0.75rem;
`;

const ArticleLink = styled(Link)`
  display: block;
  font-weight: 400;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  color: #64748b;
  text-decoration: none;
  transition: all 0.15s ease;
  border-radius: 6px;
  margin-bottom: 0.125rem;

  &:hover {
    color: #f83a54;
    background: #fff0f2;
  }

  ${(props) =>
    props.$active &&
    `
    color: #f83a54;
    font-weight: 500;
    background: #fff0f2;
  `}
`;

const SearchResultWrapper = styled.div`
  padding: 0.5rem 0.25rem;
`;

const ResultTitle = styled.div`
  font-weight: 600;
  color: #0f172a;
  font-size: 0.9rem;
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
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
`;

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

const BusinessHelpCenterLayout = ({ children, categorySlug, articleSlug }) => {
  const router = useRouter();
  const pathname = usePathname();
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
            let textToSearch = "";
            if (contentItem.type === "ul" || contentItem.type === "ol") {
              textToSearch = contentItem.items.join(" ");
            } else {
              textToSearch = contentItem.text || "";
            }

            const cleanText = textToSearch.replace(/<[^>]*>?/gm, "");
            if (cleanText.toLowerCase().includes(lowerCaseQuery)) {
              matchFound = true;
              const matchIndex = cleanText.toLowerCase().indexOf(lowerCaseQuery);
              const start = Math.max(0, matchIndex - 40);
              const end = Math.min(cleanText.length, matchIndex + query.length + 60);
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
            article: article,
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

  const renderOptions = (results) => {
    return results.map((result, index) => ({
      value: result.path,
      key: `${result.path}-${index}`,
      label: (
        <SearchResultWrapper>
          <ResultTitle>{result.article.title}</ResultTitle>
          <ResultPreview dangerouslySetInnerHTML={{ __html: result.preview }} />
          <ResultCategory>{result.category}</ResultCategory>
        </SearchResultWrapper>
      ),
    }));
  };

  return (
    <>
      <ExploreHeader showOptionsWrapper={false} />
      <PageWrapper>
        <TopSection>
          <TopContainer>
            <Breadcrumbs
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link href="/business/help">
                <Home size={16} />
                Help Center
              </Link>
              {currentCategory && (
                <>
                  <ChevronRight size={14} />
                  <Link href={`/business/help?category=${categorySlug}`}>
                    {currentCategory.title}
                  </Link>
                </>
              )}
              {currentArticle && (
                <>
                  <ChevronRight size={14} />
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
                  size="large" 
                  placeholder="Search articles (e.g. 'payouts', 'create class')..." 
                  prefix={<Search size={18} color="#94a3b8" />}
                />
              </StyledAutoComplete>
            </SearchContainer>
          </TopContainer>
        </TopSection>

        <ContentContainer>
          <Sidebar
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <SidebarContent>
              {helpCenterData.map((category) => {
                const isActive = category.slug === categorySlug;
                const iconKey = `sidebar-${category.slug}-${isActive}`;

                return (
                  <CategorySection key={category.slug}>
                    <CategoryLink
                      href={`/business/help?category=${category.slug}`}
                      $active={isActive}
                    >
                      <CategoryIcon $active={isActive}>
                        <LordIcon
                          key={iconKey}
                          src={getIconSrc(category.slug)}
                          size="20px"
                          trigger="morph"
                          colors={`primary:${isActive ? "#f83a54" : "#64748b"},secondary:${isActive ? "#f83a54" : "#94a3b8"}`}
                          playOnLoad={isActive}
                        />
                      </CategoryIcon>
                      {category.title}
                    </CategoryLink>
                    <AnimatePresence>
                      {isActive && (
                        <ArticlesContainer
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          {category.articles.map((article, index) => (
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

          <MainContent>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {children}
            </motion.div>
          </MainContent>
        </ContentContainer>
      </PageWrapper>
      <FooterClient />
    </>
  );
};

export default BusinessHelpCenterLayout;