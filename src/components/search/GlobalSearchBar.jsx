"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { Input, Skeleton, Button } from "antd";
import debounce from "lodash/debounce";
import { Search, X, Layers, Compass } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

import { searchService } from "@/services/apiService";
import { useSearch } from "@/context/SearchContext";
import { publicAnalyticsService } from "@/services/adminDash";

const EMPTY = { collections: [], classes: [] };

function normalizeKey(q, lat, lng) {
  return `${String(q).trim().toLowerCase()}|${lat ?? ""}|${lng ?? ""}`;
}

const LRU_MAX = 50;
const CACHE_TTL_MS = 60_000;
const suggestCache = new Map();

function cacheGet(key) {
  const row = suggestCache.get(key);
  if (!row) return null;
  if (Date.now() - row.ts > CACHE_TTL_MS) {
    suggestCache.delete(key);
    return null;
  }
  return row.data;
}

function cacheSet(key, data) {
  if (suggestCache.size >= LRU_MAX) {
    const firstKey = suggestCache.keys().next().value;
    suggestCache.delete(firstKey);
  }
  suggestCache.set(key, { data, ts: Date.now() });
}

function getSessionId() {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem("ce_search_session");
    if (!id) {
      id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem("ce_search_session", id);
    }
    return id;
  } catch {
    return "";
  }
}

function formatCad(n) {
  if (n == null || n === "") return null;
  const num = Number(n);
  if (Number.isNaN(num)) return null;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(num);
}

function buildCollectionHref(variant, slug) {
  if (typeof window !== "undefined" && variant === "explore") {
    const p = new URLSearchParams(window.location.search);
    p.set("collection", slug);
    p.delete("keyword");
    const path = window.location.pathname.startsWith("/explore")
      ? `${window.location.pathname}?${p.toString()}`
      : `/explore?${p.toString()}`;
    return path;
  }
  const params = new URLSearchParams({
    collection: slug,
    participants: "1",
    location: "Toronto, ON",
    lat: "43.6532",
    lng: "-79.3832",
  });
  return `/explore?${params.toString()}`;
}

const Wrap = styled.div`
  position: relative;
  width: 100%;
  max-width: ${(p) => (p.$compact ? "none" : "520px")};
  min-width: 0;
`;

const DesktopWrap = styled.div`
  display: flex;
  width: 100%;
  min-width: 0;
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileTrigger = styled.button`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    flex-shrink: 0;
    color: ${(p) => p.$iconColor ?? "#111"};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
`;

const Dropdown = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  background: #fff;
  border-radius: 12px;
  box-shadow:
    0 12px 40px rgba(15, 23, 42, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.06);
  z-index: 10020;
  max-height: ${(p) => (p.$compact ? "min(60vh, 340px)" : "min(70vh, 420px)")};
  overflow: auto;
  padding: ${(p) => (p.$compact ? "6px 0" : "8px 0")};
`;

const SectionLabel = styled.div`
  font-size: ${(p) => (p.$compact ? "10px" : "11px")};
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
  padding: ${(p) => (p.$compact ? "6px 12px 3px" : "8px 14px 4px")};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Row = styled.button`
  width: 100%;
  border: none;
  background: ${(p) => (p.$active ? "rgba(251, 34, 67, 0.08)" : "transparent")};
  cursor: pointer;
  text-align: left;
  padding: ${(p) => (p.$compact ? "7px 12px" : "10px 14px")};
  display: flex;
  align-items: center;
  gap: ${(p) => (p.$compact ? "9px" : "12px")};
  font: inherit;
  color: #0f172a;

  &:hover {
    background: rgba(15, 23, 42, 0.04);
  }
`;

const RowThumb = styled.div`
  width: ${(p) => (p.$compact ? "34px" : "44px")};
  height: ${(p) => (p.$compact ? "34px" : "44px")};
  border-radius: ${(p) => (p.$compact ? "8px" : "10px")};
  flex-shrink: 0;
  overflow: hidden;
  background: #f1f5f9;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RowMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

const RowTitle = styled.div`
  font-weight: 600;
  font-size: ${(p) => (p.$compact ? "13px" : "14px")};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RowSub = styled.div`
  font-size: ${(p) => (p.$compact ? "11px" : "12px")};
  color: #64748b;
  margin-top: ${(p) => (p.$compact ? "1px" : "2px")};
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: #fff;
  z-index: 10050;
  display: flex;
  flex-direction: column;
  padding: 12px 16px env(safe-area-inset-bottom, 12px);
`;

const OverlayTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

/**
 * Keyword search for classes + collections (Explore uses variant="explore").
 */
export default function GlobalSearchBar({
  variant = "home",
  /** Home header: light-on-dark before scroll */
  inverseColors = false,
}) {
  const isHomeKeyword = variant === "home-keyword";
  const router = useRouter();
  const listboxId = useId();
  const { selectedLocation, searchTerm } = useSearch();

  const coords = selectedLocation?.coordinates;
  const lat = coords?.lat ?? null;
  const lng = coords?.lng ?? null;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [mobileOpen, setMobileOpen] = useState(false);

  const requestGen = useRef(0);
  const abortRef = useRef(null);
  const rootRef = useRef(null);
  const desktopInputRef = useRef(null);
  const mobileInputRef = useRef(null);

  const collections = results?.collections ?? [];
  const classes = results?.classes ?? [];
  const flatLength = collections.length + classes.length;

  const fetchRemote = useCallback(
    async (rawQ) => {
      const q = rawQ.trim();
      if (!q) {
        setResults(EMPTY);
        setLoading(false);
        return;
      }

      const key = normalizeKey(q, lat, lng);
      const cached = cacheGet(key);
      if (cached) {
        setResults(cached);
        setLoading(false);
        setError(null);
        return;
      }

      requestGen.current += 1;
      const myGen = requestGen.current;
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setLoading(true);
      setError(null);

      try {
        const data = await searchService.suggest({
          q,
          limit: 8,
          lat,
          lng,
          signal: ac.signal,
        });
        if (myGen !== requestGen.current) return;
        cacheSet(key, data);
        setResults(data);
      } catch (e) {
        if (axios.isCancel(e) || e?.code === "ERR_CANCELED") return;
        if (myGen !== requestGen.current) return;
        setError(e?.message || "Search failed");
        setResults(EMPTY);
      } finally {
        if (myGen === requestGen.current) setLoading(false);
      }
    },
    [lat, lng],
  );

  const debouncedFetch = useMemo(
    () => debounce((q) => fetchRemote(q), 300),
    [fetchRemote],
  );

  useEffect(() => () => debouncedFetch.cancel(), [debouncedFetch]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      debouncedFetch.cancel();
      setResults(null);
      setLoading(false);
      setError(null);
      setActiveIndex(-1);
      return;
    }
    const key = normalizeKey(q, lat, lng);
    const hit = cacheGet(key);
    if (hit) {
      setResults(hit);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
    }
    debouncedFetch(q);
  }, [query, lat, lng, debouncedFetch]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onDocKey = (e) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        if (window.matchMedia("(max-width: 768px)").matches) {
          setMobileOpen(true);
          setOpen(true);
          queueMicrotask(() => mobileInputRef.current?.focus());
        } else {
          desktopInputRef.current?.focus();
          setOpen(true);
        }
      }
    };
    document.addEventListener("keydown", onDocKey);
    return () => document.removeEventListener("keydown", onDocKey);
  }, []);

  const logSelect = useCallback(
    (q, total) => {
      const locStr = searchTerm || selectedLocation?.displayName || "";
      let province = "";
      const m = locStr.match(/\b([A-Z]{2})\s*$/);
      if (m) province = m[1];
      void publicAnalyticsService.logSearch({
        query: q.slice(0, 255),
        location: locStr.slice(0, 255),
        province: province.slice(0, 50),
        latitude: lat != null ? Number(lat) : null,
        longitude: lng != null ? Number(lng) : null,
        session_id: getSessionId().slice(0, 100),
        results_count: total,
      });
    },
    [lat, lng, searchTerm, selectedLocation?.displayName],
  );

  const navigateCollection = useCallback(
    (slug) => {
      const href = buildCollectionHref(variant, slug);
      router.push(href);
      setOpen(false);
      setMobileOpen(false);
      setQuery("");
    },
    [router, variant],
  );

  const navigateClass = useCallback(
    (slug) => {
      router.push(`/classes/${slug}`);
      setOpen(false);
      setMobileOpen(false);
      setQuery("");
    },
    [router],
  );

  const onPickIndex = useCallback(
    (idx) => {
      const q = query.trim();
      if (idx < 0 || idx >= flatLength || !q) return;
      const nc = collections.length;
      let total = 0;
      if (idx < nc) {
        const slug = collections[idx]?.slug;
        if (slug) {
          total = collections.length + classes.length;
          logSelect(q, total);
          navigateCollection(slug);
        }
        return;
      }
      const c = classes[idx - nc];
      if (c?.slug) {
        total = collections.length + classes.length;
        logSelect(q, total);
        navigateClass(c.slug);
      }
    },
    [
      classes,
      collections,
      flatLength,
      logSelect,
      navigateClass,
      navigateCollection,
      query,
    ],
  );

  const onKeyDown = (e) => {
    if (!open && !mobileOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setMobileOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flatLength === 0) return;
      setActiveIndex((i) => (i + 1) % flatLength);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flatLength === 0) return;
      setActiveIndex((i) => (i - 1 + flatLength) % flatLength);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      onPickIndex(activeIndex >= 0 ? activeIndex : 0);
    }
  };

  const placeholder = isHomeKeyword
    ? "Try Pottery, pizza night, painting…"
    : "Search classes & collections…";

  const lightOnDark = inverseColors && !isHomeKeyword;
  const inputStyle = {
    borderRadius: 999,
    background: isHomeKeyword
      ? "#ffffff"
      : lightOnDark
        ? "rgba(255,255,255,0.12)"
        : "#f8fafc",
    borderColor: isHomeKeyword
      ? "#e5e7eb"
      : lightOnDark
        ? "rgba(255,255,255,0.35)"
        : "#e2e8f0",
    color: isHomeKeyword ? "#111111" : lightOnDark ? "#fff" : "#0f172a",
    boxShadow: isHomeKeyword ? "0 4px 16px rgba(0,0,0,0.08)" : undefined,
  };

  const dropdownContent = (
    <>
      {loading && (
        <div style={{ padding: "12px 14px" }}>
          <Skeleton active paragraph={{ rows: 3 }} title={false} />
        </div>
      )}
      {!loading && error && (
        <div style={{ padding: "12px 14px" }}>
          <div style={{ color: "#b91c1c", marginBottom: 8 }}>{error}</div>
          <Button size="small" onClick={() => fetchRemote(query)}>
            Retry
          </Button>
        </div>
      )}
      {!loading && !error && query.trim() && results && (
        <>
          {collections.length > 0 && (
            <>
              <SectionLabel id={`${listboxId}-col`} $compact={isHomeKeyword}>
                 Collections
              </SectionLabel>
              {collections.map((c, i) => (
                <Row
                  key={`c-${c.slug}`}
                  id={`global-search-opt-${i}`}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === i}
                  $active={activeIndex === i}
                  $compact={isHomeKeyword}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => {
                    setActiveIndex(i);
                    onPickIndex(i);
                  }}
                >
                  <RowThumb $compact={isHomeKeyword}>
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt="" />
                    ) : (
                      <Layers
                        size={isHomeKeyword ? 18 : 22}
                        style={{
                          margin: isHomeKeyword ? "8px auto" : "10px auto",
                          display: "block",
                          color: "#94a3b8",
                        }}
                      />
                    )}
                  </RowThumb>
                  <RowMeta>
                    <RowTitle $compact={isHomeKeyword}>{c.name}</RowTitle>
                    <RowSub $compact={isHomeKeyword}>
                      {typeof c.count === "number"
                        ? `${c.count} class${c.count === 1 ? "" : "es"}`
                        : ""}
                    </RowSub>
                  </RowMeta>
                </Row>
              ))}
            </>
          )}
          {classes.length > 0 && (
            <>
              <SectionLabel id={`${listboxId}-cls`} $compact={isHomeKeyword}>
                <Compass size={14} aria-hidden /> Classes
              </SectionLabel>
              {classes.map((cl, j) => {
                const idx = collections.length + j;
                return (
                  <Row
                    key={`cl-${cl.id}`}
                    id={`global-search-opt-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === idx}
                    $active={activeIndex === idx}
                    $compact={isHomeKeyword}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      setActiveIndex(idx);
                      onPickIndex(idx);
                    }}
                  >
                    <RowThumb $compact={isHomeKeyword}>
                      {cl.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cl.thumbnail} alt="" />
                      ) : (
                        <Compass
                          size={isHomeKeyword ? 18 : 22}
                          style={{
                            margin: isHomeKeyword ? "8px auto" : "10px auto",
                            display: "block",
                            color: "#94a3b8",
                          }}
                        />
                      )}
                    </RowThumb>
                    <RowMeta>
                      <RowTitle $compact={isHomeKeyword}>{cl.title}</RowTitle>
                      <RowSub $compact={isHomeKeyword}>
                        {[cl.business_name, formatCad(cl.price_from)]
                          .filter(Boolean)
                          .join(" · ")}
                      </RowSub>
                    </RowMeta>
                  </Row>
                );
              })}
            </>
          )}
          {collections.length === 0 &&
            classes.length === 0 &&
            !loading && (
              <div
                style={{ padding: "20px 14px", color: "#64748b", fontSize: 14 }}
              >
                No results for &ldquo;{query.trim()}&rdquo;
              </div>
            )}
        </>
      )}
    </>
  );

  useEffect(() => {
    if (!open || mobileOpen) return;
    const close = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, mobileOpen]);

  const sharedInputProps = {
    allowClear: true,
    placeholder,
    value: query,
    onChange: (e) => {
      setQuery(e.target.value);
      setOpen(true);
      setActiveIndex(-1);
    },
    onFocus: () => setOpen(true),
    onKeyDown,
    prefix: <Search size={16} aria-hidden />,
    role: "combobox",
    "aria-expanded": open || mobileOpen,
    "aria-autocomplete": "list",
    style: inputStyle,
  };

  const mobilePortal =
    mobileOpen &&
    typeof document !== "undefined" &&
    createPortal(
      <Overlay role="dialog" aria-modal="true" aria-label="Search classes and collections">
        <OverlayTop>
          <Button
            type="text"
            icon={<X size={20} />}
            onClick={() => {
              setMobileOpen(false);
              setOpen(false);
              setActiveIndex(-1);
            }}
            aria-label="Close search"
          />
          <div style={{ flex: 1 }}>
            <Input
              {...sharedInputProps}
              ref={mobileInputRef}
              aria-controls={`${listboxId}-mobile`}
              autoFocus
              size="large"
            />
          </div>
        </OverlayTop>
        <div
          id={`${listboxId}-mobile`}
          role="listbox"
          aria-label="Search suggestions"
          style={{ flex: 1, overflow: "auto", borderTop: "1px solid #f1f5f9" }}
        >
          {dropdownContent}
        </div>
      </Overlay>,
      document.body,
    );

  return (
    <Wrap ref={rootRef} $compact={false}>
      <DesktopWrap>
        <Input
          {...sharedInputProps}
          ref={desktopInputRef}
          aria-controls={`${listboxId}-desktop`}
          size="middle"
        />
        {(open || loading) && query.trim() && !mobileOpen && (
          <Dropdown id={`${listboxId}-desktop`} role="listbox" $compact={isHomeKeyword}>
            {dropdownContent}
          </Dropdown>
        )}
      </DesktopWrap>

      {!isHomeKeyword && (
        <MobileTrigger
          type="button"
          aria-label="Open keyword search"
          $iconColor={inverseColors ? "#fff" : "#111"}
          onClick={() => {
            setMobileOpen(true);
            setOpen(true);
            queueMicrotask(() => mobileInputRef.current?.focus());
          }}
        >
          <Search size={18} strokeWidth={2.5} />
        </MobileTrigger>
      )}

      {!isHomeKeyword && mobilePortal}
    </Wrap>
  );
}
