"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Form, Input, Typography, Spin, ConfigProvider, Row, Col,  } from 'antd';
import message from '@/lib/message';
import styled from "styled-components";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  useMap,
} from "react-leaflet";
import {
  MapPin,
  Search,
  Info,
  Shield,
  Map,
  XCircle,
  Building,
} from "lucide-react";
import debounce from "lodash/debounce";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";
import { theme } from "@/components/theme";

const { Title, Text } = Typography;

const AWS_LOCATION_API_URL =
  "https://geocoding.classeasily.com/address-autocomplete-proxy";

// --- STYLED COMPONENTS ---
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
  margin-bottom: 2rem;
  position: relative;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;
const StepTitle = styled(Title)`
  margin-bottom: ${(props) => props.theme.token.marginXS}px !important;
  color: ${(props) => props.theme.token.colorText};
  font-size: 28px !important;
  font-weight: 700 !important;

  @media (max-width: 768px) {
    font-size: 24px !important;
  }
`;
const StepDescription = styled(Text)`
  display: block;
  color: ${(props) => props.theme.token.colorTextSecondary};
  font-size: ${(props) => props.theme.token.fontSizeLG || "16px"};
  margin-bottom: ${(props) => props.theme.token.marginLG}px;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: ${(props) => props.theme.token.fontSize || "14px"};
  }
`;
const SectionDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 2rem 0;

  @media (max-width: 768px) {
    margin: 1.5rem 1rem;
  }

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      ${(props) => props.theme.token.colorBorder} 20%,
      ${(props) => props.theme.token.colorBorder} 80%,
      transparent 100%
    );
  }
  span {
    padding: 0 1rem;
    color: ${(props) => props.theme.token.colorTextSecondary};
    font-weight: 500;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: ${(props) => props.theme.token.colorBgContainer};
    border-radius: 20px;
    padding: 0.5rem 1rem;
    border: 1px solid ${(props) => props.theme.token.colorBorder};

    @media (max-width: 768px) {
      font-size: 13px;
      padding: 0.4rem 0.8rem;
    }
  }
`;
const FormSection = styled(motion.div)`
  margin-bottom: 2rem;
  border-radius: 12px;

  @media (max-width: 768px) {
    margin: 0 1rem 1.5rem 1rem;
  }
`;
const FormGroup = styled.div`
  margin-bottom: ${(props) =>
    props.theme.token.marginLG || props.theme.token.margin}px;
  width: 100%;
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
const InfoSection = styled(motion.div)`
  background: linear-gradient(
    135deg,
    ${(props) => props.theme.token.colorBgLayout} 0%,
    ${(props) => props.theme.token.colorBgContainer} 100%
  );
  border-radius: 16px;
  padding: ${(props) => props.theme.token.paddingLG}px;
  margin-bottom: 2rem;
  border: 1px solid ${(props) => props.theme.token.colorBorder};
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    margin: 0 1rem 1.5rem 1rem;
    padding: ${(props) => props.theme.token.padding}px;
    border-radius: 12px;
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      ${(props) => props.theme.token.colorPrimary},
      ${(props) => props.theme.token.colorPrimaryBorder}
    );
  }
`;
const InfoTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.token.marginXS}px;
  font-weight: 700;
  font-size: 16px;
  color: ${(props) => props.theme.token.colorText};
  margin-bottom: ${(props) => props.theme.token.marginXS}px;
  svg {
    color: ${(props) => props.theme.token.colorPrimary};
  }
`;
const InfoText = styled.p`
  color: ${(props) => props.theme.token.colorTextSecondary};
  font-size: ${(props) => props.theme.token.fontSize}px;
  margin: 0;
  line-height: 1.6;
`;
const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`;

// --- UPDATED MOBILE STYLES ---
const StyledInput = styled(Input)`
  height: ${(props) => props.theme.token.controlHeight}px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: ${(props) => props.theme.token.fontSize}px;
  transition: all 0.3s ease;
  &:focus {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
  }
  .ant-input-prefix {
    margin-right: 8px;
    color: ${(props) => props.theme.token.colorTextTertiary};
  }

  @media (max-width: 768px) {
    font-size: 16px !important;
    input {
      font-size: 16px !important;
    }
  }
`;

const SearchResults = styled(motion.div)`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${(props) => props.theme.token.colorBgElevated};
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 8px;
  border: 1px solid ${(props) => props.theme.token.colorBorder};
  overflow: hidden;
`;
const SearchResult = styled(motion.div)`
  padding: 1rem;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
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
    margin-top: 2px;
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
  font-size: ${(props) => props.theme.token.fontSize}px;
  font-weight: 500;
  line-height: 1.4;
`;
const LoadingSpinner = styled(Spin)`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
`;
const MapWrapper = styled(motion.div)`
  position: relative;
  height: 400px;
  border-radius: ${(props) => props.theme.token.borderRadiusLG}px;
  overflow: hidden;
  border: 1px solid ${(props) => props.theme.token.colorBorder};
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  background: ${(props) => props.theme.token.colorBgContainer};
  z-index: 2;

  @media (max-width: 768px) {
    height: 300px;
  }

  .leaflet-container {
    height: 100%;
    width: 100%;
    border-radius: ${(props) => props.theme.token.borderRadiusLG}px;
  }

  .leaflet-control-attribution {
    display: none !important;
  }
`;
const NoMapAlert = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  background: linear-gradient(
    135deg,
    ${(props) => props.theme.token.colorBgLayout} 0%,
    ${(props) => props.theme.token.colorBgContainer} 100%
  );
  border: 2px dashed ${(props) => props.theme.token.colorBorder};
  border-radius: ${(props) => props.theme.token.borderRadiusLG}px;
  color: ${(props) => props.theme.token.colorTextSecondary};
  font-size: ${(props) => props.theme.token.fontSizeLG}px;
  gap: ${(props) => props.theme.token.marginSM}px;
  svg {
    color: ${(props) => props.theme.token.colorPrimary};
  }
`;
const NoResultsFound = styled(motion.div)`
  padding: 1.5rem;
  text-align: center;
  color: ${(props) => props.theme.token.colorTextSecondary};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;
`;

const LocationStep = ({ onSubmit, initialData = {}, onFormSubmitFailed }) => {
  const [form] = Form.useForm();
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(13);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      location: initialData?.location || "",
      businessUnit: initialData?.businessUnit || "",
      coordinates: initialData?.coordinates || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      zipCode: initialData?.zipCode || "",
    });
    setSearchValue(initialData?.location || "");

    if (initialData?.coordinates) {
      try {
        const [lat, lng] = initialData.coordinates.split(",").map(parseFloat);
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapCenter([lat, lng]);
          setZoomLevel(14);
        } else {
          setMapCenter(null);
        }
      } catch (e) {
        console.error("Error parsing initial coordinates:", e);
        setMapCenter(null);
      }
    } else {
      setMapCenter(null);
    }
  }, [initialData, form]);

  const handleLocationSelect = (result) => {
    const { lat, lng } = result.coordinates;

    form.setFieldsValue({
      location: result.displayName,
      coordinates: `${lat},${lng}`,
      city: result.city || "",
      state: result.state || "",
      zipCode: result.zipCode || "",
    });

    setMapCenter([lat, lng]);
    setZoomLevel(15);
    setSearchResults([]);
    setSearchValue(result.displayName);
    setHasSearched(false);
    form.validateFields(["location"]);
  };

  const MapCenterHandler = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
      if (
        center &&
        center.length === 2 &&
        !isNaN(center[0]) &&
        !isNaN(center[1])
      ) {
        map.setView(center, zoom);
      }
    }, [center, zoom, map]);
    return null;
  };

  const searchLocation = async (query) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(
        `${AWS_LOCATION_API_URL}?text=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      const data = await response.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Location search failed:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query) => searchLocation(query), 400),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    form.setFieldsValue({ location: value });
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      setSearchResults([]);
      setHasSearched(false);
      setMapCenter(null);
      form.setFieldsValue({
        coordinates: "",
        city: "",
        state: "",
        zipCode: "",
      });
    }
  };

  const handleSubmit = (values) => {
    onSubmit(values);
  };

  const handleFinishFailed = (errorInfo) => {
    if (onFormSubmitFailed) {
      onFormSubmitFailed(errorInfo);
    }
  };

  return (
    <ConfigProvider theme={theme}>
      <StepHeader>
        <StepTitle level={2}>Studio Location</StepTitle>
        <StepDescription>
          Let's set up where you'll be teaching your classes. Your exact address
          will be kept private until students book with you.
        </StepDescription>
      </StepHeader>

      <InfoSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <InfoTitle>
          <Shield size={20} />
          Privacy Protection
        </InfoTitle>
        <InfoText>
          Your exact address will only be shared with students after they book a
          class. For public viewing, we'll show an approximate location within a
          200-meter radius to protect your privacy and security. You can change
          this later in class settings.
        </InfoText>
      </InfoSection>

      <StyledForm
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFinishFailed={handleFinishFailed}
        id="step-2-form"
      >
        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <FormGroup>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <FormLabel>
                  <MapPin size={16} />
                  Studio Address
                </FormLabel>
                <HelpText>
                  <Info size={14} />
                  Search and select your teaching location.
                </HelpText>
                <Form.Item
                  name="location"
                  rules={[
                    {
                      required: true,
                      message: "Please search and select your studio address",
                    },
                  ]}
                  style={{ marginBottom: "1rem" }}
                >
                  <SearchContainer>
                    <StyledInput
                      prefix={<Search size={16} />}
                      placeholder="Search for your location (e.g., 123 Main St, Toronto)"
                      value={searchValue}
                      onChange={handleSearchChange}
                      size="large"
                    />
                    {loading && <LoadingSpinner size="small" />}

                    <AnimatePresence mode="wait">
                      {searchResults.length > 0 ? (
                        <SearchResults
                          key="results"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {searchResults.map((result, index) => (
                            <SearchResult
                              key={index}
                              onClick={() => handleLocationSelect(result)}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{
                                duration: 0.2,
                                delay: index * 0.05,
                              }}
                            >
                              <MapPin size={16} />
                              <ResultContent>
                                <PrimaryText>{result.displayName}</PrimaryText>
                              </ResultContent>
                            </SearchResult>
                          ))}
                        </SearchResults>
                      ) : (
                        hasSearched &&
                        !loading &&
                        searchValue && (
                          <SearchResults
                            key="no-results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <NoResultsFound>
                              <XCircle
                                size={24}
                                color={theme.token.colorTextSecondary}
                              />
                              <span>No results found.</span>
                              <span style={{ fontSize: 12 }}>
                                Please try a different search term.
                              </span>
                            </NoResultsFound>
                          </SearchResults>
                        )
                      )}
                    </AnimatePresence>
                  </SearchContainer>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <FormLabel>
                  <Building size={16} />
                  Unit / Suite # (Optional)
                </FormLabel>
                <HelpText>
                  <Info size={14} />
                  Apt, suite, or unit number.
                </HelpText>
                <Form.Item name="businessUnit">
                  <StyledInput placeholder="e.g., Unit 201" size="large" />
                </Form.Item>
              </Col>
            </Row>
          </FormGroup>
        </FormSection>

        <Form.Item name="coordinates" hidden>
          <Input />
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

        <SectionDivider>
          <span>
            <Map size={16} />
            Location Preview
          </span>
        </SectionDivider>

        <FormSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <FormGroup>
            <FormLabel>
              <Map size={16} />
              Map Preview
            </FormLabel>
            <HelpText>
              <Info size={14} />
              This shows the approximate area where your location will be
              displayed to students
            </HelpText>

            <AnimatePresence mode="wait">
              {mapCenter && !isNaN(mapCenter[0]) && !isNaN(mapCenter[1]) ? (
                <MapWrapper
                  key="map"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <MapContainer
                    center={mapCenter}
                    zoom={zoomLevel}
                    scrollWheelZoom={false}
                    key={mapCenter.join(",") + zoomLevel}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      attribution={false}
                    />
                    <Circle
                      center={mapCenter}
                      radius={200}
                      pathOptions={{
                        fillColor: theme.token.colorPrimary,
                        fillOpacity: 0.15,
                        color: theme.token.colorPrimary,
                        weight: 2,
                        opacity: 0.8,
                      }}
                    />
                    <CircleMarker
                      center={mapCenter}
                      radius={8}
                      pathOptions={{
                        fillColor: theme.token.colorPrimary,
                        fillOpacity: 1,
                        color: "white",
                        weight: 3,
                      }}
                    />
                    <MapCenterHandler center={mapCenter} zoom={zoomLevel} />
                  </MapContainer>
                </MapWrapper>
              ) : (
                <NoMapAlert
                  key="no-map"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  Search for an address to display it on the map
                </NoMapAlert>
              )}
            </AnimatePresence>
          </FormGroup>
        </FormSection>
      </StyledForm>
    </ConfigProvider>
  );
};

export default LocationStep;