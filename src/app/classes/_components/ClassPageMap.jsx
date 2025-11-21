"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import styled, { createGlobalStyle } from "styled-components";
import { Building } from "lucide-react";
import ReactDOMServer from "react-dom/server";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- Global Styles for the custom Leaflet Marker ---
const LeafletMarkerStyles = createGlobalStyle`
  .leaflet-brand-marker {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #ff385c;
    border: 2px solid white;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    transition: all 0.2s ease-in-out;
    cursor: pointer;
  }

  .leaflet-brand-marker-icon {
    transform: rotate(45deg);
  }
`;

// --- Styled Components ---
const MapWrapper = styled.div`
  z-index: 1;
  position: relative;
  height: 100%;
  width: 100%;
  
  /* Ensure the wrapper div for the key takes up full space */
  .map-instance-wrapper {
    height: 100%;
    width: 100%;
  }

  /* This ensures the map fits perfectly inside its rounded container */
  .leaflet-container {
    height: 100%;
    width: 100%;
    font-family: "ProximaSoft", sans-serif;
  }
`;

// New styled component for the location notice
const LocationNotice = styled.div`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  color: #222;
  padding: 14px 14px;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 1rem;
  font-weight: 500;
  z-index: 401;
  white-space: nowrap;
  pointer-events: none;
`;

const LocationLink = styled.a`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  color: #222;
  padding: 14px 14px;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 1rem;
  font-weight: 500;
  z-index: 401;
  white-space: nowrap;
  text-decoration: none;

  &:hover {
    background: #f7f7f7;
  }
`;

// --- Helper Functions ---
const createBrandIcon = () => {
  return L.divIcon({
    html: ReactDOMServer.renderToString(
      <div className="leaflet-brand-marker">
        <Building size={16} className="leaflet-brand-marker-icon" />
      </div>
    ),
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const approximateAreaStyles = {
  fillColor: "#ff385c",
  fillOpacity: 0.1,
  color: "#ff385c",
  weight: 1.5,
};

// --- Main Component ---
const ClassPageMap = ({
  coordinates,
  saltLocation,
  businessName,
  fullAddress,
}) => {
  // --- FIX: State to force unique map instances ---
  const [isMounted, setIsMounted] = useState(false);
  const [mapKey, setMapKey] = useState(null);

  useEffect(() => {
    // Generate a unique key based on time to ensure a fresh DOM node on mount
    setMapKey(`map-instance-${Date.now()}`);
    setIsMounted(true);
    
    return () => {
      setIsMounted(false);
    };
  }, []);

  const position = useMemo(() => {
    if (!coordinates || typeof coordinates !== "string") return null;
    const parts = coordinates.split(",");
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    if (isNaN(lat) || isNaN(lng)) return null;
    return [lat, lng];
  }, [coordinates]);

  const brandIcon = useMemo(() => createBrandIcon(), []);

  // Use the fullAddress for the Google Maps link if available, otherwise fallback to coordinates
  const googleMapsUrl = useMemo(() => {
    if (!saltLocation && fullAddress) {
      // Fixed syntax error in template literal
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    }
    if (position) {
      return `https://www.google.com/maps/search/?api=1&query=${position[0]},${position[1]}`;
    }
    return "#";
  }, [saltLocation, fullAddress, position]);

  if (!position) {
    return (
      <MapWrapper>
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f0f0f0",
            color: "#666",
            fontFamily: "sans-serif",
          }}
        >
          Map location is not available.
        </div>
      </MapWrapper>
    );
  }

  const zoomLevel = saltLocation ? 13 : 15;
  const approximateRadius = 800;

  return (
    <MapWrapper>
      <LeafletMarkerStyles />
      
      {/* --- FIX: Conditional rendering with unique Key --- */}
      {isMounted && mapKey && (
        <div key={mapKey} className="map-instance-wrapper">
          <MapContainer
            center={position}
            zoom={zoomLevel}
            scrollWheelZoom={true}
            attributionControl={false}
            zoomControl={false}
            aria-label={`Map showing location for ${businessName}`}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            {saltLocation ? (
              <Circle
                center={position}
                radius={approximateRadius}
                pathOptions={approximateAreaStyles}
              />
            ) : (
              <Marker
                position={position}
                icon={brandIcon}
                alt={`Location of ${businessName}`}
              />
            )}
          </MapContainer>
        </div>
      )}

      {/* Conditionally render the notice if the location is salted */}
      {saltLocation ? (
        <LocationNotice>Exact location after booking</LocationNotice>
      ) : (
        <LocationLink
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Google Maps
        </LocationLink>
      )}
    </MapWrapper>
  );
};

export default ClassPageMap;