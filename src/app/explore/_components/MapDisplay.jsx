// components/explore/MapDisplay.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import styled, { createGlobalStyle } from "styled-components";
import { Star, Navigation, MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- STYLES ---

const LeafletMarkerStyles = createGlobalStyle`
  /* Standard Price Marker */
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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(0,0,0,0.05);
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.2s;
    cursor: pointer;
    white-space: nowrap;
  }

  .leaflet-price-marker.selected,
  .leaflet-price-marker:hover {
    background: #222; /* Darker contrast on hover like Airbnb */
    border-color: #222;
    color: white;
    transform: scale(1.1);
    z-index: 1000 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }
  
  .leaflet-price-marker.selected {
    background: #222;
  }

  /* --- IMPROVED CLUSTER STYLES --- */
  .marker-cluster-custom {
    background: #ff385c; /* Brand Color */
    color: #fff;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.25);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-weight: 700;
    
    /* Perfect Centering */
    display: flex !important;
    align-items: center;
    justify-content: center;
    text-align: center;
    
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .marker-cluster-custom span {
    line-height: 1;
    display: block;
    /* Optical adjustment: numbers often look slightly high without this */
    padding-top: 1px; 
  }

  .marker-cluster-custom:hover {
    transform: scale(1.15);
    z-index: 1000 !important;
    background: #ff1447;
  }

  /* Dynamic Text Sizing based on cluster size */
  .marker-cluster-small { font-size: 14px; }
  .marker-cluster-medium { font-size: 15px; }
  .marker-cluster-large { font-size: 16px; }

  /* Map Container Reset */
  .map-root-container {
    height: 100%;
    width: 100%;
  }

  /* --- ZOOM CONTROL STYLES --- */
  .leaflet-control-zoom {
    border: none !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
    margin-top: 12px !important;
    margin-right: 12px !important;
  }

  .leaflet-control-zoom a {
    background: white !important;
    color: #222 !important;
    border-bottom: 1px solid #f0f0f0 !important;
    width: 36px !important;
    height: 36px !important;
    line-height: 36px !important;
    font-size: 18px !important;
    font-weight: 400 !important;
    transition: background-color 0.2s;
  }

  .leaflet-control-zoom a:hover {
    background: #f7f7f7 !important;
    color: #f81e3e !important;
  }

  .leaflet-control-zoom a:first-child {
    border-top-left-radius: 8px !important;
    border-top-right-radius: 8px !important;
  }

  .leaflet-control-zoom a:last-child {
    border-bottom-left-radius: 8px !important;
    border-bottom-right-radius: 8px !important;
    border-bottom: none !important;
  }
`;

const MapWrapper = styled.div`
  z-index: 1;
  position: relative;
  height: 100%;
  background: #fff;
  border-radius: 30px;
  overflow: hidden;

  .leaflet-container {
    font-family: "ProximaSoft", sans-serif;
    height: 100%;
    width: 100%;
    outline: none;
  }

  .leaflet-popup-content-wrapper {
    padding: 0;
    border-radius: 12px;
    overflow: hidden;
    width: 260px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }
  .leaflet-popup-content {
    margin: 0;
    width: 100% !important;
  }
  .leaflet-popup-tip {
    background: white;
  }
`;

const HideMapButton = styled.button`
  display: none;
  @media (min-width: 1049px) {
    display: flex;
    align-items: center;
    gap: 8px;
    position: absolute;
    top: 12px;
    left: 12px;
    background: white;
    padding: 10px 16px;
    border-radius: 20px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    z-index: 401;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    color: #222;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.18);
      transform: translateY(-1px);
    }
  }
`;

// ... [Popup Styled Components remain exactly the same as previous file] ...
const PopupContent = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
`;

const PopupImage = styled.div`
  width: 100%;
  height: 140px;
  position: relative;
  background-image: ${(props) => {
    if (!props.$src || props.$src.trim() === "") return "none";
    const encodedUrl = props.$src.replace(/\s/g, "%20");
    return `url("${encodedUrl}")`;
  }};
  background-size: cover;
  background-position: center;
  background-color: #f7f7f7;
  background-repeat: no-repeat;
`;

const PopupRating = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #222;
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.95);
  padding: 4px 8px;
  border-radius: 12px;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ReviewCount = styled.span`
  color: #717171;
  font-weight: 400;
`;

const PopupDetails = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PopupTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #222;
  margin: 0 0 2px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PopupCompanyInfo = styled.div`
  display: flex;
  align-items: center;
  color: #717171;
  font-size: 13px;
  gap: 4px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PopupLocationRow = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  color: #717171;
  font-size: 13px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DistanceBadge = styled.span`
  color: #717171;
  font-size: 13px;
  font-weight: 400;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 2px;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 6px;
  flex-wrap: wrap;
`;

const Price = styled.div`
  color: #222;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: baseline;
  gap: 2px;
  white-space: nowrap;
`;

const PriceLabel = styled.span`
  color: #717171;
  font-size: 13px;
  font-weight: 400;
`;

const PriceSeparator = styled.span`
  color: #717171;
  font-size: 12px;
  margin: 0 1px;
`;

const ViewButton = styled.button`
  width: 100%;
  padding: 10px;
  background: #ff385c;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.2s;

  &:hover {
    background: #ff1447;
    transform: translateY(-1px);
  }
`;

// --- MARKER & CLUSTER GENERATORS ---

const createPriceIcon = (price, isSelected) => {
  const priceText = price ? `$${Math.round(price)}` : "View";
  const className = `leaflet-price-marker ${isSelected ? "selected" : ""}`;

  return L.divIcon({
    html: `<span>${priceText}</span>`,
    className: className.trim(),
    iconSize: null, // Let CSS handle auto width
    iconAnchor: [24, 16], // Approximate center for the pill
    popupAnchor: [0, -20],
  });
};

const createClusterCustomIcon = function (cluster) {
  const count = cluster.getChildCount();

  // Dynamic Sizing Logic
  let size = 40;
  let sizeClass = "marker-cluster-small";

  if (count >= 10 && count < 100) {
    size = 48;
    sizeClass = "marker-cluster-medium";
  } else if (count >= 100) {
    size = 56;
    sizeClass = "marker-cluster-large";
  }

  return L.divIcon({
    html: `<span>${count}</span>`,
    className: `marker-cluster-custom ${sizeClass}`,
    iconSize: L.point(size, size, true),
    // CRITICAL FIX: Anchor center-point to the coordinate
    // otherwise the top-left of the bubble sits on the coordinate
    iconAnchor: [size / 2, size / 2],
  });
};

const formatDistance = (distanceInKm) => {
  if (
    distanceInKm === null ||
    typeof distanceInKm !== "number" ||
    isNaN(distanceInKm)
  )
    return null;
  if (distanceInKm < 0.1) return "<100m";
  if (distanceInKm < 1) return `${Math.round(distanceInKm * 1000)}m`;
  if (distanceInKm < 10) return `${distanceInKm.toFixed(1)}km`;
  return `${Math.round(distanceInKm)}km`;
};

const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// Helper component to access map instance in React Leaflet v4+
function MapController({ bounds, onMapReady }) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) onMapReady(map);
  }, [map, onMapReady]);

  useEffect(() => {
    if (bounds && map) {
      try {
        const southWest = L.latLng(bounds.sw.lat, bounds.sw.lng);
        const northEast = L.latLng(bounds.ne.lat, bounds.ne.lng);
        const leafletBounds = L.latLngBounds(southWest, northEast);

        if (leafletBounds.isValid()) {
          map.fitBounds(leafletBounds, {
            padding: [80, 80], // Increased padding for better view
            maxZoom: 15,
            animate: true,
            duration: 0.8,
          });
        }
      } catch (error) {
        console.error("Error updating map bounds:", error);
      }
    }
  }, [bounds, map]);

  return null;
}

// Helper component for resizing
function InvalidateSizeOnShow({ isVisible }) {
  const map = useMap();

  useEffect(() => {
    if (
      isVisible &&
      map &&
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

    const formattedDistance = formatDistance(classInfo.distance);

    return (
      <Marker
        position={position}
        icon={icon}
        eventHandlers={{ click: () => onClick(id) }}
      >
        <Popup autoPan={true} autoPanPadding={[50, 50]}>
          <PopupContent>
            <PopupImage $src={imageUrl}>
              {classInfo.rating > 0 && (
                <PopupRating>
                  <Star size={12} fill="#222" />
                  {Number(classInfo.rating).toFixed(1)}
                  {classInfo.totalReviews > 0 && (
                    <ReviewCount>({classInfo.totalReviews})</ReviewCount>
                  )}
                </PopupRating>
              )}
            </PopupImage>

            <PopupDetails>
              <PopupTitle title={classInfo.title}>{classInfo.title}</PopupTitle>

              {classInfo.business_name && (
                <PopupCompanyInfo title={classInfo.business_name}>
                  {truncateText(classInfo.business_name, 30)}
                </PopupCompanyInfo>
              )}

              <PopupLocationRow>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {classInfo.location || "Location unavailable"}
                </span>
                {formattedDistance && (
                  <>
                    <span style={{ color: "#c0c0c0", margin: "0 2px" }}>•</span>
                    <DistanceBadge>
                      <Navigation size={10} strokeWidth={2.5} />
                      {formattedDistance}
                    </DistanceBadge>
                  </>
                )}
              </PopupLocationRow>

              <PriceRow>
                {classInfo.min_session_price === null &&
                classInfo.min_course_price === null ? (
                  <Price>
                    <PriceLabel>Pricing unavailable</PriceLabel>
                  </Price>
                ) : (
                  <>
                    {classInfo.min_session_price !== null && (
                      <Price>
                        <span>${classInfo.min_session_price}</span>
                        <PriceLabel>/ class</PriceLabel>
                      </Price>
                    )}
                    {classInfo.min_session_price !== null &&
                      classInfo.min_course_price !== null && (
                        <PriceSeparator>•</PriceSeparator>
                      )}
                    {classInfo.min_course_price !== null && (
                      <Price>
                        <span>${classInfo.min_course_price}</span>
                        <PriceLabel>/ course</PriceLabel>
                      </Price>
                    )}
                  </>
                )}
              </PriceRow>

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
  const [isMounted, setIsMounted] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);
  const [mapKey, setMapKey] = useState(null);

  useEffect(() => {
    setMapKey(`map-instance-${Date.now()}`);
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

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
        <MapPin size={16} /> Hide Map
      </HideMapButton>

      {isMounted && mapKey && (
        <div key={mapKey} className="map-root-container">
          <MapContainer
            center={[calculateMapCenter.lat, calculateMapCenter.lng]}
            zoom={12}
            attributionControl={false}
            scrollWheelZoom={true}
            zoomControl={false}
            style={{ height: "100%", width: "100%" }}
          >
            <ZoomControl position="topright" />

            <TileLayer
              attribution='© <a href="https://carto.com/">CARTO</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            <MapController bounds={mapBounds} />
            <InvalidateSizeOnShow isVisible={showMap} />

            <MarkerClusterGroup
              chunkedLoading
              iconCreateFunction={createClusterCustomIcon}
              maxClusterRadius={40}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
            >
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
            </MarkerClusterGroup>
          </MapContainer>
        </div>
      )}
    </MapWrapper>
  );
};

export default React.memo(MapDisplay);
