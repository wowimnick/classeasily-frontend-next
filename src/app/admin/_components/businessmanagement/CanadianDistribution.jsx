"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import styled from "styled-components";
import { Skeleton, Alert } from "antd";
import { businessManagementService } from "@/services/adminDash";

// Remove the SSR check - Next.js handles this differently
let L = null;

// Province code to full name mapping
const PROVINCE_MAPPING = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
  CA: "Other/Unknown",
};

// --- Styled Components ---
const MapWrapper = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  background-color: #f8fafc;
  border-radius: 16px;
  overflow: hidden;

  .leaflet-container {
    height: 100%;
    width: 100%;
    border-radius: 16px;
  }

  .leaflet-control-attribution {
    display: none !important;
  }

  .leaflet-popup-content-wrapper {
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .leaflet-popup-content {
    margin: 12px 16px;
    font-size: 13px;
    color: #1f2937;

    strong {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 14px;
      color: #111827;
    }

    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .label {
      color: #64748b;
      font-size: 12px;
      margin-right: 12px;
    }

    .value {
      font-weight: 600;
      color: #111827;
    }
  }

  .leaflet-popup-tip {
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
`;

const ControlsContainer = styled.div`
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);

  .stats-title {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stats-value {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
  }

  @media (max-width: 768px) {
    bottom: 12px;
    left: 12px;
    right: 12px;
  }
`;

const LoadingContainer = styled.div`
  height: 100%;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// --- Helper Functions ---
const formatCurrency = (value) => {
  if (value === undefined || value === null || value === 0) return "$0";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCount = (value) => {
  if (value === undefined || value === null) return "0";
  return new Intl.NumberFormat().format(value);
};

// Function to validate coordinates are within Canada bounds
const isValidCanadianCoordinate = (coord) => {
  if (!coord || coord.length !== 2) return false;
  const [lng, lat] = coord;
  return lng >= -141 && lng <= -52 && lat >= 42 && lat <= 84;
};

// Load Leaflet CSS and JS
const loadLeaflet = () => {
  return new Promise((resolve, reject) => {
    // No need for window check with 'use client' directive
    if (typeof window !== "undefined" && window.L) {
      L = window.L;
      resolve();
      return;
    }

    // Check if already loading
    if (document.querySelector('script[src*="leaflet"]')) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (typeof window !== "undefined" && window.L) {
          L = window.L;
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    // Load CSS
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(cssLink);

    // Load JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      L = window.L;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// --- Main Component ---
const CanadianDistribution = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const [businessData, setBusinessData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapContainerKey] = useState(() => `canada-map-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  // Load Leaflet on component mount
  useEffect(() => {
    loadLeaflet()
      .then(() => setLeafletLoaded(true))
      .catch((err) => {
        console.error("Failed to load Leaflet:", err);
        setError("Failed to load map library");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const fetchApiData = async () => {
      if (!leafletLoaded) return;

      setLoading(true);
      setError(null);
      try {
        const response = await businessManagementService.getGeographicalData();
        if (response.success) {
          const processedData = processBusinessData(response.data);
          setBusinessData(processedData);
        } else {
          setError(response.error || "Failed to load map data");
        }
      } catch (err) {
        setError("Network error while loading map data");
        console.error("Map data fetch error:", err);
      }
      setLoading(false);
    };

    fetchApiData();
  }, [leafletLoaded]);

  // Process raw API data into individual business points
  const processBusinessData = (rawData) => {
    if (!Array.isArray(rawData)) return [];

    const businessPoints = [];

    rawData.forEach((cityData) => {
      if (
        !cityData.city ||
        cityData.city === "Anytown" ||
        cityData.province_code === "CA" ||
        !isValidCanadianCoordinate(cityData.centroid) ||
        !cityData.count ||
        cityData.count <= 0
      ) {
        return;
      }

      const provinceName =
        PROVINCE_MAPPING[cityData.province_code] || cityData.province_full;

      // Create individual points for each business in the city
      for (let i = 0; i < cityData.count; i++) {
        const offsetLng = (Math.random() - 0.5) * 0.02;
        const offsetLat = (Math.random() - 0.5) * 0.02;

        businessPoints.push({
          id: `${cityData.city}-${i}`,
          city: cityData.city,
          province: provinceName,
          coordinates: [
            cityData.centroid[1] + offsetLat, // Leaflet uses [lat, lng]
            cityData.centroid[0] + offsetLng,
          ],
          revenue: Math.round((cityData.revenue || 0) / cityData.count),
          classes: Math.round((cityData.classes_count || 0) / cityData.count),
          totalCityBusinesses: cityData.count,
          totalCityRevenue: cityData.revenue || 0,
          totalCityClasses: cityData.classes_count || 0,
        });
      }
    });

    return businessPoints;
  };

  // Calculate scaling for markers based on revenue data
  const markerScale = useMemo(() => {
    if (!businessData.length) return { min: 6, max: 20 };

    const values = businessData.map((b) => b.revenue || 0);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values.filter((v) => v > 0));

    return { min: 6, max: Math.min(30, Math.max(12, maxValue / 50)) };
  }, [businessData]);

  const getMarkerSize = (business) => {
    const value = business.revenue || 0;
    if (value <= 0) return markerScale.min;

    // Scale between min and max based on revenue
    const values = businessData.map((b) => b.revenue || 0).filter((v) => v > 0);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    if (maxValue === minValue) return markerScale.min;

    const ratio = (value - minValue) / (maxValue - minValue);
    return markerScale.min + ratio * (markerScale.max - markerScale.min);
  };

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !L || loading || error || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
    }

    const map = L.map(mapRef.current, {
      center: [56.1304, -106.3468], // Center of Canada
      zoom: 4,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
    });

    // High quality tile layer with no attribution
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution: "",
        maxZoom: 18,
        subdomains: "abcd",
      }
    ).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }
    };
  }, [leafletLoaded, loading, error]);

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !businessData.length || !L) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    businessData.forEach((business) => {
      const markerSize = getMarkerSize(business);

      const marker = L.circleMarker(business.coordinates, {
        radius: markerSize,
        fillColor: "#dc2626",
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      });

      const popupContent = `
        <strong>${business.city}, ${business.province}</strong>
        <div class="metric-row">
          <span class="label">Business Revenue:</span>
          <span class="value">${formatCurrency(business.revenue)}</span>
        </div>
        <div class="metric-row">
          <span class="label">Business Classes:</span>
          <span class="value">${formatCount(business.classes)}</span>
        </div>
        <div class="metric-row">
          <span class="label">City Total:</span>
          <span class="value">${formatCount(
            business.totalCityBusinesses
          )} businesses</span>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add hover effects
      marker.on("mouseover", function () {
        this.setStyle({
          radius: markerSize * 1.2,
          fillOpacity: 1,
        });
      });

      marker.on("mouseout", function () {
        this.setStyle({
          radius: markerSize,
          fillOpacity: 0.8,
        });
      });

      marker.addTo(mapInstanceRef.current);
      markersRef.current.push(marker);
    });
  }, [businessData, markerScale]);

  const totalStats = useMemo(() => {
    if (!businessData.length) return { count: 0, revenue: 0, classes_count: 0 };

    return businessData.reduce(
      (acc, curr) => ({
        count: acc.count + 1,
        revenue: acc.revenue + (curr.revenue || 0),
        classes_count: acc.classes_count + (curr.classes || 0),
      }),
      { count: 0, revenue: 0, classes_count: 0 }
    );
  }, [businessData]);

  if (loading) {
    return (
      <MapWrapper>
        <LoadingContainer>
          <Skeleton active paragraph={{ rows: 8 }} />
        </LoadingContainer>
      </MapWrapper>
    );
  }

  if (error) {
    return (
      <MapWrapper>
        <LoadingContainer>
          <Alert
            message="Failed to Load Map Data"
            description={error}
            type="error"
            showIcon
          />
        </LoadingContainer>
      </MapWrapper>
    );
  }

  return (
    <MapWrapper>
      <ControlsContainer>
        <div className="stats-title">Total Businesses</div>
        <div className="stats-value">{formatCount(totalStats.count)}</div>
      </ControlsContainer>

      <div key={mapContainerKey} ref={mapRef} style={{ height: "100%", width: "100%" }} />
    </MapWrapper>
  );
};

export default CanadianDistribution;
