"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import styled, { createGlobalStyle } from "styled-components";
import { Building, Hand } from "lucide-react";
import { LeafletCustomZoomControls } from "@/components/maps/LeafletCustomZoomControls";
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
    position: relative;
    height: 100%;
    width: 100%;
  }

  /* This ensures the map fits perfectly inside its rounded container */
  .leaflet-container {
    height: 100%;
    width: 100%;
    font-family: "ProximaSoft", sans-serif;
  }

  /* Hide Leaflet’s default attribution bar for a cleaner panel (tiles still credited in app context if needed) */
  .leaflet-control-attribution {
    display: none;
  }
`;

/* Mobile: overlay so page scroll doesn't move the map; tap to enable map interaction */
const TapToActivateOverlay = styled.button`
  position: absolute;
  inset: 0;
  z-index: 400;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  transition: background 0.2s, color 0.2s;
  border-radius: inherit;
  @media (min-width: 769px) {
    display: none;
  }
  &:hover {
    background: rgba(255, 255, 255, 0.96);
    color: #111;
  }
  svg {
    flex-shrink: 0;
    opacity: 0.85;
  }
`;

// New styled component for the location notice
const LocationNotice = styled.div`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: #ffffff;
  color: #222;
  padding: 12px 16px;
  border-radius: 14px;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 1rem;
  font-weight: 600;
  z-index: 1100;
  white-space: nowrap;
  pointer-events: none;
`;

const LocationLink = styled.a`
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: #ffffff;
  color: #111111;
  padding: 12px 18px;
  border-radius: 14px;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 1rem;
  font-weight: 600;
  z-index: 1100;
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
  /* Leaflet + react-leaflet: the previous Map must detach from the DOM completely
     before mounting again. RAF / single-frame deferrals still race SPA back nav,
     Suspense remounts, and dynamic imports. We always unmount MapContainer first,
     wait a beat, bump a stable key, then mount a fresh subtree. */
  const [leafletMountId, setLeafletMountId] = useState(0);
  const [mapDomAllowed, setMapDomAllowed] = useState(false);
  // Mobile: tap-to-activate so scrolling the page doesn't accidentally pan the map
  const [isMobile, setIsMobile] = useState(false);
  const [mapInteractionEnabled, setMapInteractionEnabled] = useState(false);

  const saltToggle = Boolean(saltLocation);
  const pathname = usePathname();

  useEffect(() => {
    let alive = true;
    setMapDomAllowed(false);
    /* Tear down MapContainer immediately, then delay before mounting again so
       Leaflet can finish map.remove() and release the DOM (avoids reused container). */
    const t = window.setTimeout(() => {
      if (!alive) return;
      setLeafletMountId((n) => n + 1);
      setMapDomAllowed(true);
    }, 175);

    return () => {
      alive = false;
      window.clearTimeout(t);
      setMapDomAllowed(false);
    };
  }, [coordinates, saltToggle, pathname]);

  useEffect(() => {
    setMapInteractionEnabled(false);
  }, [coordinates]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(typeof window !== "undefined" && window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    }
    if (position) {
      return `https://www.google.com/maps/search/?api=1&query=${position[0]},${position[1]}`;
    }
    return "#";
  }, [saltLocation, fullAddress, position]);

  const leafletInstanceKey = useMemo(() => {
    if (!position || leafletMountId < 1) return null;
    return `leaflet-${leafletMountId}-${position[0]}-${position[1]}-${saltToggle ? "s" : "n"}`;
  }, [leafletMountId, position, saltToggle]);

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

  const showTapOverlay = isMobile && !mapInteractionEnabled;

  return (
    <MapWrapper>
      <LeafletMarkerStyles />
      {showTapOverlay && (
        <TapToActivateOverlay
          type="button"
          onClick={() => setMapInteractionEnabled(true)}
          aria-label="Tap to enable map – then you can pan and zoom"
        >
          <Hand size={28} aria-hidden />
          Tap to move map
        </TapToActivateOverlay>
      )}
      {mapDomAllowed && leafletInstanceKey && (
        <div key={leafletInstanceKey} className="map-instance-wrapper">
          <MapContainer
            key={leafletInstanceKey}
            center={position}
            zoom={zoomLevel}
            scrollWheelZoom={true}
            attributionControl={false}
            zoomControl={false}
            aria-label={`Map showing location for ${businessName}`}
            style={{ height: "100%", width: "100%" }}
          >
            <LeafletCustomZoomControls />
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