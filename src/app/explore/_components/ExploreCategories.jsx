// components/explore/ExploreCategories.jsx
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
import {
  ChevronRight,
  ChevronLeft,
  Map as MapIcon,
  Settings2,
  Layers,
} from "lucide-react";
import dynamic from "next/dynamic";
import styled from "styled-components";

// Defer FilterModal loading to reduce initial bundle size
const FilterModal = dynamic(() => import("./FilterModal"), { ssr: false });

// Icon loading logic
const IconFallback = (props) => (
  <div {...props} style={{ width: 18, height: 18, ...props.style }} />
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
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.03);
`;

const Categories = styled.div`
  display: flex;
  position: relative;
  flex-direction: row;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  gap: 0.25rem;
  padding: 0 1.5rem;
  align-items: center;
  background: #ffffff;
  height: 72px;
  z-index: 2;

  &::-webkit-scrollbar {
    display: none;
  }
  @media (max-width: 767px) {
    padding: 0 1rem;
    gap: 0.5rem;
    height: 64px;
  }
`;

const SubCategories = styled.div`
  display: flex;
  position: relative;
  flex-direction: row;
  padding: 0.5rem 1.5rem;
  gap: 0.5rem;
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
    padding: 0.4rem 1rem;
    gap: 0.4rem;
  }
`;

// --- COMPACT CATEGORY STYLES ---
const CategoryGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
  cursor: ${({ $isSelected }) => ($isSelected ? "default" : "pointer")};
  flex-shrink: 0;
  border-bottom: 1px solid transparent;
  border-bottom-color: ${({ $isSelected }) =>
    $isSelected ? "#ff385c" : "transparent"};
  width: 72px;
  height: 100%;
  padding-top: 8px;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    width: 60px;
  }
`;

const CategoryFont = styled.p`
  font-size: 11px;
  font-weight: ${({ $isSelected }) => ($isSelected ? "700" : "500")};
  color: ${({ $isSelected }) => ($isSelected ? "#000000" : "#717171")};
  margin: 4px 0 0 0;
  transition: all 0.2s ease;
  text-align: center;
  line-height: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (max-width: 768px) {
    font-size: 10px;
  }
`;

const ImageBackground = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;

  @media (max-width: 768px) {
    width: 20px;
    height: 20px;
  }

  svg {
    width: 20px;
    height: 20px;
    color: ${({ $isSelected }) => ($isSelected ? "#000000" : "#717171")};
    stroke-width: ${({ $isSelected }) => ($isSelected ? 2.5 : 2)};
    transition: all 0.2s ease;
  }

  @media (max-width: 768px) {
    svg {
      width: 18px;
      height: 18px;
    }
  }

  ${CategoryGroup}:hover & svg {
    color: #222;
  }
`;

// --- COMPACT COLLECTION PILLS ---
const CollectionPill = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ $isSelected }) => ($isSelected ? "#222" : "#fff")};
  color: ${({ $isSelected }) => ($isSelected ? "#fff" : "#222")};
  border: 1px solid ${({ $isSelected }) => ($isSelected ? "#222" : "#e0e0e0")};
  white-space: nowrap;
  border-radius: 20px;
  padding: 0 12px;
  height: 32px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-shadow: ${({ $isSelected }) =>
    $isSelected ? "0 2px 8px rgba(0,0,0,0.15)" : "0 1px 3px rgba(0,0,0,0.05)"};
  position: relative;
  z-index: 2;

  &:hover {
    background-color: ${({ $isSelected }) =>
      $isSelected ? "#000" : "#f7f7f7"};
    border-color: ${({ $isSelected }) => ($isSelected ? "#000" : "#d0d0d0")};
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    height: 30px;
    font-size: 11px;
    padding: 0 10px;
  }
`;

const VerticalSeparator = styled.div`
  width: 1px;
  height: 24px;
  background-color: #eaeaea;
  margin: 0 8px;
  flex-shrink: 0;
  z-index: 2;
`;

// --- SUB-CATEGORY PILLS ---
const SubCategoryGroup = styled.div`
  display: flex;
  background-color: ${({ $isSelected }) => ($isSelected ? "#ffebee" : "#f5f5f5")};
  color: ${({ $isSelected }) => ($isSelected ? "#ff385c" : "#595959")};
  white-space: nowrap;
  border-radius: 16px;
  padding: 0 12px;
  height: 32px;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid ${({ $isSelected }) => ($isSelected ? "#ffb2b2" : "#e0e0e0")};
  &:hover {
    background-color: ${({ $isSelected }) =>
      $isSelected ? "#ffebee" : "#efefef"};
    border-color: ${({ $isSelected }) => ($isSelected ? "#ffb2b2" : "#bdbdbd")};
  }
  @media (max-width: 768px) {
    height: 30px;
    padding: 0 10px;
    font-size: 11px;
  }
`;

const ScrollWrapper = styled.div`
  display: flex;
  position: relative;
  flex-direction: row;
  align-items: center;
  width: 100%;
  background: #ffffff;
  height: 100%;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    width: 40px;
    z-index: 1;
    pointer-events: none;
    opacity: 0;
    transition: opacity 300ms ease-in-out;
  }

  &::before {
    left: 0;
    background: linear-gradient(to right, #ffffff 45%, rgba(255, 255, 255, 0));
    opacity: ${({ $showLeftFade }) => ($showLeftFade ? 1 : 0)};
  }

  &::after {
    right: 0;
    background: linear-gradient(to left, #ffffff 45%, rgba(255, 255, 255, 0));
    opacity: ${({ $showRightFade }) => ($showRightFade ? 1 : 0)};
  }
`;

const ScrollButton = styled.button`
  position: absolute;
  display: ${({ $show }) => ($show ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #eee;
  border-radius: 50%;
  cursor: pointer;
  z-index: 5;
  transition: all 0.2s ease;
  color: #222;

  &:hover {
    background-color: #fff;
    transform: scale(1.1);
    color: #000;
  }

  svg {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const PrevButton = styled(ScrollButton)`
  left: 0.25rem;
`;
const NextButton = styled(ScrollButton)`
  right: 0.25rem;
`;

const TopSection = styled.div`
  display: flex;
  align-items: center;
  background: #ffffff;
  position: relative;
`;

const CategoriesScrollArea = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: stretch;
  height: 100%;
`;

const ScrollFilterWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  flex-shrink: 0;
  gap: 12px;
  height: 100%;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 24px;
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
  <CategoryGroup onClick={onClick} $isSelected={isSelected}>
    <ImageBackground $isSelected={isSelected}>
      <CategoryIcon iconName={category.icon_name} />
    </ImageBackground>
    <CategoryFont $isSelected={isSelected}>{category.name}</CategoryFont>
  </CategoryGroup>
), (prevProps, nextProps) => 
  prevProps.category.key === nextProps.category.key &&
  prevProps.isSelected === nextProps.isSelected
);

const CollectionItem = memo(({ collection, isSelected, onClick }) => (
  <CollectionPill
    onClick={onClick}
    $isSelected={isSelected}
    aria-pressed={isSelected}
  >
    {collection.name}
  </CollectionPill>
), (prevProps, nextProps) =>
  prevProps.collection.key === nextProps.collection.key &&
  prevProps.collection.slug === nextProps.collection.slug &&
  prevProps.isSelected === nextProps.isSelected
);

function ExploreCategoriesContent({
  categories = [],
  collections = [],
  onCategoryChange,

  currentCollection,
  onCollectionChange,

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
  // NEW: Optimistic State
  const [optimisticCategory, setOptimisticCategory] = useState(currentCategory);
  const [optimisticSubcategory, setOptimisticSubcategory] =
    useState(currentSubcategory);
  const [optimisticCollection, setOptimisticCollection] =
    useState(currentCollection);

  // Sync state when props change (e.g. on server response or popstate)
  useEffect(() => {
    setOptimisticCategory(currentCategory);
    setOptimisticSubcategory(currentSubcategory);
    setOptimisticCollection(currentCollection);
  }, [currentCategory, currentSubcategory, currentCollection]);

  const subcatWrapperRef = useRef(null);
  const categoriesRef = useRef(null);
  const [isSubcategoriesVisible, setIsSubcategoriesVisible] = useState(false);

  const [shouldShowScrollButtons, setShouldShowScrollButtons] = useState(false);
  const [showCategoryScrollButtons, setShowCategoryScrollButtons] =
    useState(false);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollCategoryLeft, setCanScrollCategoryLeft] = useState(false);
  const [canScrollCategoryRight, setCanScrollCategoryRight] = useState(false);

  const [masterSubcategoryMap, setMasterSubcategoryMap] =
    useState(getCachedMap);
  const [displayedSubcategories, setDisplayedSubcategories] = useState([]);

  // Combine "All" with categories
  const dynamicCategoryConfig = useMemo(() => {
    const allCategory = { key: "all", icon_name: "Layers", name: "All" };
    return [allCategory, ...categories];
  }, [categories]);

  // Subcategory extraction logic
  const subcategoriesFromClasses = useMemo(() => {
    // Early return if no classes
    if (!classes || classes.length === 0) return {};
    
    const subcategoryMap = {};
    // Use for loop for better performance with large arrays
    for (let i = 0; i < classes.length; i++) {
      const classItem = classes[i];
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
    }
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

  // Visibility logic - UPDATED to use optimisticCollection
  useEffect(() => {
    setIsSubcategoriesVisible(
      !optimisticCollection &&
        optimisticCategory !== "all" &&
        displayedSubcategories.length > 0
    );
  }, [optimisticCategory, displayedSubcategories, optimisticCollection]);

  // --- Scroll Logic ---
  const updateScrollPosition = useCallback(() => {
    if (subcatWrapperRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = subcatWrapperRef.current;
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  const updateCategoryScrollPosition = useCallback(() => {
    if (categoriesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoriesRef.current;
      setCanScrollCategoryLeft(scrollLeft > 1);
      setCanScrollCategoryRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    const checkScrollable = () => {
      if (subcatWrapperRef.current) {
        const elem = subcatWrapperRef.current;
        const isScrollable = elem.scrollWidth > elem.clientWidth;
        setShouldShowScrollButtons(isScrollable);
        if (isScrollable) updateScrollPosition();
      }
    };

    if (isSubcategoriesVisible) {
      checkScrollable();
      window.addEventListener("resize", checkScrollable);
      return () => window.removeEventListener("resize", checkScrollable);
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

  useEffect(() => {
    const checkCatScrollable = () => {
      if (categoriesRef.current) {
        const elem = categoriesRef.current;
        const isScrollable = elem.scrollWidth > elem.clientWidth;
        setShowCategoryScrollButtons(isScrollable);
        if (isScrollable) updateCategoryScrollPosition();
      }
    };

    const timeoutId = setTimeout(checkCatScrollable, 100);
    window.addEventListener("resize", checkCatScrollable);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", checkCatScrollable);
    };
  }, [dynamicCategoryConfig, collections, updateCategoryScrollPosition]);

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

  // --- Handlers (UPDATED TO BE OPTIMISTIC) ---

  const handleCategoryClick = useCallback(
    (categoryKey) => {
      if (optimisticCategory === categoryKey && !optimisticCollection) return;

      // Optimistic updates
      setOptimisticCategory(categoryKey);
      setOptimisticSubcategory("");
      setOptimisticCollection("");

      onCategoryChange(categoryKey, "");
    },
    [onCategoryChange, optimisticCategory, optimisticCollection]
  );

  const handleCollectionClick = useCallback(
    (collectionSlug) => {
      if (optimisticCollection === collectionSlug) return;

      // Optimistic updates
      setOptimisticCollection(collectionSlug);
      setOptimisticCategory("all"); // Reset category to All
      setOptimisticSubcategory("");

      onCollectionChange(collectionSlug);
    },
    [optimisticCollection, onCollectionChange]
  );

  const handleSubcategoryClick = useCallback(
    (subcategoryKey) => {
      const isDeselecting = optimisticSubcategory === subcategoryKey;
      const newSub = isDeselecting ? "" : subcategoryKey;

      setOptimisticSubcategory(newSub);
      // Ensure collection is cleared (should be implicitly, but safely here)
      if (optimisticCollection) setOptimisticCollection("");

      onCategoryChange(optimisticCategory, newSub);
    },
    [
      optimisticCategory,
      optimisticSubcategory,
      onCategoryChange,
      optimisticCollection,
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
              aria-label="Scroll previous"
            >
              <ChevronLeft size={16} />
            </PrevButton>

            <Categories ref={categoriesRef}>
              {/* --- SECTION 1: COLLECTIONS (VIBES) --- */}
              {collections.map((collection, index) => {
                const id =
                  collection.key || collection.slug || `collection-${index}`;
                const slug = collection.key || collection.slug;
                return (
                  <CollectionItem
                    key={id}
                    collection={collection}
                    isSelected={optimisticCollection === slug}
                    onClick={() => handleCollectionClick(slug)}
                  />
                );
              })}

              {/* --- VISUAL SEPARATOR --- */}
              {collections.length > 0 && <VerticalSeparator />}

              {/* --- SECTION 2: CATEGORIES --- */}
              {dynamicCategoryConfig.map((category) => (
                <CategoryItem
                  key={category.key}
                  category={category}
                  isSelected={
                    !optimisticCollection && optimisticCategory === category.key
                  }
                  onClick={() => handleCategoryClick(category.key)}
                />
              ))}
            </Categories>

            <NextButton
              $show={showCategoryScrollButtons && canScrollCategoryRight}
              onClick={() => handleCategoryScroll("right")}
              aria-label="Scroll next"
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
            <Settings2 size={16} /> <span>Filters</span>
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
                $isSelected={optimisticSubcategory === subcategory.key}
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
    <Suspense fallback={<div style={{ height: "72px" }} />}>
      <ExploreCategoriesContent {...props} />
    </Suspense>
  );
};

export default memo(ExploreCategories);
