"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import { useRouter } from "next/navigation"; // CHANGED
import styled, { createGlobalStyle } from "styled-components";
import {
  Calendar,
  Map as MapIcon,
  Star,
  Building2,
  MapPin,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- STYLES ---

const LeafletMarkerStyles = createGlobalStyle`
  .leaflet-price-marker {
    display: flex;
    justify-content: center;
    align-items: center;
    background: white;
    color: #222222;
    padding: 6px 12px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    border: 1px solid white;
    transition: all 0.2s ease-in-out;
    cursor: pointer;
    white-space: nowrap;
  }

  .leaflet-price-marker.selected,
  .leaflet-price-marker:hover {
    background: #ff385c;
    border-color: #ff385c;
    color: white;
    transform: scale(1.1);
    z-index: 1000 !important;
  }
`;

const MapWrapper = styled.div`
  z-index: 1;
  position: relative;
  height: 100%;

  background: #fff;
  border-radius: 30px; /* User requested border-radius */
  overflow: hidden;

  .leaflet-container {
    font-family: "Proxima Soft", sans-serif;
    height: 100%;
    width: 100%;
  }
  .leaflet-popup-content-wrapper {
    padding: 0;
    border-radius: 12px;
    overflow: hidden;
    width: 280px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }
  .leaflet-popup-content {
    margin: 0;
    width: 100% !important;
  }
`;

const Map = styled.div`
  height: 100%;
`;

const HideMapButton = styled.button`
  display: none; // Hidden on mobile
  @media (min-width: 1049px) {
    display: flex;
    align-items: center;
    gap: 8px;
    position: absolute;
    top: 12px;
    left: 12px;
    background: white;
    padding: 16px 20px;
    border-radius: 20px;
    border: 1px solid #e0e0e0;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    z-index: 401; // Above tile layer but below popups
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    color: #333;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      transform: translateY(-1px);
    }
  }
`;

const PopupContent = styled.div``;
const PopupImage = styled.div`
  width: 100%;
  height: 160px;
  position: relative;
  background-image: ${(props) => {
    if (!props.$src || props.$src.trim() === "") return "none";

    // Properly encode the URL for CSS
    const encodedUrl = props.$src.replace(/\s/g, "%20");
    return `url("${encodedUrl}")`;
  }};
  background-size: cover;
  background-position: center;
  background-color: #eee;
  background-repeat: no-repeat;

  /* Add a fallback pattern when no image */
  ${(props) =>
    !props.$src || props.$src.trim() === ""
      ? `
        background: linear-gradient(135deg, #f5f5f5 25%, transparent 25%),
                    linear-gradient(225deg, #f5f5f5 25%, transparent 25%),
                    linear-gradient(45deg, #f5f5f5 25%, transparent 25%),
                    linear-gradient(315deg, #f5f5f5 25%, #eee 25%);
        background-size: 20px 20px;
        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
      `
      : ""}
`;
const PopupDetails = styled.div`
  padding: 12px;
`;
const PopupTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #222222;
  margin: 0 0 4px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;
const PricesContainer = styled.div`
  display: flex;
  gap: 8px;
  width: fit-content;

  margin-top: 12px;
`;
const PriceBox = styled.div`
  display: inline-flex;
  flex-direction: column;
  background: ${(props) => (props.type === "course" ? "#F0F7FF" : "#FFF0F0")};
  border-radius: 8px;
  padding: 4px 8px;
  flex: 1;
  border: 1px solid
    ${(props) => (props.type === "course" ? "#CCE5FF" : "#FFD6DB")};
`;
const PriceLabel = styled.div`
  color: ${(props) => (props.type === "course" ? "#0066CC" : "#FF385C")};
  font-size: 10px;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
`;
const PriceAmount = styled.div`
  color: ${(props) => (props.type === "course" ? "#0066CC" : "#FF385C")};
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
`;
const ViewButton = styled.button`
  width: 100%;
  padding: 8px;
  background: #ff385c;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  margin-top: 12px;
  transition: all 0.2s;

  &:hover {
    background: #ff1447;
    transform: translateY(-1px);
  }
`;

// --- NEW STYLED COMPONENTS ---
const PopupRating = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #484848;
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 16px;
  backdrop-filter: blur(2px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);

  span {
    color: #717171;
    font-weight: normal;
  }
  svg {
    color: #ffb400;
    fill: #ffb400;
    stroke-width: 0;
  }
`;

const PopupCompanyInfo = styled.div`
  display: flex;
  align-items: center;
  color: #666666;
  font-size: 13px;
  gap: 6px;
  margin-top: 8px;
`;

const PopupLocationInfo = styled.div`
  display: flex;
  align-items: center;
  color: #666666;
  font-size: 13px;
  gap: 6px;
  margin-top: 4px;
`;

// --- HELPER FUNCTIONS ---
const createPriceIcon = (price, isSelected) => {
  const priceText = price ? `$${Math.round(price)}` : "View";
  const className = `leaflet-price-marker ${isSelected ? "selected" : ""}`;

  return L.divIcon({
    html: `<span>${priceText}</span>`,
    className: className.trim(),
    iconSize: null,
    iconAnchor: [30, 15],
    popupAnchor: [0, -20],
  });
};

function ChangeView({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.sw && bounds.ne) {
      if (bounds.sw.lat !== bounds.ne.lat || bounds.sw.lng !== bounds.ne.lng) {
        try {
          map.fitBounds(
            [
              [bounds.sw.lat, bounds.sw.lng],
              [bounds.ne.lat, bounds.ne.lng],
            ],
            { padding: [50, 50] }
          );
        } catch (error) {
          console.error("Error fitting bounds:", error, bounds);
        }
      } else if (bounds.sw.lat && bounds.sw.lng) {
        map.setView([bounds.sw.lat, bounds.sw.lng], 14);
      }
    }
  }, [bounds, map]);
  return null;
}

function InvalidateSizeOnShow({ isVisible }) {
  const map = useMap();
  useEffect(() => {
    if (
      isVisible &&
      typeof window !== "undefined" &&
      window.innerWidth <= 1048
    ) {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isVisible, map]);
  return null;
}

const MarkerComponent = React.memo(
  ({ position, id, isSelected, onClick, classInfo }) => {
    const displayPrice =
      classInfo.min_session_price ?? classInfo.min_course_price;
    const icon = createPriceIcon(displayPrice, isSelected);

    const imageUrl =
      classInfo.images?.[0]?.medium_url ||
      classInfo.images?.[0]?.url ||
      classInfo.images?.[0]?.small_url ||
      "";

    return (
      <Marker
        position={position}
        icon={icon}
        eventHandlers={{ click: () => onClick(id) }}
      >
        <Popup autoPan={false}>
          <PopupContent>
            <PopupImage $src={imageUrl}>
              {(!imageUrl || imageUrl.trim() === "") && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    color: "#ccc",
                    fontSize: "48px",
                  }}
                >
                  📷
                </div>
              )}

              {classInfo.rating > 0 && (
                <PopupRating>
                  <Star size={14} />
                  {Number(classInfo.rating).toFixed(1)}
                  {classInfo.totalReviews > 0 && (
                    <span>({classInfo.totalReviews})</span>
                  )}
                </PopupRating>
              )}
            </PopupImage>
            <PopupDetails>
              <PopupTitle title={classInfo.title}>{classInfo.title}</PopupTitle>

              {classInfo.business_name && (
                <PopupCompanyInfo>
                  <Building2 size={14} />
                  {classInfo.business_name}
                </PopupCompanyInfo>
              )}

              {classInfo.location && (
                <PopupLocationInfo>
                  <MapPin size={14} />
                  {classInfo.location}
                </PopupLocationInfo>
              )}

              <PricesContainer>
                {classInfo.min_session_price !== null && (
                  <PriceBox type="single">
                    <PriceLabel type="single">Class From</PriceLabel>
                    <PriceAmount type="single">
                      <Calendar size={12} aria-hidden="true" /> $
                      {classInfo.min_session_price}
                    </PriceAmount>
                  </PriceBox>
                )}
                {classInfo.min_course_price !== null && (
                  <PriceBox type="course">
                    <PriceLabel type="course">Course From</PriceLabel>
                    <PriceAmount type="course">
                      <Calendar size={12} aria-hidden="true" /> $
                      {classInfo.min_course_price}
                    </PriceAmount>
                  </PriceBox>
                )}
              </PricesContainer>

              <ViewButton
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof window !== "undefined")
                    window.open(`/classes/${classInfo.slug}`, "_blank");
                }}
              >
                View Class
              </ViewButton>
            </PopupDetails>
          </PopupContent>
        </Popup>
      </Marker>
    );
  }
);

const MapDisplay = ({
  markers = [],
  selectedClassId,
  onMarkerClick,
  showMap,
  userLocation,
  onHideMap,
}) => {
  const [mapBounds, setMapBounds] = useState(null);

  const calculateMapCenter = useMemo(() => {
    const validMarkers = markers.filter(
      (m) =>
        typeof m.lat === "number" &&
        typeof m.lng === "number" &&
        !isNaN(m.lat) &&
        !isNaN(m.lng)
    );

    if (validMarkers.length > 0) {
      const center = validMarkers.reduce(
        (acc, marker) => ({
          lat: acc.lat + marker.lat,
          lng: acc.lng + marker.lng,
        }),
        { lat: 0, lng: 0 }
      );
      return {
        lat: center.lat / validMarkers.length,
        lng: center.lng / validMarkers.length,
      };
    }
    if (userLocation?.lat && userLocation?.lng) {
      return { lat: userLocation.lat, lng: userLocation.lng };
    }
    return { lat: 43.6532, lng: -79.3832 };
  }, [markers, userLocation]);

  const calculateMapBounds = useMemo(() => {
    const validMarkers = markers.filter(
      (m) =>
        typeof m.lat === "number" &&
        typeof m.lng === "number" &&
        !isNaN(m.lat) &&
        !isNaN(m.lng)
    );
    if (validMarkers.length > 0) {
      const firstValidMarker = validMarkers[0];
      const bounds = validMarkers.reduce(
        (acc, marker) => ({
          sw: {
            lat: Math.min(acc.sw.lat, marker.lat),
            lng: Math.min(acc.sw.lng, marker.lng),
          },
          ne: {
            lat: Math.max(acc.ne.lat, marker.lat),
            lng: Math.max(acc.ne.lng, marker.lng),
          },
        }),
        {
          sw: { lat: firstValidMarker.lat, lng: firstValidMarker.lng },
          ne: { lat: firstValidMarker.lat, lng: firstValidMarker.lng },
        }
      );
      if (bounds.ne.lat !== bounds.sw.lat || bounds.ne.lng !== bounds.sw.lng) {
        const latPadding = (bounds.ne.lat - bounds.sw.lat) * 0.1;
        const lngPadding = (bounds.ne.lng - bounds.sw.lng) * 0.1;
        return {
          sw: {
            lat: bounds.sw.lat - latPadding,
            lng: bounds.sw.lng - lngPadding,
          },
          ne: {
            lat: bounds.ne.lat + latPadding,
            lng: bounds.ne.lng + lngPadding,
          },
        };
      } else {
        return {
          sw: { lat: bounds.sw.lat, lng: bounds.sw.lng },
          ne: { lat: bounds.ne.lat, lng: bounds.ne.lng },
        };
      }
    }
    if (userLocation?.lat && userLocation?.lng) {
      return {
        sw: { lat: userLocation.lat - 0.02, lng: userLocation.lng - 0.02 },
        ne: { lat: userLocation.lat + 0.02, lng: userLocation.lng + 0.02 },
      };
    }
    return {
      sw: { lat: 43.6352, lng: -79.4012 },
      ne: { lat: 43.6712, lng: -79.3652 },
    };
  }, [markers, userLocation]);

  useEffect(() => {
    setMapBounds(calculateMapBounds);
  }, [calculateMapBounds]);

  return (
    <MapWrapper>
      <LeafletMarkerStyles />
      <HideMapButton onClick={onHideMap}>
        <MapIcon size={16} /> Hide Map
      </HideMapButton>
      <Map>
        <MapContainer
          center={[calculateMapCenter.lat, calculateMapCenter.lng]}
          zoom={12}
          attributionControl={false}
          scrollWheelZoom={true}
          zoomControl={false}
          aria-label="Map displaying nearby classes"
          title="Map displaying nearby classes"
        >
          <TileLayer
            attribution='© <a href="https://carto.com/">CARTO</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <ChangeView bounds={mapBounds} />
          <InvalidateSizeOnShow isVisible={showMap} />
          {markers.map(
            (marker) =>
              typeof marker.lat === "number" &&
              typeof marker.lng === "number" &&
              !isNaN(marker.lat) &&
              !isNaN(marker.lng) && (
                <MarkerComponent
                  key={marker.id}
                  position={[marker.lat, marker.lng]}
                  id={marker.id}
                  isSelected={selectedClassId === marker.id}
                  onClick={onMarkerClick}
                  classInfo={marker}
                />
              )
          )}
        </MapContainer>
      </Map>
    </MapWrapper>
  );
};

export default React.memo(MapDisplay);
