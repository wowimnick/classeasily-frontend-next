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
  grid-template-columns: 1.5fr 1fr;
  gap: 2.5rem;
  align-items: start;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const SectionBlock = styled.section`
  background: white;
  padding: 2rem;
  border: 1px solid #e8e8e8;
  border-radius: 16px;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const SectionHeader = styled.div`
  margin-bottom: 1.75rem;

  h2 {
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0 0 0.35rem 0;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    color: #111;

    svg {
      color: #ff385c;
      width: 20px;
      height: 20px;
    }
  }

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;

    h2 {
      font-size: 1.25rem;
    }
  }
`;

const MapWrapper = styled.div`
  height: 450px;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  border: 1px solid #e8e8e8;
  z-index: 1;
  background: #f8f8f8;

  .leaflet-container {
    height: 100%;
    width: 100%;
    font-family: "ProximaSoft", sans-serif;
  }

  @media (max-width: 768px) {
    height: 320px;
    border-radius: 12px;
  }
`;

const LocationLink = styled.a`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  color: #111;
  padding: 0.875rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 0.95rem;
  font-weight: 600;
  z-index: 401;
  white-space: nowrap;
  text-decoration: none;
  transition: all 0.2s ease;
  border: 1px solid #e8e8e8;

  &:hover {
    background: #fafafa;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    transform: translateX(-50%) translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1.25rem;
    font-size: 0.9rem;
  }
`;

const AddressBlock = styled.div`
  display: flex;
  align-items: start;
  gap: 1rem;
  padding: 1.25rem;
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  margin-bottom: 1.5rem;

  svg {
    color: #ff385c;
    flex-shrink: 0;
    margin-top: 2px;
    width: 20px;
    height: 20px;
  }
`;

const AddressText = styled.div`
  flex: 1;
  min-width: 0;

  .label {
    font-size: 0.75rem;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
    margin-bottom: 0.35rem;
  }

  .address {
    font-size: 0.95rem;
    color: #111;
    font-weight: 500;
    line-height: 1.5;
  }
`;

const HoursItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 0.9rem;

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
  background: #fafafa;
  border-radius: 16px;
  border: 1px solid #f0f0f0;

  svg {
    margin-bottom: 1rem;
    opacity: 0.25;
  }

  h3 {
    font-size: 1.15rem;
    margin: 0 0 0.35rem 0;
    color: #666;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
    color: #888;
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
        <HoursItem key={index}>
          <span className="day">{line.days}</span>
          <span className="time">{line.times}</span>
        </HoursItem>
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
    <PageLayout>
      <div>
        <SectionHeader>
          <h2>
            <MapPin />
            Location & Directions
          </h2>
        </SectionHeader>
        {businessAddress && (
          <AddressBlock>
            <MapPin />
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
            <MapPin size={56} />
            <h3>Location Not Available</h3>
            <p>Map location is currently unavailable.</p>
          </EmptyState>
        )}
      </div>

      <div>
        {formattedHours.length > 0 && (
          <SectionBlock>
            <SectionHeader>
              <h2>
                <Clock />
                Business Hours
              </h2>
            </SectionHeader>
            <BusinessHoursList formattedHours={formattedHours} />
          </SectionBlock>
        )}
      </div>
    </PageLayout>
  );
};

export default LocationTab;
