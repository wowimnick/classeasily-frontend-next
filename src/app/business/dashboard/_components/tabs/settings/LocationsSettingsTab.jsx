"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { Button, Modal, Form, Input, Switch, Tag, message, Grid } from "antd";
import { Plus, Pencil, Trash2, MapPin, Search, X } from "lucide-react";
import { Drawer as VaulDrawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  useMap,
} from "react-leaflet";
import debounce from "lodash/debounce";
import "leaflet/dist/leaflet.css";
import { businessService } from "@/services/apiService";
import { formatBusinessLocationLine } from "@/lib/formatBusinessLocationLine";

const GEOCODE_URL = "https://geocoding.classeasily.com/address-autocomplete-proxy";
const SEARCH_DEBOUNCE_MS = 300;
const MAP_ZOOM = 13;
const MAP_CIRCLE_RADIUS = 1000;
/** Above BusinessSettings / other Vaul drawers (~1050) so Modal + confirm are clickable */
const LOCATION_MODAL_Z_INDEX = 1200;

const MapCenterHandler = ({ center }) => {
  const map = useMap();
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) clearTimeout(ref.current);
    if (!center || !Array.isArray(center) || center.length !== 2) return;
    const [lat, lon] = center;
    if (
      typeof lat !== "number" ||
      Number.isNaN(lat) ||
      lat < -90 ||
      lat > 90 ||
      typeof lon !== "number" ||
      Number.isNaN(lon) ||
      lon < -180 ||
      lon > 180 ||
      !map
    )
      return;
    ref.current = setTimeout(() => {
      try {
        if (map?.getContainer()) {
          map.invalidateSize();
          map.setView([lat, lon], MAP_ZOOM);
        }
      } catch {
        /* silent */
      }
    }, 100);
    return () => clearTimeout(ref.current);
  }, [center, map]);
  return null;
};

const MapSizeHandler = () => {
  const map = useMap();
  const ref = useRef(null);
  useEffect(() => {
    const handle = () => {
      if (ref.current) clearTimeout(ref.current);
      ref.current = setTimeout(() => {
        try {
          if (map?.getContainer()) map.invalidateSize();
        } catch {
          /* silent */
        }
      }, 100);
    };
    handle();
    let obs;
    try {
      obs = new ResizeObserver(handle);
      const c = map.getContainer();
      if (c) obs.observe(c);
    } catch {
      /* silent */
    }
    return () => {
      if (ref.current) clearTimeout(ref.current);
      obs?.disconnect();
    };
  }, [map]);
  return null;
};

/* ─── Page shell (matches GeneralSettingsTab SectionCard) ─── */

const SectionCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
`;

/* Matches GeneralSettingsTab SectionHeader (no action button in header row) */
const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
`;

const SectionTitleBlock = styled.div``;

const SectionIconBox = styled.div`
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #374151;
`;

const SectionTitle = styled.div`
  font-size: 14.5px;
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
`;

const SectionSubtitle = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 1px;
`;

const SectionBody = styled.div`
  padding: 14px 20px;
`;

const ListToolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
`;

const LocationCardsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LocationCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;

  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
`;

const LocationCardIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 7px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #ef4444;
`;

const LocationCardMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const LocationCardTitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`;

const LocationCardName = styled.span`
  font-size: 13.5px;
  font-weight: 600;
  color: #111827;
`;

const LocationCardAddress = styled.div`
  font-size: 12.5px;
  color: #6b7280;
  line-height: 1.4;
`;

const LocationCardFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const LocationCardMeta = styled.span`
  font-size: 12px;
  color: #9ca3af;
`;

const LocationCardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const EmptyStateWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 28px 20px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background: #fafafa;
`;

const EmptyStateIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  margin-bottom: 12px;
`;

const EmptyStateTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
`;

const EmptyStateDesc = styled.div`
  font-size: 12.5px;
  color: #6b7280;
  max-width: 300px;
  line-height: 1.45;
  margin-bottom: 14px;
`;

const shimmer = keyframes`
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
`;

const SkeletonBlock = styled.div`
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    #f3f4f6 0%,
    #eceef2 40%,
    #f3f4f6 80%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.35s ease-in-out infinite;
`;

const SkeletonCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const SkeletonIcon = styled(SkeletonBlock)`
  width: 36px;
  height: 36px;
  border-radius: 7px;
  flex-shrink: 0;
`;

const SkeletonLines = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SkeletonLine = styled(SkeletonBlock)`
  height: 12px;
  max-width: ${(p) => p.$w || "100%"};
`;

const LocationsListSkeleton = () => (
  <LocationCardsStack aria-busy="true" aria-label="Loading locations">
    {[0, 1, 2].map((i) => (
      <SkeletonCard key={i}>
        <SkeletonIcon />
        <SkeletonLines>
          <SkeletonLine $w="45%" />
          <SkeletonLine $w="92%" />
          <SkeletonLine $w="35%" />
        </SkeletonLines>
      </SkeletonCard>
    ))}
  </LocationCardsStack>
);

/* Mobile location editor (Vaul) — aligned with BusinessSettings bottom sheet */
const LocDrawerOverlay = styled(VaulDrawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: ${LOCATION_MODAL_Z_INDEX};
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const LocDrawerContent = styled(VaulDrawer.Content)`
  background: #fff;
  display: flex;
  flex-direction: column;
  border-radius: 20px 20px 0 0;
  max-height: 92vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: ${LOCATION_MODAL_Z_INDEX + 1};
  outline: none;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
`;

const LocDrawerHandle = styled(VaulDrawer.Handle)`
  width: 40px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 10px auto 6px;
  flex-shrink: 0;
`;

const LocDrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px 12px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
`;

const LocDrawerTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
`;

const LocDrawerClose = styled(Button)`
  padding: 6px;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
`;

const LocDrawerScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 16px;
  -webkit-overflow-scrolling: touch;
`;

const LocDrawerFooter = styled.div`
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
  border-top: 1px solid #e5e7eb;
  background: #fff;
  flex-shrink: 0;

  .ant-btn {
    min-width: 100px;
  }
`;

/* ─── Modal / ALS ─── */

const SectionLabel = styled.div`
  font-size: 10.5px;
  font-weight: 700;
  color: #98a2b3;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 10px;
  margin-top: ${(p) => (p.$first ? "0" : "14px")};
`;

const FieldLabel = styled.label`
  font-size: 12.5px;
  font-weight: 600;
  color: #344054;
  display: block;
  margin-bottom: 4px;
`;

const FieldHint = styled.p`
  font-size: 11.5px;
  color: #98a2b3;
  margin: 6px 0 0;
  line-height: 1.5;
`;

const SearchWrapper = styled.div`
  position: relative;
`;

const Dropdown = styled(motion.div)`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  z-index: 1052;
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
`;

const DropdownItem = styled(motion.div)`
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
  color: #374151;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: #f9fafb;
  }
`;

const MapWrap = styled.div`
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  margin-top: 8px;
  .leaflet-container {
    height: 100%;
    width: 100%;
  }
  .leaflet-control-attribution {
    display: none !important;
  }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const SearchSuffixSpin = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: ${spin} 0.65s linear infinite;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f2f4f7;

  &:last-of-type {
    border-bottom: none;
  }
`;

const ToggleRowText = styled.div`
  flex: 1;
  min-width: 0;
`;

const ToggleRowLabel = styled.div`
  font-size: 12.5px;
  font-weight: 600;
  color: #344054;
`;

/**
 * Manage multiple physical locations; primary syncs to legacy profile address fields.
 */
export default function LocationsSettingsTab({
  onLocationsChanged,
  nestedInParentDrawer = false,
}) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const showExactPin = Form.useWatch("show_exact_location", form);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mapCoords, setMapCoords] = useState(null);
  const [mapKey] = useState(() => `bl-${Date.now()}`);
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const MobileDrawerRoot = nestedInParentDrawer ? VaulDrawer.NestedRoot : VaulDrawer.Root;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await businessService.getBusinessLocations();
    if (res.success && Array.isArray(res.data)) {
      setLocations(res.data);
    } else {
      message.error(res.error || "Could not load locations");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim() || query.length < 3) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      try {
        const r = await fetch(`${GEOCODE_URL}?text=${encodeURIComponent(query)}`);
        if (!r.ok) throw new Error("search failed");
        const data = await r.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS),
    [],
  );

  const onSearchChange = (e) => {
    const v = e.target.value;
    setSearchValue(v);
    if (!v.trim()) {
      setMapCoords(null);
      setSearchResults([]);
      setIsSearching(false);
      form.setFieldsValue({
        address: "",
        city: "",
        state: "",
        zip_code: "",
        latitude: null,
        longitude: null,
      });
      return;
    }
    setIsSearching(true);
    debouncedSearch(v);
  };

  const onPickResult = (result) => {
    const { displayName, coordinates, city, state, zipCode } = result;
    const { lat, lng } = coordinates || {};
    if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng))
      return;
    const rLat = Math.round(lat * 1e7) / 1e7;
    const rLon = Math.round(lng * 1e7) / 1e7;
    setMapCoords([rLat, rLon]);
    setSearchValue(displayName);
    setSearchResults([]);
    form.setFieldsValue({
      address: displayName,
      latitude: rLat,
      longitude: rLon,
      city: city || "",
      state: state || "",
      zip_code: zipCode || "",
    });
  };

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      show_exact_location: true,
      is_primary: false,
      is_active: true,
    });
    setSearchValue("");
    setMapCoords(null);
    setSearchResults([]);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    const lat =
      row.latitude != null ? Number(row.latitude) : row.point?.y ?? null;
    const lng =
      row.longitude != null ? Number(row.longitude) : row.point?.x ?? null;
    const coords =
      lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)
        ? [lat, lng]
        : null;
    form.setFieldsValue({
      name: row.name,
      address: row.address,
      unit: row.unit || "",
      city: row.city || "",
      state: row.state || "",
      zip_code: row.zip_code || "",
      latitude: coords ? coords[0] : null,
      longitude: coords ? coords[1] : null,
      show_exact_location: row.show_exact_location !== false,
      is_primary: !!row.is_primary,
    });
    setSearchValue(row.address || "");
    setMapCoords(coords);
    setSearchResults([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const submitModal = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const payload = {
        name: v.name.trim(),
        address: (v.address || "").trim(),
        unit: (v.unit || "").trim() || "",
        city: (v.city || "").trim(),
        state: (v.state || "").trim(),
        zip_code: (v.zip_code || "").trim(),
        latitude: v.latitude != null ? Number(v.latitude) : null,
        longitude: v.longitude != null ? Number(v.longitude) : null,
        show_exact_location: v.show_exact_location !== false,
        is_primary: !!v.is_primary,
        is_active: true,
      };
      let res;
      if (editingId) {
        res = await businessService.updateBusinessLocation(editingId, payload);
      } else {
        res = await businessService.createBusinessLocation(payload);
      }
      if (res.success) {
        message.success(editingId ? "Location updated" : "Location added");
        closeModal();
        await load();
        onLocationsChanged?.();
      } else {
        message.error(
          typeof res.error === "object"
            ? res.error?.detail || JSON.stringify(res.error)
            : res.error || "Save failed",
        );
      }
    } catch (e) {
      if (e?.errorFields) return;
      message.error("Could not save location");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (row) => {
    const n = row.assigned_classes_count ?? 0;
    Modal.confirm({
      zIndex: LOCATION_MODAL_Z_INDEX,
      title: n > 0 ? "Deactivate location?" : "Delete location?",
      content:
        n > 0
          ? `This location is used by ${n} class(es). It will be deactivated instead of deleted. Classes keep their address until you edit them.`
          : "Remove this location permanently?",
      okText: n > 0 ? "Deactivate" : "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await businessService.deleteBusinessLocation(row.id);
        if (res.success) {
          message.success(res.deactivated ? "Location deactivated" : "Location removed");
          await load();
          onLocationsChanged?.();
        } else {
          message.error(res.error?.detail || res.error || "Failed");
        }
      },
    });
  };

  const countLabel = (n) => {
    const c = n ?? 0;
    return `${c} class${c === 1 ? "" : "es"}`;
  };

  const editorFields = (
    <>
      <div>
        <FieldLabel htmlFor="loc-name">Location name</FieldLabel>
        <Form.Item
          name="name"
          rules={[{ required: true, message: "Name is required" }]}
          style={{ marginBottom: 0 }}
        >
          <Input id="loc-name" size="middle" placeholder="e.g. Downtown Studio" />
        </Form.Item>
      </div>

      <div>
        <FieldLabel style={{ marginTop: 8, marginBottom: 0 }} htmlFor="loc-search">Search address</FieldLabel>
        <FieldHint style={{ marginTop: 0, marginBottom: 6 }}>
          Type 3+ characters, choose a result — it fills the field and map.
        </FieldHint>
        <SearchWrapper>
          <Input
            id="loc-search"
            placeholder="Search for an address"
            value={searchValue}
            onChange={onSearchChange}
            onBlur={() => setTimeout(() => setSearchResults([]), 200)}
            suffix={isSearching ? <SearchSuffixSpin aria-hidden /> : <Search size={15} color="#9ca3af" />}
          />
          <AnimatePresence>
            {searchResults.length > 0 && (
              <Dropdown
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {searchResults.map((r, i) => (
                  <DropdownItem key={i} onMouseDown={() => onPickResult(r)}>
                    <MapPin size={14} color="#ef4444" />
                    {r.displayName}
                  </DropdownItem>
                ))}
              </Dropdown>
            )}
          </AnimatePresence>
        </SearchWrapper>
      </div>

      <div style={{ marginTop: 10 }}>
        <FieldLabel htmlFor="loc-unit">Unit / suite (optional)</FieldLabel>
        <Form.Item name="unit" style={{ marginBottom: 0 }}>
          <Input id="loc-unit" size="middle" placeholder="Unit 201" />
        </Form.Item>
      </div>

      <Form.Item
        name="address"
        hidden
        rules={[{ required: true, message: "Search and select an address from the results" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="city"
        hidden
        rules={[{ required: true, message: "Search and select an address from the results" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="state"
        hidden
        rules={[{ required: true, message: "Search and select an address from the results" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="zip_code" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="latitude" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="longitude" hidden>
        <Input />
      </Form.Item>

      {mapCoords && (
        <MapWrap>
          <MapContainer
            key={`${mapKey}-${mapCoords[0]}-${mapCoords[1]}`}
            center={mapCoords}
            zoom={MAP_ZOOM}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            {showExactPin !== false ? (
              <CircleMarker
                center={mapCoords}
                radius={8}
                pathOptions={{
                  fillColor: "#ef4444",
                  fillOpacity: 0.9,
                  color: "white",
                  weight: 2,
                }}
              />
            ) : (
              <Circle
                center={mapCoords}
                radius={MAP_CIRCLE_RADIUS}
                pathOptions={{
                  fillColor: "#ef4444",
                  fillOpacity: 0.12,
                  color: "#ef4444",
                  weight: 1.5,
                }}
              />
            )}
            <MapSizeHandler />
            <MapCenterHandler center={mapCoords} />
          </MapContainer>
        </MapWrap>
      )}

      <SectionLabel>Map display</SectionLabel>
      <ToggleRow>
        <ToggleRowText>
          <ToggleRowLabel>Show exact pin on maps</ToggleRowLabel>
          <FieldHint style={{ marginTop: 2 }}>
            When off, customers see an approximate area instead of a precise point.
          </FieldHint>
        </ToggleRowText>
        <Form.Item name="show_exact_location" valuePropName="checked" noStyle>
          <Switch />
        </Form.Item>
      </ToggleRow>
      <ToggleRow>
        <ToggleRowText>
          <ToggleRowLabel>Primary location</ToggleRowLabel>
          <FieldHint style={{ marginTop: 2 }}>
            Syncs with your main business address on public listings.
          </FieldHint>
        </ToggleRowText>
        <Form.Item name="is_primary" valuePropName="checked" noStyle>
          <Switch />
        </Form.Item>
      </ToggleRow>
    </>
  );

  return (
    <SectionCard>
      <SectionHeader>
        <SectionIconBox>
          <MapPin size={16} />
        </SectionIconBox>
        <SectionTitleBlock>
          <SectionTitle>Locations</SectionTitle>
          <SectionSubtitle>Manage venues where you run classes</SectionSubtitle>
        </SectionTitleBlock>
      </SectionHeader>

      <SectionBody>
        {loading ? (
          <LocationsListSkeleton />
        ) : locations.length === 0 ? (
          <EmptyStateWrap>
            <EmptyStateIcon>
              <MapPin size={22} />
            </EmptyStateIcon>
            <EmptyStateTitle>No locations yet</EmptyStateTitle>
            <EmptyStateDesc>
              Add your first venue to get started. You can assign a location when creating or editing a class.
            </EmptyStateDesc>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
              Add location
            </Button>
          </EmptyStateWrap>
        ) : (
          <>
            <ListToolbar>
              <Button type="primary" size="small" icon={<Plus size={15} />} onClick={openCreate}>
                Add location
              </Button>
            </ListToolbar>
            <LocationCardsStack>
            {locations.map((row) => {
              const cardTitle = (row.name || "").trim() || formatBusinessLocationLine(row);
              const cardAddress = formatBusinessLocationLine(row);
              const showAddressLine =
                cardAddress && cardAddress.trim().toLowerCase() !== cardTitle.trim().toLowerCase();
              return (
              <LocationCard key={row.id}>
                <LocationCardIcon>
                  <MapPin size={16} />
                </LocationCardIcon>
                <LocationCardMain>
                  <LocationCardTitleRow>
                    <LocationCardName>{cardTitle}</LocationCardName>
                    {row.is_primary ? <Tag color="blue">Primary</Tag> : null}
                    {row.is_active === false ? <Tag>Inactive</Tag> : null}
                  </LocationCardTitleRow>
                  {showAddressLine ? <LocationCardAddress>{cardAddress}</LocationCardAddress> : null}
                  <LocationCardFooter>
                    <LocationCardMeta>{countLabel(row.assigned_classes_count)}</LocationCardMeta>
                    <LocationCardActions>
                      <Button
                        type="text"
                        size="small"
                        icon={<Pencil size={16} />}
                        onClick={() => openEdit(row)}
                        aria-label="Edit location"
                      />
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<Trash2 size={16} />}
                        onClick={() => confirmDelete(row)}
                        aria-label="Delete location"
                      />
                    </LocationCardActions>
                  </LocationCardFooter>
                </LocationCardMain>
              </LocationCard>
              );
            })}
            </LocationCardsStack>
          </>
        )}
      </SectionBody>

      {isMobile ? (
        <MobileDrawerRoot
          open={modalOpen}
          onOpenChange={(open) => {
            if (!open) closeModal();
          }}
          repositionInputs={false}
        >
          <VaulDrawer.Portal>
            <LocDrawerOverlay />
            <LocDrawerContent>
              <LocDrawerHandle />
              <LocDrawerHeader>
                <LocDrawerTitle>{editingId ? "Edit location" : "Add location"}</LocDrawerTitle>
                <LocDrawerClose
                  type="text"
                  icon={<X size={20} />}
                  onClick={closeModal}
                  aria-label="Close"
                />
              </LocDrawerHeader>
              <LocDrawerScroll>
                <Form form={form} layout="vertical" style={{ marginTop: 0 }}>
                  {editorFields}
                </Form>
              </LocDrawerScroll>
              <LocDrawerFooter>
                <Button htmlType="button" onClick={closeModal} disabled={saving}>
                  Cancel
                </Button>
                <Button htmlType="button" type="primary" loading={saving} onClick={submitModal}>
                  {editingId ? "Save" : "Add location"}
                </Button>
              </LocDrawerFooter>
            </LocDrawerContent>
          </VaulDrawer.Portal>
        </MobileDrawerRoot>
      ) : (
        <Modal
          title={editingId ? "Edit location" : "Add location"}
          open={modalOpen}
          onCancel={closeModal}
          onOk={submitModal}
          confirmLoading={saving}
          width={560}
          destroyOnClose
          zIndex={LOCATION_MODAL_Z_INDEX}
          okText={editingId ? "Save" : "Add location"}
        >
          <Form form={form} layout="vertical" style={{ marginTop: 4 }}>
            {editorFields}
          </Form>
        </Modal>
      )}
    </SectionCard>
  );
}
