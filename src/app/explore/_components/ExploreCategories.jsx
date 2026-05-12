"use client";

import React, {
  memo,
  Suspense,
  useMemo,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import dynamic from "next/dynamic";
import styled from "styled-components";
import {
  ChevronDown,
  Feather,
  Map as MapIcon,
  Settings2,
  Check,
} from "lucide-react";
import { exploreTimePreferencesList } from "./exploreTimePreferences";
import { ExploreBarLazyLucideIcon } from "./exploreBarLazyIcon.jsx";
import ExploreResultsPrimaryLabel from "./ExploreResultsPrimaryLabel.jsx";
import { useIsDesktopOrWider } from "@/styles/breakpoints-hooks";
import { BP, down } from "@/styles/breakpoints";
import { ExploreShowResultsButton } from "@/components/explore/ExploreShowResultsButton";
import {
  ExploreDropdownTypeChipFlow,
  ExploreDropdownTypeChip,
} from "@/components/explore/ExploreDropdownTypeChips";

const FilterModal = dynamic(() => import("./FilterModal"), { ssr: false });

const ExploreExperienceTypeDrawer = dynamic(
  () => import("./ExploreExperienceTypeDrawer"),
  { ssr: false },
);
const ExploreTimeOfDayDrawer = dynamic(
  () => import("./ExploreTimeOfDayDrawer"),
  { ssr: false },
);

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

/** Explore filter bar — matches ClientHeader #fafafa when map is hidden on desktop; white when map is open */
const BarOuter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: ${(p) => (p.$desktopMapHidden ? "#fafafa" : "#ffffff")};
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 10px 12px;
  transition:
    border-color 0.35s ease,
    background-color 0.25s ease;

  ${down(BP.MOBILE)} {
    border-bottom: none;
  }
`;

const BarCluster = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  max-width: 100%;
  width: 100%;

  ${down(BP.MOBILE)} {
    flex-wrap: nowrap;
    justify-content: center;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 12px;
    overscroll-behavior-x: contain;
    touch-action: pan-x;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const BarControlButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
  height: 40px;
  padding: 0 14px;
  background: #ffffff;
  box-shadow: 0px 8px 11px 0px rgba(0, 0, 0, 0.06);
  border: 1px solid ${(p) => (p.$active ? "#222222" : "#dddddd")};
  border-radius: 20px;
  font-size: 14px;
  font-weight: 400;
  color: #222222;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f7f7f7;
    border-color: ${(p) => (p.$active ? "#222222" : "#c2c2c2")};
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .bar-label {
    white-space: nowrap;
  }

  ${down(BP.MOBILE)} {
    height: 38px;
    padding: 0 12px;
    font-size: 13px;
    gap: 5px;

    ${(p) =>
      p.$hideLabelOnMobile &&
      `
      .bar-label {
        display: none;
      }
    `}

    svg {
      flex-shrink: 0;
    }
  }
`;

/** Rotating chevron for Type / Time triggers (desktop dropdown + mobile drawer state). */
const ChevronTriggerWrap = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.22s ease;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
`;

const ShowMapOnDesktop = styled(BarControlButton)`
  ${down(BP.TABLET)} {
    display: none;
  }
`;

/** Vertical rule between bar control groups */
const BarDivider = styled.span`
  display: inline-block;
  width: 1px;
  height: 24px;
  background: #dddddd;
  flex-shrink: 0;
  align-self: center;

  ${down(BP.MOBILE)} {
    height: 22px;
  }
`;

/** Before Map control — Map is desktop-only; hide rule on narrow screens (avoids stray divider on mobile). */
const BarDividerBeforeMapDesktop = styled(BarDivider)`
  ${down(BP.TABLET)} {
    display: none;
  }
`;

/* Header-style floating panel (ClientHeader UnifiedPopupContainer) */
const ExploreDropdownPanel = styled.div`
  position: fixed;
  z-index: 2600;
  background: #ffffff;
  border-radius: 32px;
  padding: 0;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  max-height: min(520px, calc(100vh - 96px));
  display: flex;
  flex-direction: column;

  &[data-variant="type"] {
    max-height: min(560px, calc(100vh - 96px));
  }
`;

const TimeDropdownIntro = styled.div`
  padding: 16px 20px 8px;
`;

const TimeDropdownTitle = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: #000000;
  letter-spacing: -0.02em;
`;

const TimeDropdownSubtitle = styled.p`
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: #000000;
`;

const TimeOptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 20px 12px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

const TimeOptionRow = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  text-align: left;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  min-height: 48px;
`;

const TimeRowCheckbox = styled.span`
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid #0a0a0a;
  background: ${({ $checked }) => ($checked ? "#000000" : "#ffffff")};
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 2px 6px rgba(0, 0, 0, 0.07);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease;

  ${({ $checked }) =>
    $checked
      ? `
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.14),
      0 4px 10px rgba(0, 0, 0, 0.16);
  `
      : ""}
`;

const TimeOptionText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
`;

const TimeOptionLabel = styled.span`
  font-size: 17px;
  font-weight: 400;
  color: #000000;
  line-height: 1.25;
`;

const TimeOptionSub = styled.span`
  font-size: 15px;
  font-weight: 400;
  color: #000000;
  line-height: 1.35;
`;

const DropdownFooter = styled.div`
  border-top: 1px solid #ebebeb;
  padding: 12px 20px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
`;

const DropdownClearLink = styled.button`
  border: none;
  background: none;
  padding: 8px 4px;
  font-size: 14px;
  font-weight: 500;
  color: #000000;
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1.2;
`;

function sortCollectionsByOrder(list) {
  return [...(list || [])].sort(
    (a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999),
  );
}

function findOriginalsCollection(collections) {
  const list = (collections || []).filter((c) => !c?.is_all);
  const bySlug = list.find(
    (c) => String(c.slug || "").toLowerCase() === "originals",
  );
  if (bySlug) return bySlug;
  return (
    list.find(
      (c) => String(c.name || "").trim().toLowerCase() === "originals",
    ) || null
  );
}

function formatShowResultsLabel(totalCount) {
  if (typeof totalCount !== "number" || Number.isNaN(totalCount)) {
    return "Show results";
  }
  return `Show ${totalCount.toLocaleString()} results`;
}

function ExploreCategoriesContent({
  collections = [],
  collectionsIWant = [],
  classes = [],
  currentCollections = [],
  onCollectionChange,
  filters,
  onFiltersChange,
  currentSortBy,
  onApplyModalChanges,
  isFilterModalOpen,
  setIsFilterModalOpen,
  isMapVisible,
  onShowMap,
  onApplyTimePreferences,
  totalClassesCount,
  previewExploreBarCount,
  previewFilterModalCount,
}) {
  const [typeDrawerOpen, setTypeDrawerOpen] = useState(false);
  const [timeDrawerOpen, setTimeDrawerOpen] = useState(false);
  const isDesktopBar = useIsDesktopOrWider();

  const [barPreviewCount, setBarPreviewCount] = useState(null);
  const [barPreviewLoading, setBarPreviewLoading] = useState(false);

  const barRootRef = useRef(null);
  const typeBtnRef = useRef(null);
  const timeBtnRef = useRef(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 360,
  });

  const [typeDraftSlugs, setTypeDraftSlugs] = useState([]);
  const [timeDraft, setTimeDraft] = useState([]);

  const sortedIWant = useMemo(
    () => sortCollectionsByOrder(collectionsIWant),
    [collectionsIWant],
  );

  const originalsRow = useMemo(
    () => findOriginalsCollection(collections),
    [collections],
  );
  const originalsSlug = originalsRow?.slug;

  const originalsActive =
    originalsSlug &&
    currentCollections.length === 1 &&
    currentCollections[0] === originalsSlug;
  const typeFilterActive = sortedIWant.some((c) =>
    currentCollections.includes(c.slug),
  );
  const timeFilterActive = (filters?.timePreference?.length || 0) > 0;

  const toggleOriginals = () => {
    if (!originalsSlug) return;
    if (currentCollections.length === 1 && currentCollections[0] === originalsSlug) {
      onCollectionChange([]);
    } else {
      onCollectionChange([originalsSlug]);
    }
  };

  const closeDropdowns = useCallback(() => setActiveDropdown(null), []);

  useClickOutside(barRootRef, closeDropdowns);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeDropdowns();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeDropdowns]);

  useEffect(() => {
    if (!isDesktopBar) setActiveDropdown(null);
  }, [isDesktopBar]);

  useEffect(() => {
    if (activeDropdown !== "type") return;
    const wantSlugs = new Set(sortedIWant.map((c) => c.slug));
    const next = (currentCollections || []).filter((s) => wantSlugs.has(s));
    setTypeDraftSlugs(next);
  }, [activeDropdown, currentCollections, sortedIWant]);

  useEffect(() => {
    if (activeDropdown !== "time") return;
    setTimeDraft([...(filters?.timePreference || [])]);
  }, [activeDropdown, filters?.timePreference]);

  useEffect(() => {
    if (isDesktopBar && (activeDropdown === "type" || activeDropdown === "time")) {
      return;
    }
    setBarPreviewCount(null);
    setBarPreviewLoading(false);
  }, [isDesktopBar, activeDropdown]);

  useEffect(() => {
    if (!previewExploreBarCount) return;
    if (!isDesktopBar) return;
    if (activeDropdown !== "type" && activeDropdown !== "time") return;

    setBarPreviewLoading(true);
    const ac = new AbortController();
    const t = setTimeout(() => {
      (async () => {
        try {
          const overrides =
            activeDropdown === "type"
              ? { collectionSlugs: typeDraftSlugs }
              : { timePreferenceIds: timeDraft };
          const c = await previewExploreBarCount(overrides, ac.signal);
          if (!ac.signal.aborted) setBarPreviewCount(c);
        } catch (e) {
          if (e?.name === "AbortError" || e?.name === "CanceledError") return;
          if (!ac.signal.aborted) setBarPreviewCount(null);
        } finally {
          if (!ac.signal.aborted) setBarPreviewLoading(false);
        }
      })();
    }, 120);

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [
    previewExploreBarCount,
    isDesktopBar,
    activeDropdown,
    typeDraftSlugs,
    timeDraft,
  ]);

  const showResultsCount = barPreviewCount ?? totalClassesCount;

  const updateDropdownPosition = useCallback(() => {
    if (!activeDropdown || !isDesktopBar) return;
    const ref = activeDropdown === "type" ? typeBtnRef : timeBtnRef;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const panelWidth =
      activeDropdown === "type"
        ? Math.min(560, window.innerWidth - 24)
        : Math.min(400, window.innerWidth - 24);
    let left = r.left + r.width / 2 - panelWidth / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - panelWidth - 12));
    setDropdownPos({
      top: r.bottom + 8,
      left,
      width: panelWidth,
    });
  }, [activeDropdown, isDesktopBar]);

  useLayoutEffect(() => {
    updateDropdownPosition();
  }, [updateDropdownPosition]);

  useEffect(() => {
    if (!activeDropdown || !isDesktopBar) return;
    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [activeDropdown, isDesktopBar, updateDropdownPosition]);

  const toggleTypeTrigger = () => {
    if (isDesktopBar) {
      setActiveDropdown((d) => (d === "type" ? null : "type"));
    } else {
      setTypeDrawerOpen(true);
    }
  };

  const toggleTimeTrigger = () => {
    if (isDesktopBar) {
      setActiveDropdown((d) => (d === "time" ? null : "time"));
    } else {
      setTimeDrawerOpen(true);
    }
  };

  const typeList = sortedIWant.filter((c) => c.slug && !c.is_all);

  const applyTypeDesktop = () => {
    onCollectionChange(typeDraftSlugs);
    closeDropdowns();
  };

  const applyTimeDesktop = () => {
    onApplyTimePreferences(timeDraft);
    closeDropdowns();
  };

  const toggleTimeChip = (id) => {
    setTimeDraft((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const typeExpanded = isDesktopBar
    ? activeDropdown === "type"
    : typeDrawerOpen;
  const timeExpanded = isDesktopBar
    ? activeDropdown === "time"
    : timeDrawerOpen;

  /** Single-column / map closed: same strip as unified explore header (#fafafa). */
  const desktopMapHidden = isDesktopBar && !isMapVisible;

  return (
    <>
      <BarOuter ref={barRootRef} $desktopMapHidden={desktopMapHidden}>
        <BarCluster>
          {originalsSlug ? (
            <BarControlButton
              type="button"
              $active={originalsActive}
              onClick={toggleOriginals}
              aria-pressed={originalsActive}
            >
              <Feather
                size={14}
                strokeWidth={2}
                color="#c9a227"
                aria-hidden
              />
              <span className="bar-label">Originals</span>
            </BarControlButton>
          ) : null}

          {sortedIWant.length > 0 ? (
            <BarControlButton
              ref={typeBtnRef}
              type="button"
              $active={typeFilterActive}
              onClick={toggleTypeTrigger}
              aria-expanded={typeExpanded}
              aria-haspopup="listbox"
            >
              <span className="bar-label">Type</span>
              <ChevronTriggerWrap $open={typeExpanded} aria-hidden>
                <ChevronDown size={14} strokeWidth={2.25} />
              </ChevronTriggerWrap>
            </BarControlButton>
          ) : null}

          <BarControlButton
            ref={timeBtnRef}
            type="button"
            $active={timeFilterActive}
            onClick={toggleTimeTrigger}
            aria-expanded={timeExpanded}
            aria-haspopup="listbox"
          >
            <span className="bar-label">Time of day</span>
            <ChevronTriggerWrap $open={timeExpanded} aria-hidden>
              <ChevronDown size={14} strokeWidth={2.25} />
            </ChevronTriggerWrap>
          </BarControlButton>

          <BarDivider aria-hidden />

          <BarControlButton
            type="button"
            $hideLabelOnMobile
            onClick={() => setIsFilterModalOpen(true)}
            aria-label="Open filters"
          >
            <Settings2 size={16} aria-hidden />
            <span className="bar-label">Filters</span>
          </BarControlButton>

          {!isMapVisible && (
            <>
              <BarDividerBeforeMapDesktop aria-hidden />
              <ShowMapOnDesktop
                type="button"
                onClick={onShowMap}
                aria-label="Show map"
              >
                <MapIcon size={16} aria-hidden />
                <span className="bar-label">Map</span>
              </ShowMapOnDesktop>
            </>
          )}
        </BarCluster>

        {isDesktopBar && activeDropdown === "type" && typeList.length > 0 && (
          <ExploreDropdownPanel
            data-variant="type"
            role="listbox"
            aria-label="Experience type"
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
            }}
          >
            <ExploreDropdownTypeChipFlow>
              {typeList.map((c) => (
                <ExploreDropdownTypeChip
                  key={c.slug}
                  type="button"
                  $selected={typeDraftSlugs.includes(c.slug)}
                  onClick={() =>
                    setTypeDraftSlugs((prev) =>
                      prev.includes(c.slug)
                        ? prev.filter((s) => s !== c.slug)
                        : [...prev, c.slug],
                    )
                  }
                >
                  {c.icon_name ? (
                    <ExploreBarLazyLucideIcon
                      iconName={c.icon_name}
                      size={16}
                      strokeWidth={1.5}
                    />
                  ) : null}
                  <span>{c.name}</span>
                </ExploreDropdownTypeChip>
              ))}
            </ExploreDropdownTypeChipFlow>
            <DropdownFooter>
              <DropdownClearLink
                type="button"
                onClick={() => setTypeDraftSlugs([])}
              >
                Clear all
              </DropdownClearLink>
              <ExploreShowResultsButton
                type="button"
                $compact
                onClick={applyTypeDesktop}
                disabled={barPreviewLoading}
                aria-busy={barPreviewLoading}
              >
                <ExploreResultsPrimaryLabel
                  loading={barPreviewLoading}
                  label={formatShowResultsLabel(showResultsCount)}
                />
              </ExploreShowResultsButton>
            </DropdownFooter>
          </ExploreDropdownPanel>
        )}

        {isDesktopBar && activeDropdown === "time" && (
          <ExploreDropdownPanel
            data-variant="time"
            role="listbox"
            aria-label="Time of day"
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
            }}
          >
            <TimeDropdownIntro>
              <TimeDropdownTitle>Time of day</TimeDropdownTitle>
              <TimeDropdownSubtitle>
                Choose when you&apos;d like to take a class. You can pick more
                than one.
              </TimeDropdownSubtitle>
            </TimeDropdownIntro>
            <TimeOptionList>
              {exploreTimePreferencesList.map((t) => {
                const selected = timeDraft.includes(t.id);
                return (
                  <TimeOptionRow
                    key={t.id}
                    type="button"
                    onClick={() => toggleTimeChip(t.id)}
                  >
                    <TimeOptionText>
                      <TimeOptionLabel>{t.label}</TimeOptionLabel>
                      <TimeOptionSub>{t.sub}</TimeOptionSub>
                    </TimeOptionText>
                    <TimeRowCheckbox $checked={selected} aria-hidden>
                      {selected ? (
                        <Check size={14} strokeWidth={3} aria-hidden />
                      ) : null}
                    </TimeRowCheckbox>
                  </TimeOptionRow>
                );
              })}
            </TimeOptionList>
            <DropdownFooter>
              <DropdownClearLink type="button" onClick={() => setTimeDraft([])}>
                Clear all
              </DropdownClearLink>
              <ExploreShowResultsButton
                type="button"
                $compact
                onClick={applyTimeDesktop}
                disabled={barPreviewLoading}
                aria-busy={barPreviewLoading}
              >
                <ExploreResultsPrimaryLabel
                  loading={barPreviewLoading}
                  label={formatShowResultsLabel(showResultsCount)}
                />
              </ExploreShowResultsButton>
            </DropdownFooter>
          </ExploreDropdownPanel>
        )}
      </BarOuter>

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        currentSortBy={currentSortBy}
        onApplyChanges={onApplyModalChanges}
        classesForDistribution={classes}
        totalClassesCount={totalClassesCount}
        previewFilterModalCount={previewFilterModalCount}
      />

      <ExploreExperienceTypeDrawer
        open={!isDesktopBar && typeDrawerOpen}
        onOpenChange={setTypeDrawerOpen}
        collectionsIWant={sortedIWant}
        currentCollections={currentCollections}
        onApplyCollection={onCollectionChange}
        totalClassesCount={totalClassesCount}
        previewExploreBarCount={previewExploreBarCount}
      />

      <ExploreTimeOfDayDrawer
        open={!isDesktopBar && timeDrawerOpen}
        onOpenChange={setTimeDrawerOpen}
        selectedTimePreferenceIds={filters?.timePreference || []}
        onApplyTimePreferences={onApplyTimePreferences}
        totalClassesCount={totalClassesCount}
        previewExploreBarCount={previewExploreBarCount}
      />
    </>
  );
}

function ExploreCategories(props) {
  return (
    <Suspense fallback={<div style={{ minHeight: "56px" }} />}>
      <ExploreCategoriesContent {...props} />
    </Suspense>
  );
}

export default memo(ExploreCategories);
