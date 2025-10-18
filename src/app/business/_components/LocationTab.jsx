"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import { MapPin, Clock } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import ReactDOMServer from "react-dom/server";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Building } from "lucide-react";

const PageLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 3rem;
  align-items: start;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
`;

const PrimaryColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const SecondaryColumn = styled.div`
  position: sticky;
  top: 150px;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (max-width: 992px) {
    position: static;
  }
`;

const SectionBlock = styled.section`
  background: white;
  padding: 2.5rem;
  border: 1px solid #f1f5f9;
  border-radius: 12px;

  &.borderless {
    background: transparent;
    padding: 0;
    border: none;
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const SectionHeader = styled.div`
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;

  h2 {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    svg {
      color: #ff385c;
      width: 24px;
      height: 24px;
    }
  }

  .subtitle-wrapper {
    flex: 1;
  }

  @media (max-width: 768px) {
    h2 {
      font-size: 1.5rem;
    }
  }
`;

const MapWrapper = styled.div`
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  z-index: 1;

  .leaflet-container {
    height: 100%;
    width: 100%;
    font-family: "Proxima Soft", sans-serif;
  }

  @media (max-width: 768px) {
    height: 350px;
  }
`;

const LocationLink = styled.a`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  color: #222;
  padding: 14px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 1rem;
  font-weight: 500;
  z-index: 401;
  white-space: nowrap;
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: #f7f7f7;
  }
`;

const AddressBlock = styled.div`
  display: flex;
  align-items: start;
  gap: 1rem;
  padding: 1rem;
  width: fit-content;
  background: #fefefe;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  svg {
    color: #ff385c;
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const AddressText = styled.div`
  flex: 1;

  .label {
    font-size: 0.8rem;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .address {
    font-size: 0.95rem;
    color: #111;
    font-weight: 500;
  }
`;

const HoursCompactItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.95rem;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }

  .day {
    font-weight: 600;
    color: #333;
  }

  .time {
    color: #666;
    font-weight: 500;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #999;

  svg {
    margin-bottom: 1.5rem;
    opacity: 0.3;
  }

  h3 {
    font-size: 1.25rem;
    margin: 0;
    color: #666;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
  }
`;

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

const formatTime = (timeString) => {
  if (!timeString) return "N/A";
  try {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return timeString;
  }
};

const formatBusinessHours = (hours) => {
  if (!hours || !Array.isArray(hours) || hours.length === 0) {
    return [];
  }

  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const groupedByTime = hours.reduce((acc, day) => {
    const timeRange = day.isOpen
      ? `${formatTime(day.open)} - ${formatTime(day.close)}`
      : "Closed";
    if (!acc[timeRange]) {
      acc[timeRange] = [];
    }
    acc[timeRange].push(day.day);
    return acc;
  }, {});

  const formattedLines = [];

  for (const timeRange in groupedByTime) {
    const days = groupedByTime[timeRange].sort(
      (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
    );
    let currentGroup = [];
    const dayGroups = [];

    days.forEach((day, index) => {
      const dayIndex = dayOrder.indexOf(day);
      if (index > 0 && dayIndex === dayOrder.indexOf(days[index - 1]) + 1) {
        currentGroup.push(day);
      } else {
        if (currentGroup.length > 0) {
          dayGroups.push(currentGroup);
        }
        currentGroup = [day];
      }
    });
    dayGroups.push(currentGroup);

    const dayString = dayGroups
      .filter((group) => group.length > 0)
      .map((group) => {
        if (group.length > 2) {
          return `${group[0]} - ${group[group.length - 1]}`;
        }
        return group.join(", ");
      })
      .join(", ");

    if (dayString) {
      formattedLines.push({ days: dayString, times: timeRange });
    }
  }
  return formattedLines;
};

const BusinessHoursList = ({ formattedHours }) => {
  if (!formattedHours || formattedHours.length === 0) return null;

  return (
    <div>
      {formattedHours.map((line, index) => (
        <HoursCompactItem key={index}>
          <span className="day">{line.days}</span>
          <span className="time">{line.times}</span>
        </HoursCompactItem>
      ))}
    </div>
  );
};

const LocationTab = ({
  businessName,
  businessAddress,
  classes,
  businessHours,
}) => {
  const coordinates = useMemo(() => {
    if (!classes || classes.length === 0) {
      return null;
    }
    return classes[0].coordinates;
  }, [classes]);

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

  const googleMapsUrl = useMemo(() => {
    if (businessAddress) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        businessAddress
      )}`;
    }
    if (position) {
      return `https://www.google.com/maps/search/?api=1&query=${position[0]},${position[1]}`;
    }
    return "#";
  }, [businessAddress, position]);

  const formattedHours = formatBusinessHours(businessHours);

  return (
    <SectionBlock className="borderless">
      <PageLayout>
        <PrimaryColumn>
          <SectionHeader style={{ marginBottom: 0 }}>
            <div className="subtitle-wrapper">
              <h2>
                <MapPin />
                Location & Directions
              </h2>
            </div>
          </SectionHeader>
          {businessAddress && (
            <AddressBlock>
              <MapPin size={24} />
              <AddressText>
                <div className="label">Full Address</div>
                <div className="address">{businessAddress}</div>
              </AddressText>
            </AddressBlock>
          )}
          {position ? (
            <MapWrapper>
              <MapContainer
                center={position}
                zoom={15}
                scrollWheelZoom={true}
                attributionControl={false}
                zoomControl={false}
                aria-label={`Map showing location for ${businessName}`}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <Marker
                  position={position}
                  icon={brandIcon}
                  alt={`Location of ${businessName}`}
                />
              </MapContainer>
              <LocationLink
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open location in Google Maps"
              >
                Open in Google Maps
              </LocationLink>
            </MapWrapper>
          ) : (
            <EmptyState>
              <MapPin size={64} />
              <h3>Location Not Available</h3>
              <p>Map location is currently unavailable.</p>
            </EmptyState>
          )}
        </PrimaryColumn>
        <SecondaryColumn>
          {formattedHours.length > 0 && (
            <SectionBlock>
              <SectionHeader>
                <div className="subtitle-wrapper">
                  <h2 style={{ fontSize: "1.5rem" }}>
                    <Clock />
                    Business Hours
                  </h2>
                </div>
              </SectionHeader>
              <BusinessHoursList formattedHours={formattedHours} />
            </SectionBlock>
          )}
        </SecondaryColumn>
      </PageLayout>
    </SectionBlock>
  );
};

export default LocationTab;
