"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  memo,
  Suspense,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Filter,
  ChevronRight,
  ChevronLeft,
  Map as MapIcon,
  Settings2,
} from "lucide-react";
import ReactGA from "react-ga4";
import FilterModal from "./FilterModal";
import styled from "styled-components";
import { Layers } from "lucide-react";

// Icon loading logic stays the same
const IconFallback = (props) => (
  <div {...props} style={{ width: 22, height: 22, ...props.style }} />
);

const loadIcon = (iconName) => {
  return lazy(() =>
    import("lucide-react").then((module) => {
      return { default: module[iconName] || Layers };
    })
  );
};

const CategoryIcon = memo(({ iconName, ...props }) => {
  const IconComponent = loadIcon(iconName);
  return (
    <Suspense fallback={<IconFallback {...props} />}>
      <IconComponent {...props} />
    </Suspense>
  );
});

const CategoriesWrapper = styled.div`
  display: flex;
  position: sticky;
  flex-direction: column;
  background-color: #fff;
  width: 100%;
  z-index: 100;
  top: 0;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0px 8px 17px 5px rgb(0 0 0 / 2%);
`;
const Categories = styled.div`
  display: flex;
  position: relative;
  flex-direction: row;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  gap: 0.5rem;
  padding: 1rem 1.5rem 0rem 1.5rem;
  align-items: center;
  background: #ffffff;
  &::-webkit-scrollbar {
    display: none;
  }
  @media (max-width: 767px) {
    padding: 0.75rem 1rem;
    gap: 0.75rem;
  }
`;
const SubCategories = styled.div`
  display: flex;
  position: relative;
  flex-direction: row;
  padding: 0.5rem 1.5rem;
  gap: 0.75rem;
  width: 100%;
  overflow-x: ${({ $shouldScroll }) => ($shouldScroll ? "auto" : "hidden")};
  scrollbar-width: none;
  -ms-overflow-style: none;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  max-height: ${({ isVisible }) => (isVisible ? "100px" : "0")};
  transition: opacity 300ms ease-out, max-height 300ms ease-out;
  border-top: 1px solid #f0f0f0;
  &::-webkit-scrollbar {
    display: none;
  }
  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    gap: 0.5rem;
  }
`;
const CategoryGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
  cursor: ${({ isSelected }) => (isSelected ? "default" : "pointer")};
  flex-shrink: 0;
  border-bottom: 3px solid transparent;
  border-bottom-color: ${({ isSelected }) =>
    isSelected ? "#ff385c" : "transparent"};
  width: 80px;
  min-height: 48px;
  padding: 8px 4px;

  @media (max-width: 768px) {
    padding: 0.25rem;
    gap: 0.25rem;
    width: 75px;
    min-height: 48px;
  }
`;
const CategoryFont = styled.p`
  font-size: 12px;
  font-weight: ${({ isSelected }) => (isSelected ? "500" : "500")};
  color: ${({ isSelected }) => (isSelected ? "#ff385c" : "#484848")};
  margin: 0;
  transition: all 0.2s ease;
  text-align: center;
  line-height: 1;
  min-height: 2.2em;
  display: flex;
  align-items: center;
  justify-content: center;
  @media (max-width: 768px) {
    font-size: 11px;
  }
`;
const SubCategoryGroup = styled.div`
  display: flex;
  background-color: ${({ isSelected }) => (isSelected ? "#ffebee" : "#f5f5f5")};
  color: ${({ isSelected }) => (isSelected ? "#ff385c" : "#595959")};
  white-space: nowrap;
  border-radius: 20px;
  padding: 0.5rem 1rem;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid ${({ isSelected }) => (isSelected ? "#ffb2b2" : "#e0e0e0")};
  &:hover {
    background-color: ${({ isSelected }) =>
      isSelected ? "#ffebee" : "#efefef"};
    border-color: ${({ isSelected }) => (isSelected ? "#ffb2b2" : "#bdbdbd")};
  }
  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 12px;
  }
`;
const ScrollWrapper = styled.div`
  display: flex;
  position: relative;
  flex-direction: row;
  align-items: center;
  width: 100%;
  background: #ffffff;

  /* CHANGED: Only show fade gradients when scroll buttons are visible AND content is scrollable */
  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    width: 80px;
    z-index: 1;
    pointer-events: none;
    opacity: 0;
    transition: opacity 300ms ease-in-out;
  }

  /* Show left fade only when not at start */
  &::before {
    left: 0;
    background: linear-gradient(to right, #ffffff 45%, rgba(255, 255, 255, 0));
    opacity: ${({ $showLeftFade }) => ($showLeftFade ? 1 : 0)};
  }

  /* Show right fade only when not at end */
  &::after {
    right: 0;
    background: linear-gradient(to left, #ffffff 45%, rgba(255, 255, 255, 0));
    opacity: ${({ $showRightFade }) => ($showRightFade ? 1 : 0)};
  }
`;
const ScrollButton = styled.button`
  position: absolute;
  /* CHANGED: Use display none instead of hiding with opacity */
  display: ${({ $show }) => ($show ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
  border: 1px solid #eee;
  border-radius: 50%;
  cursor: pointer;
  z-index: 2;
  transition: background-color 0.2s ease;
  color: #595959;

  &:hover {
    background-color: #fff;
    color: #ff385c;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;
const PrevButton = styled(ScrollButton)`
  left: 0.5rem;
`;
const NextButton = styled(ScrollButton)`
  right: 0.5rem;
`;
const ImageBackground = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: ${({ isSelected }) =>
    isSelected
      ? "linear-gradient(135deg, #ff7171 0%, #ff5252 100%)"
      : "#f5f5f5"};
  transition: all 0.2s ease;
  margin-bottom: 4px;
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    svg {
      width: 18px;
      height: 18px;
    }
  }
  svg {
    width: 22px;
    height: 22px;
    color: ${({ isSelected }) => (isSelected ? "#fff" : "#595959")};
    transition: color 0.2s ease;
  }
  ${CategoryGroup}:hover & {
    background: ${({ isSelected }) =>
      isSelected
        ? "linear-gradient(135deg, #ff7171 0%, #ff5252 100%)"
        : "#eeeeee"};
  }
`;
const TopSection = styled.div`
  display: flex;
  align-items: stretch;
  background: #ffffff;
  position: relative;
`;
const CategoriesScrollArea = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: stretch;
`;
const ScrollFilterWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  flex-shrink: 0;
  gap: 12px;
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;
const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 24px;
  background: #ffffff;
  box-shadow: 0px 8px 11px 0px rgba(0, 0, 0, 0.06);
  border: 1px solid #dddddd;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 500;
  color: #222222;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: #f7f7f7;
    border-color: #c2c2c2;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  @media (max-width: 768px) {
    height: 40px;
    padding: 0 12px;
    font-size: 13px;
    span {
      display: none;
    }
  }
`;
const ShowMapButton = styled(FilterButton)`
  @media (max-width: 1048px) {
    display: none;
  }
`;

const SUBCATEGORY_CACHE_KEY = "subcategory_master_list";
const getCachedMap = () => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const cachedData = sessionStorage.getItem(SUBCATEGORY_CACHE_KEY);
    return cachedData ? JSON.parse(cachedData) : {};
  } catch (e) {
    console.error("Could not read subcategory cache", e);
    return {};
  }
};

const setCachedMap = (map) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(SUBCATEGORY_CACHE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Could not write to subcategory cache", e);
  }
};

const CategoryItem = memo(({ category, isSelected, onClick }) => (
  <CategoryGroup onClick={onClick} isSelected={isSelected}>
    <ImageBackground isSelected={isSelected}>
      <CategoryIcon iconName={category.icon_name} />
    </ImageBackground>
    <CategoryFont isSelected={isSelected}>{category.name}</CategoryFont>
  </CategoryGroup>
));

function ExploreCategoriesContent({
  categories = [],
  onCategoryChange,
  classes = [],
  filters,
  onFiltersChange,
  currentCategory,
  currentSubcategory,
  currentSortBy,
  onApplyModalChanges,
  isFilterModalOpen,
  setIsFilterModalOpen,
  isMapVisible,
  onShowMap,
}) {
  // --- OPTIMISTIC UI STATE ---
  const [optimisticCategory, setOptimisticCategory] = useState(currentCategory);
  const [optimisticSubcategory, setOptimisticSubcategory] =
    useState(currentSubcategory);

  useEffect(() => {
    setOptimisticCategory(currentCategory);
    setOptimisticSubcategory(currentSubcategory);
  }, [currentCategory, currentSubcategory]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const subcatWrapperRef = useRef(null);
  const categoriesRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [categoryScrollPosition, setCategoryScrollPosition] = useState(0);
  const [isSubcategoriesVisible, setIsSubcategoriesVisible] = useState(false);
  const [shouldShowScrollButtons, setShouldShowScrollButtons] = useState(false);
  const [showCategoryScrollButtons, setShowCategoryScrollButtons] =
    useState(false);

  // CHANGED: Add new state for tracking scroll boundaries
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollCategoryLeft, setCanScrollCategoryLeft] = useState(false);
  const [canScrollCategoryRight, setCanScrollCategoryRight] = useState(false);

  const [masterSubcategoryMap, setMasterSubcategoryMap] =
    useState(getCachedMap);
  const [displayedSubcategories, setDisplayedSubcategories] = useState([]);

  const dynamicCategoryConfig = useMemo(() => {
    const allCategory = { key: "all", icon_name: "Layers", name: "All" };
    return [allCategory, ...categories];
  }, [categories]);

  const subcategoriesFromClasses = useMemo(() => {
    const subcategoryMap = {};
    classes.forEach((classItem) => {
      const categoryKey = classItem.category_key;
      const subcategoryKey = classItem.subcategory_key;
      const subcategoryName = classItem.subcategory_name;
      if (categoryKey) {
        if (!subcategoryMap[categoryKey])
          subcategoryMap[categoryKey] = new Map();
        if (
          subcategoryKey &&
          subcategoryName &&
          !subcategoryMap[categoryKey].has(subcategoryKey)
        ) {
          subcategoryMap[categoryKey].set(subcategoryKey, subcategoryName);
        }
      }
    });
    const finalMap = {};
    for (const categoryKey in subcategoryMap) {
      finalMap[categoryKey] = Array.from(subcategoryMap[categoryKey].entries())
        .map(([key, name]) => ({ key, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return finalMap;
  }, [classes]);

  useEffect(() => {
    setMasterSubcategoryMap((prevMasterMap) => {
      const newMasterMap = JSON.parse(JSON.stringify(prevMasterMap));
      let hasChanges = false;
      for (const categoryKey in subcategoriesFromClasses) {
        if (!newMasterMap[categoryKey]) {
          newMasterMap[categoryKey] = [];
        }
        const newSubcats = subcategoriesFromClasses[categoryKey];
        const masterList = newMasterMap[categoryKey];
        newSubcats.forEach((newSub) => {
          const existingSubIndex = masterList.findIndex(
            (s) => s.key === newSub.key
          );
          if (existingSubIndex === -1) {
            masterList.push(newSub);
            hasChanges = true;
          } else if (masterList[existingSubIndex].name !== newSub.name) {
            masterList[existingSubIndex].name = newSub.name;
            hasChanges = true;
          }
        });
        if (hasChanges) {
          masterList.sort((a, b) => a.name.localeCompare(b.name));
        }
      }
      if (hasChanges) {
        try {
          sessionStorage.setItem(
            SUBCATEGORY_CACHE_KEY,
            JSON.stringify(newMasterMap)
          );
        } catch (e) {
          console.error("Could not write to subcategory cache", e);
        }
        return newMasterMap;
      }
      return prevMasterMap;
    });
  }, [subcategoriesFromClasses]);

  useEffect(() => {
    const subcats = masterSubcategoryMap[optimisticCategory] || [];
    setDisplayedSubcategories(subcats);
  }, [optimisticCategory, masterSubcategoryMap]);

  useEffect(() => {
    setIsSubcategoriesVisible(
      optimisticCategory !== "all" && displayedSubcategories.length > 0
    );
  }, [optimisticCategory, displayedSubcategories]);

  // CHANGED: Update the scroll position tracking functions
  const updateScrollPosition = useCallback(() => {
    if (subcatWrapperRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = subcatWrapperRef.current;
      setScrollPosition(scrollLeft);
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  const updateCategoryScrollPosition = useCallback(() => {
    if (categoriesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoriesRef.current;
      setCategoryScrollPosition(scrollLeft);
      setCanScrollCategoryLeft(scrollLeft > 1);
      setCanScrollCategoryRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  // CHANGED: Update useEffect for checking if subcategories are scrollable
  useEffect(() => {
    const checkScrollable = () => {
      if (subcatWrapperRef.current) {
        const elem = subcatWrapperRef.current;
        const isScrollable = elem.scrollWidth > elem.clientWidth;
        setShouldShowScrollButtons(isScrollable);

        if (isScrollable) {
          updateScrollPosition();
        } else {
          setCanScrollLeft(false);
          setCanScrollRight(false);
        }
      } else {
        setShouldShowScrollButtons(false);
        setCanScrollLeft(false);
        setCanScrollRight(false);
      }
    };

    if (isSubcategoriesVisible) {
      checkScrollable();
      const observer = new MutationObserver(checkScrollable);
      if (subcatWrapperRef.current) {
        observer.observe(subcatWrapperRef.current, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
      window.addEventListener("resize", checkScrollable);
      return () => {
        window.removeEventListener("resize", checkScrollable);
        observer.disconnect();
      };
    } else {
      setShouldShowScrollButtons(false);
      setCanScrollLeft(false);
      setCanScrollRight(false);
    }
  }, [isSubcategoriesVisible, displayedSubcategories, updateScrollPosition]);

  const handleCategoryScroll = (direction) => {
    if (categoriesRef.current) {
      const scrollAmount = categoriesRef.current.offsetWidth * 0.7;
      categoriesRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const currentRef = categoriesRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", updateCategoryScrollPosition, {
        passive: true,
      });
      updateCategoryScrollPosition();
      return () =>
        currentRef.removeEventListener("scroll", updateCategoryScrollPosition);
    }
  }, [updateCategoryScrollPosition]);

  // CHANGED: Update useEffect for checking if categories are scrollable
  useEffect(() => {
    const checkCatScrollable = () => {
      if (categoriesRef.current) {
        const elem = categoriesRef.current;
        const isScrollable = elem.scrollWidth > elem.clientWidth;
        setShowCategoryScrollButtons(isScrollable);

        if (isScrollable) {
          updateCategoryScrollPosition();
        } else {
          setCanScrollCategoryLeft(false);
          setCanScrollCategoryRight(false);
        }
      } else {
        setShowCategoryScrollButtons(false);
        setCanScrollCategoryLeft(false);
        setCanScrollCategoryRight(false);
      }
    };

    const timeoutId = setTimeout(checkCatScrollable, 100);
    window.addEventListener("resize", checkCatScrollable);
    const observer = new MutationObserver(checkCatScrollable);
    if (categoriesRef.current) {
      observer.observe(categoriesRef.current, {
        childList: true,
        subtree: true,
      });
    }
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", checkCatScrollable);
      observer.disconnect();
    };
  }, [dynamicCategoryConfig, updateCategoryScrollPosition]);

  const handleScroll = (direction) => {
    if (subcatWrapperRef.current) {
      const scrollAmount = subcatWrapperRef.current.offsetWidth * 0.7;
      subcatWrapperRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const currentRef = subcatWrapperRef.current;
    if (currentRef && isSubcategoriesVisible) {
      currentRef.addEventListener("scroll", updateScrollPosition, {
        passive: true,
      });
      updateScrollPosition();
      return () =>
        currentRef.removeEventListener("scroll", updateScrollPosition);
    }
  }, [isSubcategoriesVisible, updateScrollPosition]);

  const handleCategoryClick = useCallback(
    (categoryKey) => {
      if (categoryKey === optimisticCategory) {
        return;
      }
      setOptimisticCategory(categoryKey);
      setOptimisticSubcategory("");

      const categoryName =
        dynamicCategoryConfig.find((c) => c.key === categoryKey)?.name ||
        "Unknown Category";

      if (ReactGA.isInitialized) {
        ReactGA.event({
          category: "Explore Page",
          action: "Select Category",
          label: categoryName,
        });
      }

      onCategoryChange(categoryKey, "");
    },
    [optimisticCategory, dynamicCategoryConfig, onCategoryChange]
  );

  const handleSubcategoryClick = useCallback(
    (subcategoryKey) => {
      const isDeselecting = optimisticSubcategory === subcategoryKey;

      setOptimisticSubcategory(isDeselecting ? "" : subcategoryKey);

      const subcategoryName =
        displayedSubcategories.find((s) => s.key === subcategoryKey)?.name ||
        "Unknown Subcategory";

      if (ReactGA.isInitialized) {
        ReactGA.event({
          category: "Explore Page",
          action: "Select Subcategory",
          label: `${subcategoryName} (${
            isDeselecting ? "Deselect" : "Select"
          })`,
        });
      }

      onCategoryChange(optimisticCategory, isDeselecting ? "" : subcategoryKey);
    },
    [
      optimisticCategory,
      optimisticSubcategory,
      displayedSubcategories,
      onCategoryChange,
    ]
  );

  return (
    <CategoriesWrapper>
      <TopSection>
        <CategoriesScrollArea>
          <ScrollWrapper
            $showLeftFade={showCategoryScrollButtons && canScrollCategoryLeft}
            $showRightFade={showCategoryScrollButtons && canScrollCategoryRight}
          >
            <PrevButton
              $show={showCategoryScrollButtons && canScrollCategoryLeft}
              onClick={() => handleCategoryScroll("left")}
              aria-label="Scroll previous categories"
            >
              <ChevronLeft size={16} />
            </PrevButton>
            <Categories ref={categoriesRef}>
              {dynamicCategoryConfig.map((category) => (
                <CategoryItem
                  key={category.key}
                  category={category}
                  isSelected={optimisticCategory === category.key}
                  onClick={() => handleCategoryClick(category.key)}
                />
              ))}
            </Categories>
            <NextButton
              $show={showCategoryScrollButtons && canScrollCategoryRight}
              onClick={() => handleCategoryScroll("right")}
              aria-label="Scroll next categories"
            >
              <ChevronRight size={16} />
            </NextButton>
          </ScrollWrapper>
        </CategoriesScrollArea>
        <ScrollFilterWrapper>
          <FilterButton
            onClick={() => setIsFilterModalOpen(true)}
            aria-label="Open filters"
          >
            <Settings2 size={17} /> <span>Filters</span>
          </FilterButton>
          {!isMapVisible && (
            <ShowMapButton onClick={onShowMap} aria-label="Show map">
              <MapIcon size={16} />
              <span>Map</span>
            </ShowMapButton>
          )}
        </ScrollFilterWrapper>
      </TopSection>
      {isSubcategoriesVisible && (
        <ScrollWrapper
          $showLeftFade={shouldShowScrollButtons && canScrollLeft}
          $showRightFade={shouldShowScrollButtons && canScrollRight}
        >
          <PrevButton
            $show={shouldShowScrollButtons && canScrollLeft}
            onClick={() => handleScroll("left")}
            aria-label="Scroll previous subcategories"
          >
            <ChevronLeft size={16} />
          </PrevButton>
          <SubCategories
            ref={subcatWrapperRef}
            isVisible={isSubcategoriesVisible}
            $shouldScroll={shouldShowScrollButtons}
          >
            {displayedSubcategories.map((subcategory) => (
              <SubCategoryGroup
                key={subcategory.key}
                isSelected={optimisticSubcategory === subcategory.key}
                onClick={() => handleSubcategoryClick(subcategory.key)}
                aria-pressed={optimisticSubcategory === subcategory.key}
              >
                {subcategory.name}
              </SubCategoryGroup>
            ))}
          </SubCategories>
          <NextButton
            $show={shouldShowScrollButtons && canScrollRight}
            onClick={() => handleScroll("right")}
            aria-label="Scroll next subcategories"
          >
            <ChevronRight size={16} />
          </NextButton>
        </ScrollWrapper>
      )}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onOpen={() => setIsFilterModalOpen(true)}
        filters={filters}
        currentSortBy={currentSortBy}
        onApplyChanges={onApplyModalChanges}
        onFiltersChangeForTags={onFiltersChange}
      />
    </CategoriesWrapper>
  );
}

const ExploreCategories = (props) => {
  return (
    <Suspense fallback={<div style={{ height: "100px" }} />}>
      <ExploreCategoriesContent {...props} />
    </Suspense>
  );
};

export default memo(ExploreCategories);
