import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import { Form, Input, Switch } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Eye, EyeOff, Info, Building, Navigation } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  useMap,
} from "react-leaflet";
import debounce from "lodash/debounce";
import "leaflet/dist/leaflet.css";
import { LoadingSpinner as GlobalSpinner } from "@/components/common/GlobalLoader";

const AWS_LOCATION_API_URL = "https://geocoding.classeasily.com/address-autocomplete-proxy";
const SEARCH_DEBOUNCE_MS = 300;
const MAP_ZOOM_LEVEL = 13;
const MAP_CIRCLE_RADIUS = 1000;

/* ─── Map helpers ────────────────────────────────────────────────── */

const MapCenterHandler = ({ center }) => {
  const map = useMap();
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) clearTimeout(ref.current);
    if (!center || !Array.isArray(center) || center.length !== 2) return;
    const [lat, lon] = center;
    if (
      typeof lat !== "number" || isNaN(lat) || lat < -90 || lat > 90 ||
      typeof lon !== "number" || isNaN(lon) || lon < -180 || lon > 180 ||
      !map
    ) return;
    ref.current = setTimeout(() => {
      try { if (map?.getContainer()) { map.invalidateSize(); map.setView([lat, lon], MAP_ZOOM_LEVEL); } }
      catch { /* silent */ }
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
        try { if (map?.getContainer()) map.invalidateSize(); } catch { /* silent */ }
      }, 100);
    };
    handle();
    let obs;
    try {
      obs = new ResizeObserver(handle);
      const c = map.getContainer();
      if (c) obs.observe(c);
    } catch { /* silent */ }
    return () => { if (ref.current) clearTimeout(ref.current); obs?.disconnect(); };
  }, [map]);
  return null;
};

/* ─── Styled components ──────────────────────────────────────────── */

const SectionCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
`;

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

const SectionTitleBlock = styled.div``;

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
  padding: 18px 20px;
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 20px;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

const FieldGroup = styled.div`
  margin-bottom: 16px;
`;

const FieldLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
  svg { width: 13px; height: 13px; color: #9ca3af; }
`;

const FieldHint = styled.div`
  font-size: 11.5px;
  color: #9ca3af;
  margin-bottom: 6px;
`;

const SearchWrapper = styled.div`
  position: relative;
`;

const Dropdown = styled(motion.div)`
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  z-index: 1052;
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
`;

const DropdownItem = styled(motion.div)`
  padding: 10px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
  color: #374151;
  &:last-child { border-bottom: none; }
  &:hover { background: #f9fafb; }
`;

const SpinBox = styled.div`
  display: flex; align-items: center; justify-content: center; height: 100%;
  > div { width: 18px !important; height: 18px !important; border-width: 2px !important; }
`;

const StyledMapWrapper = styled(motion.div)`
  height: 280px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  margin-bottom: 18px;
  .leaflet-container { height: 100%; width: 100%; }
  .leaflet-control-attribution { display: none !important; }
`;

const VisibilityDivider = styled.div`
  border-top: 1px solid #e5e7eb;
  margin-top: 4px;
  padding-top: 16px;
`;

const VisibilityLabel = styled.div`
  font-size: 12.5px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 3px;
`;

const VisibilityHint = styled.div`
  font-size: 11.5px;
  color: #9ca3af;
  margin-bottom: 10px;
`;

const VisibilityOptions = styled.div`
  display: flex;
  gap: 8px;
`;

const VisibilityOption = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 12px;
  border-radius: 7px;
  border: 1.5px solid ${p => p.$active ? "#111827" : "#e5e7eb"};
  background: ${p => p.$active ? "#111827" : "#ffffff"};
  color: ${p => p.$active ? "#ffffff" : "#374151"};
  font-size: 13px;
  font-weight: ${p => p.$active ? "600" : "500"};
  cursor: pointer;
  transition: all 0.15s;
  svg { width: 14px; height: 14px; }
  &:hover { border-color: #111827; }
`;

/* ─── Component ──────────────────────────────────────────────────── */

const LocationSettingsTab = ({ form, initialData }) => {
  const getCoords = (data) => {
    if (!data) return null;
    const rawLat = data.lat ?? data.latitude;
    const rawLon = data.lon ?? data.longitude;
    if (rawLat == null || rawLon == null) return null;
    const lat = typeof rawLat === "number" ? rawLat : parseFloat(rawLat);
    const lon = typeof rawLon === "number" ? rawLon : parseFloat(rawLon);
    if (!isNaN(lat) && lat >= -90 && lat <= 90 && !isNaN(lon) && lon >= -180 && lon <= 180) {
      return [Math.round(lat * 1e7) / 1e7, Math.round(lon * 1e7) / 1e7];
    }
    return null;
  };

  const getAddress = (data) => data?.businessAddress || data?.location || data?.address || "";

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(getCoords(initialData));
  const [hideExact, setHideExact] = useState(initialData?.hide ?? false);
  const [searchValue, setSearchValue] = useState(getAddress(initialData));
  const mapRef = useRef(null);

  useEffect(() => {
    setSelectedCoords(getCoords(initialData));
    setHideExact(initialData?.hide ?? false);
    setSearchValue(getAddress(initialData));
  }, [initialData]);

  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim() || query.length < 3) { setSearchResults([]); setIsSearching(false); return; }
      try {
        const res = await fetch(`${AWS_LOCATION_API_URL}?text=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch { /* silent */ } finally { setIsSearching(false); }
    }, SEARCH_DEBOUNCE_MS),
    []
  );

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
    setIsSearching(true);
    debouncedSearch(e.target.value);
  };

  const handleLocationSelect = (result) => {
    const { displayName, coordinates, city, state, zipCode } = result;
    const { lat, lng } = coordinates;
    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) return;
    const rLat = Math.round(lat * 1e7) / 1e7;
    const rLon = Math.round(lng * 1e7) / 1e7;
    setSelectedCoords([rLat, rLon]);
    setSearchValue(displayName);
    setSearchResults([]);
    form.setFieldsValue({ location: displayName, latitude: rLat, longitude: rLon, city: city || "", state: state || "", zipCode: zipCode || "" });
  };

  const handleVisibility = (hide) => {
    setHideExact(hide);
    form.setFieldValue("saltLocation", hide);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      name="locationSettingsForm"
      initialValues={{ saltLocation: hideExact, location: searchValue, businessUnit: initialData?.businessUnit || "" }}
      requiredMark="optional"
    >
      <SectionCard>
        <SectionHeader>
          <SectionIconBox><MapPin size={16} /></SectionIconBox>
          <SectionTitleBlock>
            <SectionTitle>Business location</SectionTitle>
            <SectionSubtitle>Set and display your business address on your public listing</SectionSubtitle>
          </SectionTitleBlock>
        </SectionHeader>

        <SectionBody>
          <FieldRow>
            {/* Address search */}
            <FieldGroup>
              <FieldLabel><Search />Search address</FieldLabel>
              <FieldHint>Type and select from the suggestions below</FieldHint>
              <SearchWrapper>
                <Form.Item name="location" rules={[{ required: true, message: "Address is required" }]}>
                  <Input
                    placeholder="Search for your address"
                    value={searchValue}
                    onChange={handleSearchChange}
                    onBlur={() => setTimeout(() => setSearchResults([]), 200)}
                    suffix={
                      isSearching
                        ? <SpinBox><GlobalSpinner /></SpinBox>
                        : <Search size={15} color="#9ca3af" />
                    }
                  />
                </Form.Item>
                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <Dropdown initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                      {searchResults.map((r, i) => (
                        <DropdownItem key={i} onMouseDown={() => handleLocationSelect(r)}>
                          <MapPin size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                          {r.displayName}
                        </DropdownItem>
                      ))}
                    </Dropdown>
                  )}
                </AnimatePresence>
              </SearchWrapper>
            </FieldGroup>

            {/* Unit/Suite */}
            <FieldGroup>
              <FieldLabel><Building />Unit / Suite (optional)</FieldLabel>
              <FieldHint>Floor, unit, or suite number</FieldHint>
              <Form.Item name="businessUnit">
                <Input placeholder="e.g., Unit 201" />
              </Form.Item>
            </FieldGroup>
          </FieldRow>

          {/* Hidden form fields */}
          <Form.Item name="latitude" noStyle><Input type="hidden" /></Form.Item>
          <Form.Item name="longitude" noStyle><Input type="hidden" /></Form.Item>
          <Form.Item name="saltLocation" noStyle valuePropName="checked"><Switch style={{ display: "none" }} /></Form.Item>
          <Form.Item name="city" noStyle><Input type="hidden" /></Form.Item>
          <Form.Item name="state" noStyle><Input type="hidden" /></Form.Item>
          <Form.Item name="zipCode" noStyle><Input type="hidden" /></Form.Item>

          {/* Map */}
          <AnimatePresence>
            {selectedCoords && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <StyledMapWrapper>
                  <MapContainer
                    key={`${selectedCoords[0]}-${selectedCoords[1]}`}
                    center={selectedCoords}
                    zoom={MAP_ZOOM_LEVEL}
                    ref={mapRef}
                    scrollWheelZoom={false}
                    whenReady={() => setTimeout(() => { if (mapRef.current?.getContainer()) mapRef.current.invalidateSize(); }, 200)}
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    {hideExact ? (
                      <Circle center={selectedCoords} radius={MAP_CIRCLE_RADIUS} pathOptions={{ fillColor: "#ef4444", fillOpacity: 0.12, color: "#ef4444", weight: 1.5 }} />
                    ) : (
                      <CircleMarker center={selectedCoords} radius={8} pathOptions={{ fillColor: "#ef4444", fillOpacity: 0.9, color: "white", weight: 2 }} />
                    )}
                    <MapSizeHandler />
                    <MapCenterHandler center={selectedCoords} />
                  </MapContainer>
                </StyledMapWrapper>

                {/* Visibility toggle */}
                <VisibilityDivider>
                  <VisibilityLabel>Location display</VisibilityLabel>
                  <VisibilityHint>Choose how your location appears to customers on the map</VisibilityHint>
                  <VisibilityOptions>
                    <VisibilityOption type="button" $active={!hideExact} onClick={() => handleVisibility(false)}>
                      <Eye /> Show exact location
                    </VisibilityOption>
                    <VisibilityOption type="button" $active={hideExact} onClick={() => handleVisibility(true)}>
                      <EyeOff /> Show general area
                    </VisibilityOption>
                  </VisibilityOptions>
                </VisibilityDivider>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prompt when no address yet */}
          {!selectedCoords && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0", color: "#9ca3af" }}>
              <Navigation size={16} />
              <span style={{ fontSize: 13 }}>Search for an address above to see it on the map</span>
            </div>
          )}
        </SectionBody>
      </SectionCard>
    </Form>
  );
};

export default LocationSettingsTab;
