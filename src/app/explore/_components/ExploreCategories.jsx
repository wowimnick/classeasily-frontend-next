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
const SubCollectionDrawer = dynamic(() => import("./SubCollectionDrawer"), {
  ssr: false,
});

// Icon loading logic
const IconFallback = (props) => (
  <div {...props} style={{ width: 18, height: 18, ...props.style }} />
);

const lazyIconCache = new Map();

function getLazyIcon(iconName) {
  if (!lazyIconCache.has(iconName)) {
    lazyIconCache.set(
      iconName,
      lazy(() =>
        import("lucide-react").then((module) => ({
          default: module[iconName] || Layers,
        })),
      ),
    );
  }
  return lazyIconCache.get(iconName);
}

const CategoryIcon = memo(({ iconName, ...props }) => {
  const IconComponent = getLazyIcon(iconName);
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
  min-width: 44px;
  min-height: 44px;
  width: 72px;
  height: 100%;
  padding: 8px 4px 4px;
  position: relative;
  z-index: 2;
  box-sizing: border-box;

  @media (max-width: 768px) {
    width: 60px;
    padding: 6px 2px 4px;
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
  padding: 20px;
  border-radius: 20px;
  min-height: 40px;
  height: 40px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-sizing: border-box;
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
    min-height: 40px;
    height: 40px;
    font-size: 13px;
    padding: 20px;
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

const SubPill = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  border: ${({ $selected }) =>
    $selected ? "2px solid #111" : "1px solid #d4d4d8"};
  background: #fff;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  color: #111;
  &:hover {
    border-color: #71717a;
  }
`;

const MobileTagsTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #e4e4e7;
  background: #fafafa;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  max-width: 100%;
  justify-content: center;
`;

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
  prevProps.collection.is_all === nextProps.collection.is_all &&
  prevProps.isSelected === nextProps.isSelected
);

// Respect admin sort_order for explore page (collections from API are already ordered; this ensures client order)
const sortCollectionsByOrder = (list) =>
  [...(list || [])].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

function ExploreCategoriesContent({
  collections = [],
  currentCollection,
  onCollectionChange,
  subCollections = [],
  currentSubs = [],
  onSubsChange,
  totalClassesCount = 0,
  filters,
  onFiltersChange,
  currentSortBy,
  onApplyModalChanges,
  isFilterModalOpen,
  setIsFilterModalOpen,
  isMapVisible,
  onShowMap,
}) {
  const sortedCollections = useMemo(
    () => sortCollectionsByOrder(collections),
    [collections]
  );
  const parentHasSubs =
    Boolean(currentCollection) && (subCollections?.length || 0) > 0;

  const [subDrawerOpen, setSubDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const fn = () => setIsMobile(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  const [optimisticCollection, setOptimisticCollection] =
    useState(currentCollection);

  useEffect(() => {
    setOptimisticCollection(currentCollection);
  }, [currentCollection]);

  const categoriesRef = useRef(null);
  const [showCategoryScrollButtons, setShowCategoryScrollButtons] =
    useState(false);
  const [canScrollCategoryLeft, setCanScrollCategoryLeft] = useState(false);
  const [canScrollCategoryRight, setCanScrollCategoryRight] = useState(false);

  const updateCategoryScrollPosition = useCallback(() => {
    if (categoriesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoriesRef.current;
      setCanScrollCategoryLeft(scrollLeft > 1);
      setCanScrollCategoryRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

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
  }, [sortedCollections, updateCategoryScrollPosition]);

  const handleCollectionClick = useCallback(
    (collectionSlug) => {
      const normalized =
        collectionSlug === undefined || collectionSlug === null
          ? ""
          : String(collectionSlug);
      if (optimisticCollection === normalized) return;
      setOptimisticCollection(normalized);
      onCollectionChange(normalized);
    },
    [optimisticCollection, onCollectionChange]
  );

  const toggleSubSlug = useCallback(
    (slug) => {
      const next = new Set(currentSubs);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      onSubsChange([...next]);
    },
    [currentSubs, onSubsChange]
  );

  const clearSubs = useCallback(() => {
    onSubsChange([]);
  }, [onSubsChange]);

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
              {parentHasSubs && !isMobile ? (
                <>
                  <SubPill
                    type="button"
                    $selected={currentSubs.length === 0}
                    aria-pressed={currentSubs.length === 0}
                    onClick={() => onSubsChange([])}
                  >
                    All
                  </SubPill>
                  {subCollections.map((sub, index) => {
                    const slug = sub.slug || sub.key || `sub-${index}`;
                    const sel = currentSubs.includes(slug);
                    return (
                      <SubPill
                        key={slug}
                        type="button"
                        $selected={sel}
                        aria-pressed={sel}
                        onClick={() => toggleSubSlug(slug)}
                      >
                        {sub.icon_name ? (
                          <CategoryIcon iconName={sub.icon_name} size={16} />
                        ) : null}
                        {sub.name}
                      </SubPill>
                    );
                  })}
                </>
              ) : parentHasSubs && isMobile ? (
                <MobileTagsTrigger
                  type="button"
                  onClick={() => setSubDrawerOpen(true)}
                >
                  <Layers size={18} />
                  Experience tags
                  {currentSubs.length > 0 ? ` (${currentSubs.length})` : ""}
                </MobileTagsTrigger>
              ) : (
              sortedCollections.map((collection, index) => {
                const rawSlug = collection.key ?? collection.slug;
                const slug =
                  rawSlug === undefined || rawSlug === null ? "" : String(rawSlug);
                const id =
                  collection.key ||
                  collection.slug ||
                  (collection.is_all ? "all-chip" : `collection-${index}`);
                const isAllChip =
                  collection.is_all === true ||
                  (slug === "" &&
                    String(collection.name || "")
                      .trim()
                      .toLowerCase() === "all");
                const isSelected = isAllChip
                  ? !optimisticCollection
                  : optimisticCollection === slug;
                return (
                  <React.Fragment key={id}>
                    {index === 1 && (
                      <VerticalSeparator aria-hidden="true" />
                    )}
                    <CollectionItem
                      collection={collection}
                      isSelected={isSelected}
                      onClick={() => handleCollectionClick(isAllChip ? "" : slug)}
                    />
                  </React.Fragment>
                );
              })
              )}
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

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onOpen={() => setIsFilterModalOpen(true)}
        filters={filters}
        currentSortBy={currentSortBy}
        onApplyChanges={onApplyModalChanges}
        onFiltersChangeForTags={onFiltersChange}
      />
      <SubCollectionDrawer
        open={subDrawerOpen}
        onOpenChange={setSubDrawerOpen}
        subCollections={subCollections}
        selectedSubs={currentSubs}
        onToggle={(next) => onSubsChange(next)}
        onClearAll={() => {
          onSubsChange([]);
          setSubDrawerOpen(false);
        }}
        resultCount={totalClassesCount}
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
