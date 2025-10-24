"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import { useRouter } from "next/navigation";
import styled, { createGlobalStyle } from "styled-components";
import { Star, Building2, MapPin, Navigation } from "lucide-react";
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
  border-radius: 30px;
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

const Map = styled.div`
  height: 100%;
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
    padding: 16px 20px;
    border-radius: 20px;
    border: 1px solid #e0e0e0;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    z-index: 401;
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

  ${(props) =>
    !props.$src || props.$src.trim() === ""
      ? `
        background: #f7f7f7;
      `
      : ""}
`;

const PopupRating = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #222;
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.95);
  padding: 4px 8px;
  border-radius: 16px;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  svg {
    color: #222;
    fill: #222;
    stroke-width: 0;
  }
`;

const ReviewCount = styled.span`
  color: #717171;
  font-size: 13px;
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
  line-height: 1.25;
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

  svg {
    flex-shrink: 0;
  }
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

function ChangeView({ bounds }) {
  const map = useMap();
  const previousBoundsRef = useRef(null);

  useEffect(() => {
    // Don't do anything if map is not ready
    if (!map || !map._loaded) {
      return;
    }

    if (bounds) {
      const currentBoundsStr = JSON.stringify(bounds);
      const previousBoundsStr = JSON.stringify(previousBoundsRef.current);

      if (currentBoundsStr !== previousBoundsStr) {
        previousBoundsRef.current = bounds;

        try {
          const leafletBounds = L.latLngBounds(
            [bounds.sw.lat, bounds.sw.lng],
            [bounds.ne.lat, bounds.ne.lng]
          );

          if (leafletBounds.isValid()) {
            map.fitBounds(leafletBounds, {
              padding: [50, 50],
              maxZoom: 15,
              animate: true,
              duration: 0.5,
            });
          } else {
            console.warn("Invalid bounds, falling back to default view");
            map.setView([bounds.sw.lat, bounds.sw.lng], 14, {
              animate: false,
            });
          }
        } catch (error) {
          console.error("Error setting view:", error);
        }
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
      map &&
      map._loaded &&
      typeof window !== "undefined" &&
      window.innerWidth <= 1048
    ) {
      const timer = setTimeout(() => {
        if (map && map._loaded) {
          map.invalidateSize();
        }
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
        <Popup autoPan={false}>
          <PopupContent>
            <PopupImage $src={imageUrl}>
              {classInfo.rating > 0 && (
                <PopupRating>
                  <Star size={12} />
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
  const [mapBounds, setMapBounds] = useState(null);
  const mapRef = useRef(null);
  const containerRef = useRef(null);

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

  // FIX: Improved cleanup on unmount to prevent DOM errors
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          // Remove all event listeners first
          mapRef.current.off();
          mapRef.current.stop();

          // Remove the map instance
          mapRef.current.remove();
          mapRef.current = null;
        } catch (error) {
          console.error("Error cleaning up map:", error);
        }
      }
    };
  }, []);

  return (
    <MapWrapper ref={containerRef}>
      <LeafletMarkerStyles />
      <HideMapButton onClick={onHideMap}>
        <MapPin size={16} /> Hide Map
      </HideMapButton>
      <Map>
        <MapContainer
          ref={mapRef}
          center={[calculateMapCenter.lat, calculateMapCenter.lng]}
          zoom={12}
          attributionControl={false}
          scrollWheelZoom={true}
          zoomControl={false}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
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
