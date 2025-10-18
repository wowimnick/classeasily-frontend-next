import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import { Form, Input, Switch, Row, Col } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Eye, EyeOff, Info, Building } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  useMap,
} from "react-leaflet";
import debounce from "lodash/debounce";
import "leaflet/dist/leaflet.css";

import {
  FormGroup,
  FormLabel,
  HelpText,
  SectionDivider,
  FormSectionCard,
} from "./BusinessSettings";

// Import the custom loader
import { LoadingSpinner as GlobalSpinner } from "@/components/common/GlobalLoader";

const AWS_LOCATION_API_URL =
  "https://geocoding.classeasily.com/address-autocomplete-proxy";
const SEARCH_DEBOUNCE_MS = 300;
const MAP_ZOOM_LEVEL = 13;
const MAP_CIRCLE_RADIUS = 1000;

const MapCenterHandler = ({ center }) => {
  const map = useMap();
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!center || !Array.isArray(center) || center.length !== 2) {
      return;
    }
    const [lat, lon] = center;
    const isValidLat =
      typeof lat === "number" && !isNaN(lat) && lat >= -90 && lat <= 90;
    const isValidLon =
      typeof lon === "number" && !isNaN(lon) && lon >= -180 && lon <= 180;
    if (!isValidLat || !isValidLon || !map) {
      return;
    }
    timeoutRef.current = setTimeout(() => {
      try {
        if (map && map.getContainer()) {
          map.invalidateSize();
          map.setView([lat, lon], MAP_ZOOM_LEVEL);
        }
      } catch (error) {
        // Handle error silently or with a non-console logging mechanism
      }
    }, 100);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [center, map]);

  return null;
};

const MapSizeHandler = () => {
  const map = useMap();
  const resizeTimeoutRef = useRef(null);

  useEffect(() => {
    const handleMapResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        if (map && map.getContainer()) {
          try {
            map.invalidateSize();
          } catch (error) {
            // Handle error silently
          }
        }
      }, 100);
    };
    handleMapResize();
    let observer;
    try {
      observer = new ResizeObserver(handleMapResize);
      const container = map.getContainer();
      if (container) {
        observer.observe(container);
      }
    } catch (error) {
      // Handle error silently
    }
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, [map]);

  return null;
};

// --- Styled Components ---
const SearchWrapper = styled.div`
  position: relative;
`;

const MapSearchResults = styled(motion.div)`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1052;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
`;

const MapSearchResult = styled(motion.div)`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: #f7f7f7;
  }
`;

const MapResultContent = styled.div`
  font-weight: 500;
  color: #333;
`;

const MapWrapper = styled(motion.div)`
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
  margin-top: 16px;
  margin-bottom: 16px;
  .leaflet-container {
    height: 100%;
    width: 100%;
  }
  .leaflet-control-attribution {
    display: none !important;
  }
`;

const ToggleGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

const ToggleButton = styled.button`
  flex: 1;
  padding: 12px;
  font-weight: 500;
  cursor: pointer;
  background: ${(props) =>
    props.$selected ? props.theme.token.colorPrimary : "white"};
  color: ${(props) =>
    props.$selected ? "white" : props.theme.token.colorText};
  border: 1px solid
    ${(props) => (props.$selected ? props.theme.token.colorPrimary : "#ddd")};
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  &:hover {
    border-color: ${(props) => props.theme.token.colorPrimary};
  }
`;

const SpinnerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  & > div {
    /* Override size to fit input suffix */
    width: 20px !important;
    height: 20px !important;
    border-width: 2px !important;
  }
`;

const LocationSettingsTab = ({ form, initialData }) => {
  const getInitialCoords = (data) => {
    if (!data) return null;
    const latValue = data.lat || data.latitude;
    const lonValue = data.lon || data.longitude;

    if (latValue == null || lonValue == null) return null;
    let lat, lon;
    if (typeof latValue === "string") lat = parseFloat(latValue);
    else if (typeof latValue === "number") lat = latValue;
    else if (latValue && typeof latValue.toString === "function")
      lat = parseFloat(latValue.toString());
    else lat = NaN;
    if (typeof lonValue === "string") lon = parseFloat(lonValue);
    else if (typeof lonValue === "number") lon = lonValue;
    else if (lonValue && typeof lonValue.toString === "function")
      lon = parseFloat(lonValue.toString());
    else lon = NaN;
    const isValidLat = !isNaN(lat) && lat >= -90 && lat <= 90;
    const isValidLon = !isNaN(lon) && lon >= -180 && lon <= 180;
    if (isValidLat && isValidLon) {
      const roundedLat = Math.round(lat * 10000000) / 10000000;
      const roundedLon = Math.round(lon * 10000000) / 10000000;
      return [roundedLat, roundedLon];
    }
    return null;
  };

  const getInitialAddress = (data) => {
    const address =
      data?.businessAddress || data?.location || data?.address || "";
    return address;
  };

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedCoords, setSelectedCoords] = useState(
    getInitialCoords(initialData)
  );
  const [hideExactLocation, setHideExactLocation] = useState(
    initialData?.hide ?? false
  );
  const [searchValue, setSearchValue] = useState(
    getInitialAddress(initialData)
  );

  const mapRef = useRef(null);

  useEffect(() => {
    const newCoords = getInitialCoords(initialData);
    const newHide = initialData?.hide ?? false;
    const newAddress = getInitialAddress(initialData);

    setSelectedCoords(newCoords);
    setHideExactLocation(newHide);
    setSearchValue(newAddress);
  }, [initialData]);

  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim() || query.length < 3) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      try {
        const response = await fetch(
          `${AWS_LOCATION_API_URL}?text=${encodeURIComponent(query)}`
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (error) {
        // Handle search error silently
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS),
    []
  );

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchValue(query);
    setIsSearching(true);
    debouncedSearch(query);
  };

  const handleLocationSelect = (result) => {
    const { displayName, coordinates, city, state, zipCode } = result;
    const { lat, lng } = coordinates;

    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      isNaN(lat) ||
      isNaN(lng)
    ) {
      return;
    }

    const roundedLat = Math.round(lat * 10000000) / 10000000;
    const roundedLon = Math.round(lng * 10000000) / 10000000;

    setSelectedCoords([roundedLat, roundedLon]);
    setSearchValue(displayName);
    setSearchResults([]);

    const fieldsToSet = {
      location: displayName,
      latitude: roundedLat,
      longitude: roundedLon,
      city: city || "",
      state: state || "",
      zipCode: zipCode || "",
    };

    form.setFieldsValue(fieldsToSet);
  };

  const handlePrivacyToggle = (type) => {
    const shouldHide = type === "hide";
    setHideExactLocation(shouldHide);
    form.setFieldValue("saltLocation", shouldHide);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      name="locationSettingsForm"
      initialValues={{
        saltLocation: hideExactLocation,
        location: searchValue,
        businessUnit: initialData?.businessUnit || "",
      }}
      requiredMark="optional"
    >
      <FormSectionCard isDrawer={true}>
        <SectionDivider>
          <span>
            <MapPin size={16} /> Business Location
          </span>
        </SectionDivider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <FormGroup>
              <FormLabel>
                <Search /> Search Location
              </FormLabel>
              <HelpText>
                <Info size={14} /> Type your address and select from the
                suggestions.
              </HelpText>
              <SearchWrapper>
                <Form.Item
                  name="location"
                  rules={[
                    { required: true, message: "Location address is required" },
                  ]}
                >
                  <Input
                    placeholder="Search for your address or general area"
                    value={searchValue}
                    onChange={handleSearchChange}
                    onBlur={() => {
                      setTimeout(() => setSearchResults([]), 200);
                    }}
                    suffix={
                      isSearching ? (
                        <SpinnerContainer>
                          <GlobalSpinner />
                        </SpinnerContainer>
                      ) : (
                        <Search size={16} />
                      )
                    }
                  />
                </Form.Item>
                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <MapSearchResults
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {searchResults.map((result, index) => (
                        <MapSearchResult
                          key={index}
                          onMouseDown={() => handleLocationSelect(result)}
                        >
                          <MapPin size={18} style={{ color: "#ff385c" }} />
                          <MapResultContent>
                            {result.displayName}
                          </MapResultContent>
                        </MapSearchResult>
                      ))}
                    </MapSearchResults>
                  )}
                </AnimatePresence>
              </SearchWrapper>
            </FormGroup>
          </Col>
          <Col xs={24} md={12}>
            <FormGroup>
              <FormLabel>
                <Building /> Unit / Suite #
              </FormLabel>
              <HelpText>
                <Info size={14} /> Optional unit number.
              </HelpText>
              <Form.Item name="businessUnit">
                <Input placeholder="e.g., Unit 201" />
              </Form.Item>
            </FormGroup>
          </Col>
        </Row>

        <Form.Item name="latitude" noStyle>
          <Input type="hidden" />
        </Form.Item>
        <Form.Item name="longitude" noStyle>
          <Input type="hidden" />
        </Form.Item>
        <Form.Item name="saltLocation" noStyle valuePropName="checked">
          <Switch style={{ display: "none" }} />
        </Form.Item>
        <Form.Item name="city" noStyle>
          <Input type="hidden" />
        </Form.Item>
        <Form.Item name="state" noStyle>
          <Input type="hidden" />
        </Form.Item>
        <Form.Item name="zipCode" noStyle>
          <Input type="hidden" />
        </Form.Item>

        {selectedCoords && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <MapWrapper>
              <MapContainer
                key={`${selectedCoords[0]}-${selectedCoords[1]}`}
                center={selectedCoords}
                zoom={MAP_ZOOM_LEVEL}
                ref={mapRef}
                scrollWheelZoom={false}
                whenReady={() => {
                  setTimeout(() => {
                    if (mapRef.current?.getContainer())
                      mapRef.current.invalidateSize();
                  }, 200);
                }}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                {hideExactLocation ? (
                  <Circle
                    center={selectedCoords}
                    radius={MAP_CIRCLE_RADIUS}
                    pathOptions={{
                      fillColor: "#ff385c",
                      fillOpacity: 0.2,
                      color: "#ff385c",
                      weight: 1,
                    }}
                  />
                ) : (
                  <CircleMarker
                    center={selectedCoords}
                    radius={8}
                    pathOptions={{
                      fillColor: "#ff385c",
                      fillOpacity: 0.9,
                      color: "white",
                      weight: 2,
                    }}
                  />
                )}
                <MapSizeHandler />
                <MapCenterHandler center={selectedCoords} />
              </MapContainer>
            </MapWrapper>
            <FormGroup>
              <FormLabel>
                <Eye /> Location Display Setting
              </FormLabel>
              <HelpText>
                <Info size={14} /> Choose whether to show your exact address or
                a general area on the map.
              </HelpText>
              <ToggleGroup>
                <ToggleButton
                  type="button"
                  $selected={!hideExactLocation}
                  onClick={() => handlePrivacyToggle("show")}
                >
                  <Eye size={16} /> Show exact location
                </ToggleButton>
                <ToggleButton
                  type="button"
                  $selected={hideExactLocation}
                  onClick={() => handlePrivacyToggle("hide")}
                >
                  <EyeOff size={16} /> Hide exact (area)
                </ToggleButton>
              </ToggleGroup>
            </FormGroup>
          </motion.div>
        )}
      </FormSectionCard>
    </Form>
  );
};

export default LocationSettingsTab;
