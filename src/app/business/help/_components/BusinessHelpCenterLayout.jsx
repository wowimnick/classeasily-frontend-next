// --- START OF FILE BusinessHelpCenterLayout.jsx (Corrected URLs) ---

"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Input, AutoComplete } from "antd";
import Link from "next/link";

import { helpCenterData } from "@/components/common/_pages/docs/helpCenterData";
import { ChevronRight, Home } from "lucide-react";
import { LordIcon } from "@/services/ReactUtils";
import Header from "@/components/header/Header";
import Footer from "@/components/homepage/Footer";
import ExploreHeader from "@/components/explore/ExploreHeader";

const PageWrapper = styled.div`
  background: #fafbfc;
  min-height: 90vh;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  gap: 2.5rem;

  @media (max-width: 992px) {
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem 1rem;
  }
`;

const Sidebar = styled(motion.aside)`
  flex: 0 0 260px;
  background: #ffffff;
  border: 1px solid #e3e8ee;
  border-radius: 6px;
  align-self: flex-start;
  position: sticky;
  top: 90px;
  overflow: hidden;

  @media (max-width: 992px) {
    position: static;
    flex-basis: auto;
    width: 100%;
  }
`;

const SidebarContent = styled.div`
  padding: 0.5rem 0;
`;

const MainContent = styled.main`
  flex: 1;
  min-width: 0;
`;

const CategorySection = styled.div`
  border-bottom: 1px solid #f0f4f8;

  &:last-child {
    border-bottom: none;
  }
`;

const CategoryLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  font-size: 0.875rem;
  padding: 0.75rem 1rem;
  color: #425a72;
  text-decoration: none;
  transition: all 0.15s ease;
  position: relative;

  &:hover {
    background: #f6f9fc;
    color: #0a2540;
  }

  ${(props) =>
    props.$active &&
    `
    background: #f6f9fc;
    color: #f23951;
    font-weight: 600;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #f23951;
    }
  `}
`;

const CategoryIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  opacity: 0.7;

  ${CategoryLink}:hover &, ${(props) => props.$active && `opacity: 1;`}
`;

const ArticlesContainer = styled(motion.div)`
  background: #f6f9fc;
  border-top: 1px solid #e3e8ee;
`;

const ArticleLink = styled(Link)`
  display: block;
  font-weight: 400;
  font-size: 0.8125rem;
  padding: 0.625rem 1rem 0.625rem 2.75rem;
  color: #6b7c95;
  text-decoration: none;
  transition: all 0.15s ease;
  position: relative;

  &:hover {
    color: #425a72;
    background: rgba(255, 255, 255, 0.5);
  }

  ${(props) =>
    props.$active &&
    `
    color: #f23951;
    font-weight: 500;
    background: rgba(255, 255, 255, 0.8);

    &::before {
      content: "";
      position: absolute;
      left: 2.25rem;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #f23951;
    }
  `}
`;

const Breadcrumbs = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-size: 0.8125rem;
  color: #6b7c95;

  a {
    color: #6b7c95;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: color 0.15s ease;

    &:hover {
      color: #425a72;
    }
  }
`;

const StyledAutoComplete = styled(AutoComplete)`
  width: 100%;
  margin-bottom: 2rem;

  .ant-input,
  .ant-input-lg {
    border-radius: 6px !important;
  }
`;

const SearchResultWrapper = styled.div`
  padding: 0.5rem 0.25rem;
`;

const ResultTitle = styled.div`
  font-weight: 500;
  color: #0a2540;
  font-size: 0.9rem;
`;

const ResultPreview = styled.div`
  font-size: 0.8rem;
  color: #6b7c95;
  white-space: normal;
  line-height: 1.4;
`;

const ResultCategory = styled.div`
  font-size: 0.75rem;
  color: #8792a2;
  margin-top: 0.25rem;
`;

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
    "bookings-and-students": "in-book",
    "marketing-and-promotions": "in-label",
  };
  return stateMap[categorySlug] || "in-reveal";
};

const BusinessHelpCenterLayout = ({ children, categorySlug, articleSlug }) => {
  const router = useRouter();
  const pathname = usePathname();
  const currentCategory = helpCenterData.find((c) => c.slug === categorySlug);

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
          previewText = article.title.replace(
            new RegExp(query, "gi"),
            (match) => `<strong>${match}</strong>`
          );
        }

        for (const contentItem of article.content) {
          if (matchFound && previewText) break;

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
        <Container>
          <Sidebar
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
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
                          size="16px"
                          trigger={getTrigger(category.slug)}
                          colors="primary:#425a72,secondary:#f23951"
                          playOnLoad={true}
                          inState={getInState(category.slug)}
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
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          {category.articles.map((article, index) => (
                            <motion.div
                              key={article.slug}
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.15,
                                delay: index * 0.05,
                                ease: "easeOut",
                              }}
                            >
                              <ArticleLink
                                href={`/business/help?category=${category.slug}&article=${article.slug}`}
                                $active={article.slug === articleSlug}
                              >
                                {article.title}
                              </ArticleLink>
                            </motion.div>
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
            <StyledAutoComplete
              options={renderOptions(searchResults)}
              onSearch={handleSearchChange}
              onSelect={onSelectArticle}
              value={inputValue}
              dropdownMatchSelectWidth={false}
            >
              <Input size="large" placeholder="Search the help center..." />
            </StyledAutoComplete>

            <Breadcrumbs
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Link href="/business/help">
                <Home size={14} />
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
            </Breadcrumbs>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {children}
            </motion.div>
          </MainContent>
        </Container>
      </PageWrapper>
      <Footer />
    </>
  );
};

export default BusinessHelpCenterLayout;
