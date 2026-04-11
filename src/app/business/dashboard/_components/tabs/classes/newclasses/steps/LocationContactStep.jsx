"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Form, Input, Switch, Typography, Button, Select } from "antd";
import message from "@/lib/message";
import styled from "styled-components";
import {
  MapPin,
  Mail,
  Phone,
  EyeOff,
  Eye,
  Search,
  Info,
  Copy,
  Building,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  useMap,
} from "react-leaflet";
import { motion } from "framer-motion";
import debounce from "lodash/debounce";
import { useClass } from "../ClassContext";
import "leaflet/dist/leaflet.css";
import { businessClassService, businessService } from "@/services/apiService";
import {
  bookingTheme,
  PageTitle,
  FieldDivider,
} from "../../_shared/BookingFlowDesign";

const { Text, Link: TextLink } = Typography;

const StyledForm = styled(Form)`
  .ant-form-item {
    &:first-child {
      margin-bottom: 0;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }
  .ant-form-item-explain-error {
    margin-top: ${(props) => props.theme.token.marginXS}px;
    font-size: ${(props) => props.theme.token.fontSizeSM || "12px"};
  }
`;
const StepHeader = styled.div`
  text-align: center;
  margin-bottom: 24px;
  position: relative;
`;
const StepDescription = styled.div`
  font-size: 15px;
  color: ${bookingTheme.textSecondary};
  margin-top: 8px;
  line-height: 1.5;
`;
const SectionDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 24px 0;
  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: ${bookingTheme.borderLight};
  }
  span {
    padding: 0 1rem;
    color: ${bookingTheme.textSecondary};
    font-weight: 600;
    font-size: 15px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;
const ActionContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
  padding-right: 4px;
`;

const ActionButton = styled(Button)`
  border-radius: 999px !important;
  font-weight: 500 !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 8px 16px !important;
  height: auto !important;
`;
const FormSection = styled(motion.div)`
  margin-bottom: 24px;
  background: ${bookingTheme.bg};
  border: 1px solid ${bookingTheme.borderLight};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  padding: 20px;
`;
const FormGroup = styled.div`
  margin-bottom: ${(props) =>
    props.theme.token.marginLG || props.theme.token.margin}px;
  width: 100%;
`;
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${(props) => props.theme.token.marginLG}px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
const FormLabel = styled.label`
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => props.theme.token.colorText};
  margin-bottom: ${(props) => props.theme.token.marginXS}px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
const HelpText = styled.div`
  font-size: 13px;
  color: ${(props) => props.theme.token.colorTextSecondary};
  margin-top: 4px;
  margin-bottom: 8px;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;
const StyledInput = styled(Input)`
  height: ${(props) => props.theme.token.controlHeight}px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: ${(props) => props.theme.token.fontSize}px;
  transition: all 0.3s ease;
  &:focus {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
  }
  @media (max-width: 768px) {
    font-size: 16px !important;
  }
`;
const SearchWrapper = styled(motion.div)`
  position: relative;
  margin-bottom: 24px;
  max-width: 100%;
`;
const SearchResults = styled(motion.div)`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid ${(props) => props.theme.token.colorBorder};
`;
const SearchResult = styled(motion.div)`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  transition: all 0.2s ease;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: ${(props) => props.theme.token.colorBgTextHover};
  }
  svg {
    color: ${(props) => props.theme.token.colorPrimary};
    flex-shrink: 0;
  }
`;
const ResultContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;
const PrimaryText = styled.div`
  color: ${(props) => props.theme.token.colorText};
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const MapWrapper = styled(motion.div)`
  position: relative;
  height: 350px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid ${(props) => props.theme.token.colorBorder};
  margin-bottom: 12px;
  .leaflet-container {
    height: 100%;
    width: 100%;
    border-radius: ${(props) => props.theme.token.borderRadius}px;
  }
  .leaflet-control-attribution {
    display: none !important;
  }
`;
const LocationText = styled(motion.div)`
  font-size: 13px;
  color: ${(props) => props.theme.token.colorTextSecondary};
  text-align: center;
  margin-top: 8px;
  margin-bottom: 16px;
`;
const ToggleGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
  margin-bottom: 8px;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;
const ToggleButton = styled.button`
  flex: 1;
  padding: 12px 16px;
  background: ${(props) =>
    props.$selected ? props.theme.token.colorPrimary : "white"};
  color: ${(props) =>
    props.$selected ? "#fff" : props.theme.token.colorText};
  border: 1px solid
    ${(props) =>
      props.$selected
        ? props.theme.token.colorPrimary
        : props.theme.token.colorBorder};
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    border-color: ${(props) => props.theme.token.colorPrimary};
    ${(props) =>
      !props.$selected &&
      `background: ${props.theme.token.colorPrimaryBg}; color: ${props.theme.token.colorPrimary};`}
    ${(props) =>
      props.$selected &&
      `filter: brightness(1.05);`}
  }
  svg {
    color: inherit;
    opacity: ${(props) => (props.$selected ? 1 : 0.85)};
  }
`;

const AWS_LOCATION_API_URL =
  "https://geocoding.classeasily.com/address-autocomplete-proxy";
const SEARCH_DEBOUNCE_MS = 300;
const MAP_ZOOM_LEVEL = 13;
const MAP_CIRCLE_RADIUS = 1000;

const MapCenterHandler = ({ center }) => {
  const map = useMap();
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (
      center &&
      center.length === 2 &&
      !isNaN(center[0]) &&
      !isNaN(center[1])
    ) {
      if (isInitialMount.current) {
        map.setView(center, MAP_ZOOM_LEVEL);
        isInitialMount.current = false;
      } else {
        map.flyTo(center, MAP_ZOOM_LEVEL);
      }
    }
  }, [center, map]);
  return null;
};

const LocationContactStep = ({ onValidatedNext }) => {
  const [form] = Form.useForm();
  const {
    state,
    updateLocationContact,
    debouncedUpdateLocationContact,
    isLoaded,
  } = useClass();
  const [searchResults, setSearchResults] = useState([]);
  const [searchValue, setSearchValue] = useState(
    state.locationContact?.searchValue || ""
  );
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [hideExactLocation, setHideExactLocation] = useState(
    state.locationContact?.saltLocation || false
  );
  const [businessContact, setBusinessContact] = useState(null);
  const [isLoadingBusinessContact, setIsLoadingBusinessContact] =
    useState(true);
  const [businessLocations, setBusinessLocations] = useState([]);
  /** Saved venue id when using a business location; ignored while `showCustomLocation` is true */
  const [venueSelect, setVenueSelect] = useState(null);
  const [showCustomLocation, setShowCustomLocation] = useState(false);
  const isFormInitialized = useRef(false);
  const autoDefaultVenueRef = useRef(false);
  const [mapContainerKey] = useState(() => `loc-contact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  const applyVenueFromRecord = useCallback(
    (loc) => {
      if (!loc) return;
      const lat = loc.latitude != null ? Number(loc.latitude) : null;
      const lng = loc.longitude != null ? Number(loc.longitude) : null;
      const hasCoords =
        lat != null &&
        lng != null &&
        !Number.isNaN(lat) &&
        !Number.isNaN(lng);
      const coordStr = hasCoords ? `${lat},${lng}` : "";
      const salt = loc.show_exact_location === false;
      setVenueSelect(loc.id);
      setShowCustomLocation(false);
      setSearchValue(loc.address || "");
      setHideExactLocation(salt);
      if (hasCoords) {
        setSelectedLocation({
          lat,
          lon: lng,
          display_name: loc.address,
        });
      } else {
        setSelectedLocation(null);
      }
      form.setFieldsValue({
        location: loc.address || "",
        unit_number: loc.unit || "",
        coordinates: coordStr,
        saltLocation: salt,
        city: loc.city || "",
        state: loc.state || "",
        zipCode: loc.zip_code || "",
        country: "",
      });
      updateLocationContact({
        ...state.locationContact,
        location: loc.address || "",
        unit_number: loc.unit || "",
        coordinates: coordStr,
        saltLocation: salt,
        city: loc.city || "",
        state: loc.state || "",
        zipCode: loc.zip_code || "",
        country: "",
        searchValue: loc.address || "",
        location_ref: loc.id,
      });
    },
    [form, updateLocationContact, state.locationContact],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await businessService.getBusinessLocations();
      if (cancelled) return;
      if (res.success && Array.isArray(res.data)) {
        const active = res.data.filter((l) => l.is_active !== false);
        setBusinessLocations(active);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoaded && !isFormInitialized.current && state.locationContact) {
      const contextLocationContact = state.locationContact;
      if (contextLocationContact.location_ref) {
        setVenueSelect(contextLocationContact.location_ref);
        setShowCustomLocation(false);
      } else if ((contextLocationContact.location || "").trim()) {
        setVenueSelect(null);
        setShowCustomLocation(true);
      } else {
        setVenueSelect(null);
        setShowCustomLocation(false);
      }
      form.setFieldsValue({
        studentContactEmail: contextLocationContact.studentContactEmail || "",
        studentContactPhone: contextLocationContact.studentContactPhone || "",
        location: contextLocationContact.location || "",
        unit_number: contextLocationContact.unit_number || "",
        coordinates: contextLocationContact.coordinates || "",
        saltLocation: contextLocationContact.saltLocation || false,
        city: contextLocationContact.city || "",
        state: contextLocationContact.state || "",
        zipCode: contextLocationContact.zipCode || "",
        country: contextLocationContact.country || "",
      });
      setSearchValue(
        contextLocationContact.searchValue ||
          contextLocationContact.location ||
          ""
      );
      setHideExactLocation(contextLocationContact.saltLocation || false);
      if (
        contextLocationContact.coordinates &&
        contextLocationContact.location &&
        contextLocationContact.coordinates !== "0,0" &&
        contextLocationContact.coordinates !== "0, 0"
      ) {
        const [latStr, lonStr] = contextLocationContact.coordinates.split(",");
        setSelectedLocation({
          lat: parseFloat(latStr),
          lon: parseFloat(lonStr),
          display_name: contextLocationContact.location,
        });
      }
      isFormInitialized.current = true;
    }
  }, [isLoaded, state.locationContact, form]);

  useEffect(() => {
    if (!isLoaded || !isFormInitialized.current || autoDefaultVenueRef.current)
      return;
    if (!businessLocations.length) return;
    const ctx = state.locationContact;
    if (ctx?.location_ref || (ctx?.location || "").trim()) {
      autoDefaultVenueRef.current = true;
      return;
    }
    autoDefaultVenueRef.current = true;
    const loc =
      businessLocations.find((l) => l.is_primary) || businessLocations[0];
    applyVenueFromRecord(loc);
  }, [
    businessLocations,
    isLoaded,
    state.locationContact,
    applyVenueFromRecord,
  ]);

  useEffect(() => {
    const fetchBusinessContact = async () => {
      try {
        const contactData = await businessClassService.getContactInfo();
        if (contactData) {
          setBusinessContact(contactData);
        }
      } catch (error) {
        console.warn("Could not fetch business contact info:", error);
      } finally {
        setIsLoadingBusinessContact(false);
      }
    };
    fetchBusinessContact();
  }, []);

  const handleFieldsChange = () => {
    if (isFormInitialized.current) {
      const locRef =
        showCustomLocation || !venueSelect ? null : venueSelect;
      debouncedUpdateLocationContact({
        ...form.getFieldsValue(),
        searchValue,
        saltLocation: hideExactLocation,
        location_ref: locRef,
      });
    }
  };

  const searchLocation = async (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await fetch(
        `${AWS_LOCATION_API_URL}?text=${encodeURIComponent(query)}`
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Location search failed:", error);
      message.error("Location search failed. Please try again.");
      setSearchResults([]);
    }
  };

  const debouncedSearch = useCallback(
    debounce(searchLocation, SEARCH_DEBOUNCE_MS),
    []
  );

  const handleLocationSelect = (locationResult) => {
    const { displayName, coordinates, city, state, zipCode, country } =
      locationResult;
    if (!coordinates?.lat || !coordinates?.lng) {
      message.error("Invalid location data selected.");
      return;
    }
    const { lat, lng } = coordinates;
    const newLocation = { lat, lon: lng, display_name: displayName };
    const newCoordinates = `${lat},${lng}`;

    setSearchValue(displayName);
    setSelectedLocation(newLocation);
    setVenueSelect(null);
    setShowCustomLocation(true);

    form.setFieldsValue({
      location: displayName,
      coordinates: newCoordinates,
      city: city || "",
      state: state || "",
      zipCode: zipCode || "",
      country: country || "",
    });
    form.validateFields(["location", "coordinates"]);
    setSearchResults([]);
    updateLocationContact({
      ...form.getFieldsValue(),
      searchValue: displayName,
      saltLocation: hideExactLocation,
      location_ref: null,
    });
  };

  const handleSubmit = (values) => {
    const finalValues = {
      ...values,
      saltLocation: hideExactLocation,
      searchValue: searchValue,
      location_ref:
        showCustomLocation || !venueSelect ? null : venueSelect,
    };
    updateLocationContact(finalValues);
    onValidatedNext();
  };

  const handlePrivacyToggle = (type) => {
    const newValue = type === "hide";
    setHideExactLocation(newValue);
    form.setFieldsValue({ saltLocation: newValue });
    handleFieldsChange();
  };

  const handleSearchInputChange = (e) => {
    const newQuery = e.target.value;
    setSearchValue(newQuery);
    debouncedSearch(newQuery);
    if (!newQuery.trim()) {
      setSelectedLocation(null);
      form.setFieldsValue({ location: undefined, coordinates: undefined });
    }
  };

  const handleUseBusinessLocation = () => {
    setVenueSelect(null);
    setShowCustomLocation(true);
    if (
      businessContact &&
      businessContact.latitude &&
      businessContact.longitude
    ) {
      const {
        businessAddress,
        latitude,
        longitude,
        businessUnit,
        businessCity,
        businessState,
      } = businessContact;

      const newLocation = {
        lat: latitude,
        lon: longitude,
        display_name: businessAddress,
      };
      const newCoordinates = `${latitude},${longitude}`;
      setSearchValue(businessAddress);
      setSelectedLocation(newLocation);

      form.setFieldsValue({
        location: businessAddress,
        coordinates: newCoordinates,
        unit_number: businessUnit || "",
        city: businessCity || "",
        state: businessState || "",
      });

      debouncedUpdateLocationContact({
        ...form.getFieldsValue(),
        searchValue: businessAddress,
        location: businessAddress,
        coordinates: newCoordinates,
        unit_number: businessUnit || "",
        city: businessCity || "",
        state: businessState || "",
        location_ref: null,
      });
      message.success("Location populated from your business profile.");
    } else {
      message.warn("No location found in your business profile.");
    }
  };

  const handleUseBusinessContact = () => {
    if (businessContact) {
      const valuesToSet = {
        studentContactEmail: businessContact.studentContactEmail || "",
        studentContactPhone: businessContact.studentContactPhone || "",
      };
      form.setFieldsValue(valuesToSet);
      debouncedUpdateLocationContact({
        ...form.getFieldsValue(),
        ...valuesToSet,
        location_ref:
          showCustomLocation || !venueSelect ? null : venueSelect,
      });
      message.success(
        "Contact information populated from your business profile."
      );
    }
  };

  return (
    <>
      <StepHeader>
        <PageTitle>Meeting Point & Contact</PageTitle>
        <StepDescription>
          Where will guests meet you? Provide precise details so they can find
          you easily.
        </StepDescription>
      </StepHeader>

      <StyledForm
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFieldsChange={handleFieldsChange}
        id="step-1-form"
        preserve={true}
      >
        {businessLocations.length > 0 && (
          <FormSection
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <FormGroup>
              <FormLabel>
                <Building size={16} />
                Business location
              </FormLabel>
              <HelpText>
                <Info size={14} />
                This class meets at one of your saved venues by default. Manage
                venues in Settings → Locations.
              </HelpText>
              <Select
                size="large"
                style={{ width: "100%" }}
                placeholder="Select a saved location"
                value={
                  showCustomLocation ? undefined : (venueSelect ?? undefined)
                }
                onChange={(v) => {
                  const loc = businessLocations.find((x) => x.id === v);
                  if (loc) applyVenueFromRecord(loc);
                }}
                options={businessLocations.map((l) => ({
                  value: l.id,
                  label: `${l.name} — ${[l.city, l.state].filter(Boolean).join(", ")}`,
                }))}
              />
              {!showCustomLocation && (
                <div style={{ marginTop: 10 }}>
                  <TextLink
                    onClick={() => {
                      setShowCustomLocation(true);
                      setVenueSelect(null);
                      debouncedUpdateLocationContact({
                        ...form.getFieldsValue(),
                        searchValue,
                        saltLocation: hideExactLocation,
                        location_ref: null,
                      });
                    }}
                  >
                    Or select a custom location
                  </TextLink>
                </div>
              )}
              {showCustomLocation && (
                <div style={{ marginTop: 10 }}>
                  <TextLink
                    onClick={() => {
                      const loc =
                        businessLocations.find((l) => l.is_primary) ||
                        businessLocations[0];
                      if (loc) applyVenueFromRecord(loc);
                    }}
                  >
                    Use a saved business location instead
                  </TextLink>
                </div>
              )}
            </FormGroup>
          </FormSection>
        )}

        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {(showCustomLocation || businessLocations.length === 0) && (
            <>
              {!isLoadingBusinessContact &&
                businessContact?.businessAddress && (
                  <ActionContainer>
                    <ActionButton
                      type="default"
                      onClick={handleUseBusinessLocation}
                      icon={<Building size={14} />}
                      disabled={
                        !businessContact.latitude ||
                        !businessContact.longitude
                      }
                    >
                      Use Business Address
                    </ActionButton>
                  </ActionContainer>
                )}
              <FormGrid>
            <FormGroup>
              <FormLabel>
                <Search size={16} />
                Location Search
              </FormLabel>
              <HelpText>
                <Info size={14} />
                Address, landmark, or meeting spot.
              </HelpText>
              <SearchWrapper>
                <StyledInput
                  prefix={<Search size={16} style={{ color: "#adb5bd" }} />}
                  placeholder="e.g. 123 Main St or 'Central Park West Entrance'"
                  value={searchValue}
                  onChange={handleSearchInputChange}
                  allowClear
                  size="large"
                />
                {searchResults.length > 0 && (
                  <SearchResults
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {searchResults.map((result, index) => (
                      <SearchResult
                        key={index}
                        onClick={() => handleLocationSelect(result)}
                      >
                        <MapPin size={18} />
                        <ResultContent>
                          <PrimaryText>{result.displayName}</PrimaryText>
                        </ResultContent>
                      </SearchResult>
                    ))}
                  </SearchResults>
                )}
              </SearchWrapper>
            </FormGroup>
            <FormGroup>
              <FormLabel>
                <Building size={16} />
                Unit / Suite / Details (Optional)
              </FormLabel>
              <HelpText>
                <Info size={14} />
                Specific instructions (e.g. "Look for the red umbrella").
              </HelpText>
              <Form.Item name="unit_number" noStyle>
                <StyledInput placeholder="Optional details..." size="large" />
              </Form.Item>
            </FormGroup>
              </FormGrid>
            </>
          )}

          <Form.Item
            name="location"
            hidden
            rules={[
              {
                required: true,
                message: "Please select a location from search results.",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="coordinates"
            hidden
            rules={[
              {
                required: true,
                message: "Coordinates are missing. Please select a location.",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="saltLocation" valuePropName="checked" hidden>
            <Switch />
          </Form.Item>
          <Form.Item name="city" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="state" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="zipCode" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="country" hidden>
            <Input />
          </Form.Item>

          {selectedLocation && (
            <>
              <MapWrapper
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <MapContainer
                  key={`location-step-${mapContainerKey}-${selectedLocation.lat}-${selectedLocation.lon}-${hideExactLocation}`}
                  center={[selectedLocation.lat, selectedLocation.lon]}
                  zoom={MAP_ZOOM_LEVEL}
                  scrollWheelZoom={false}
                  attributionControl={false}
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  {hideExactLocation ? (
                    <Circle
                      center={[selectedLocation.lat, selectedLocation.lon]}
                      radius={MAP_CIRCLE_RADIUS}
                      pathOptions={{
                        fillColor: "#ff385c",
                        fillOpacity: 0.15,
                        color: "#ff385c",
                        weight: 1,
                      }}
                    />
                  ) : (
                    <CircleMarker
                      center={[selectedLocation.lat, selectedLocation.lon]}
                      radius={8}
                      pathOptions={{
                        fillColor: "#ff385c",
                        fillOpacity: 0.9,
                        color: "white",
                        weight: 2,
                      }}
                    />
                  )}
                  <MapCenterHandler
                    center={[selectedLocation.lat, selectedLocation.lon]}
                  />
                </MapContainer>
              </MapWrapper>

              <LocationText>
                {hideExactLocation
                  ? `Approximate area: ${selectedLocation.display_name}`
                  : `Exact location: ${selectedLocation.display_name}`}
              </LocationText>

              <FieldDivider />

              <FormGroup>
                <FormLabel>Privacy Settings</FormLabel>
                <HelpText>
                  <Info size={14} />
                  Choose how the location is shown on the public map.
                </HelpText>
                <ToggleGroup>
                  <ToggleButton
                    type="button"
                    $selected={!hideExactLocation}
                    onClick={() => handlePrivacyToggle("show")}
                  >
                    <Eye size={16} /> Show Exact Location
                  </ToggleButton>
                  <ToggleButton
                    type="button"
                    $selected={hideExactLocation}
                    onClick={() => handlePrivacyToggle("hide")}
                  >
                    <EyeOff size={16} /> Hide Exact (Show Area)
                  </ToggleButton>
                </ToggleGroup>
              </FormGroup>
            </>
          )}
        </FormSection>

        <SectionDivider>
          <span>
            <Phone size={16} />
            Guest Support Contact
          </span>
        </SectionDivider>

        {!isLoadingBusinessContact && businessContact && (
          <ActionContainer>
            <ActionButton
              type="default"
              onClick={handleUseBusinessContact}
              icon={<Copy size={14} />}
              disabled={
                !businessContact.studentContactEmail &&
                !businessContact.studentContactPhone
              }
            >
              Use Business Contact Info
            </ActionButton>
          </ActionContainer>
        )}

        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <FormGrid>
            <FormGroup>
              <FormLabel>
                <Mail size={16} />
                Support Email
              </FormLabel>
              <HelpText>
                <Info size={14} />
                Where can guests email you with questions?
              </HelpText>
              <Form.Item
                name="studentContactEmail"
                rules={[
                  { required: true, message: "Please enter an email address" },
                  {
                    type: "email",
                    message: "Please enter a valid email address",
                  },
                ]}
              >
                <StyledInput
                  prefix={<Mail size={16} style={{ color: "#adb5bd" }} />}
                  placeholder="help@example.com"
                  size="large"
                  inputMode="email"
                />
              </Form.Item>
            </FormGroup>

            <FormGroup>
              <FormLabel>
                <Phone size={16} />
                Support Phone
              </FormLabel>
              <HelpText>
                <Info size={14} />A number for guests to call or text if they
                get lost.
              </HelpText>
              <Form.Item
                name="studentContactPhone"
                rules={[
                  { required: true, message: "Please enter a phone number" },
                  {
                    pattern:
                      /^\+?(\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}$/,
                    message: "Please enter a valid phone number",
                  },
                ]}
              >
                <StyledInput
                  prefix={<Phone size={16} style={{ color: "#adb5bd" }} />}
                  placeholder="(e.g., +1 555-123-4567)"
                  size="large"
                  inputMode="tel"
                />
              </Form.Item>
            </FormGroup>
          </FormGrid>
        </FormSection>
      </StyledForm>
    </>
  );
};

export default LocationContactStep;
