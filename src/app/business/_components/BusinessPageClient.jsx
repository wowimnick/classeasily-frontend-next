"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import styled, { createGlobalStyle, css } from "styled-components";
import Image from "next/image";
import { 
  MapPin, Star, Phone, Mail, Clock, 
  ExternalLink, Facebook, Twitter, Instagram, Linkedin, Youtube, 
  Share, Heart, Globe, Users
} from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import NumberFlow from "@number-flow/react";

// Imported components
import ClientHeader from "@/components/layout/ClientHeader";
import FooterClient from "@/components/homepage/FooterClient";
import ReviewsTab from "./ReviewsTab.jsx";
import BusinessUpcomingClasses from "./BusinessUpcomingClasses.jsx";
import {
  formatBusinessLocationLine,
  dedupeBusinessLocationsForDisplay,
} from "@/lib/formatBusinessLocationLine";

// --- GLOBAL STYLES ---
const GlobalStyles = createGlobalStyle`
  body {
    background-color: #ffffff;
    color: #222222;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  
  .leaflet-container {
    width: 100%;
    height: 100%;
    z-index: 1;
  }
`;

// --- LAYOUT CONTAINERS ---

const PageWrapper = styled.div`
  min-height: 100vh;
`;

const MainContainer = styled.main`
  max-width: 1320px; /* Airbnb standard width */
  margin: 0 auto;
  padding: 0 24px 48px 24px;
  
  @media (max-width: 744px) {
    padding: 0 24px 24px 24px;
  }
`;

// --- 1. HEADER SECTION (Logo + Title & Meta) ---
const BrandHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding-top: 24px;
  padding-bottom: 8px;
  margin-bottom: 24px;

  @media (max-width: 744px) {
    gap: 12px;
  }
`;

const LogoSlot = styled.div`
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (min-width: 744px) {
    width: 64px;
    height: 64px;
  }
`;

const LogoInitial = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: #6b7280;
  line-height: 1;
`;

const HeaderTextBlock = styled.div`
  min-width: 0;
  flex: 1;
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 700;
  line-height: 1.125;
  color: #222;
  
  @media (min-width: 744px) {
    font-size: 32px;
  }
`;

const MetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
`;

const LeftMeta = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: #222;
  gap: 8px;
  flex-wrap: wrap;

  span.dot {
    margin: 0 2px;
    font-size: 8px;
    color: #222;
  }

  a {
    color: #222;
    text-decoration: underline;
    font-weight: 500;
    cursor: pointer;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  
  @media (max-width: 550px) {
    display: none; /* Hide share/save on mobile for simplicity or move them */
  }
`;

const ActionBtn = styled.button`
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: underline;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.1s;

  &:hover {
    background: #f7f7f7;
  }
`;

// --- 2. TWO COLUMN LAYOUT ---
const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1.8fr 1fr;
  gap: 64px;
  position: relative;

  @media (max-width: 950px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

const LeftColumn = styled.div`
  min-width: 0;
`;

const RightColumn = styled.div`
  position: relative;
  min-width: 0;
`;

// --- LEFT COLUMN CONTENT ---

const SectionDivider = styled.div`
  border-bottom: 1px solid #dddddd;
  padding-top: 12px;
  margin-bottom: 18px;
`;

const HostRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 24px;
  border-bottom: 1px solid #dddddd;
  margin-bottom: 32px;
`;

const HostInfo = styled.div`
  h2 {
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 4px;
    color: #222;
  }
  p {
    color: #717171;
    font-size: 16px;
  }
`;

const DescriptionText = styled.p`
  font-size: 16px;
  line-height: 24px;
  color: #222;
  white-space: pre-line;
  margin-bottom: 24px;
`;

// "At a glance" redesigned as Highlights
const HighlightsGrid = styled.div`
  display: grid;
  gap: 24px;
  margin-bottom: 32px;
`;

const HighlightItem = styled.div`
  display: flex;
  gap: 16px;
  
  .icon {
    min-width: 24px;
  }
  
  .content {
    h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #222;
    }
    p {
      font-size: 14px;
      color: #717171;
      line-height: 20px;
    }
  }
`;

// --- RIGHT COLUMN (STICKY SIDEBAR) ---

const StickyWrapper = styled.div`
  position: sticky;
  top: 100px; /* Offset for header */
  z-index: 10;
`;

const BookingCard = styled.div`
  border: 1px solid rgb(221, 221, 221);
  border-radius: 12px;
  padding: 24px;
  box-shadow: rgba(0, 0, 0, 0.12) 0px 6px 16px;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  
  .price {
    font-size: 22px;
    font-weight: 600;
    color: #222;
  }
  
  .rating {
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    color: #222;
    
    span {
      color: #717171;
      font-weight: 400;
      text-decoration: underline;
      margin-left: 4px;
    }
  }
`;

const MapPreviewBox = styled.div`
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  border: 1px solid #eee;
  margin-bottom: 8px;

  .leaflet-container {
    background: #f0f0f0;
  }
`;

const ContactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ContactItem = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  font-size: 15px;
  color: #222;
  
  svg {
    color: #717171;
    min-width: 18px;
    margin-top: 2px;
  }
  
  a {
    text-decoration: underline;
    color: #222;
    word-break: break-all;
  }
`;

const HoursContainer = styled.div`
  border-top: 1px solid #eee;
  padding-top: 16px;
  margin-top: 8px;
`;

const HoursTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SocialRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
  justify-content: flex-start;
`;

const SocialLink = styled.a`
  color: #717171;
  transition: color 0.2s;
  &:hover { color: #222; }
`;

const MobileMapLink = styled.a`
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  color: #222;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 0.85rem;
  font-weight: 600;
  z-index: 401;
  text-decoration: none;
  white-space: nowrap;
  
  &:hover { background: #f7f7f7; }
`;

// --- HELPERS ---

const createBrandIcon = () => {
  if (typeof window === 'undefined') return null;
  return L.divIcon({
    html: `<div style="
      background-color: #ff385c;
      width: 24px; height: 24px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const HoursListSimple = ({ businessHours }) => {
  const [showAll, setShowAll] = useState(false);
  if (!businessHours?.length) return <span style={{fontSize: '14px', color: '#717171'}}>Hours not available</span>;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const displayHours = showAll ? businessHours : businessHours.slice(0, 2);

  return (
    <div style={{fontSize: '14px'}}>
      {displayHours.map((h, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontWeight: h.day.includes(today) ? '600' : '400' }}>{h.day}</span>
          <span style={{ color: h.isOpen ? '#222' : '#717171' }}>{h.isOpen ? `${h.open} - ${h.close}` : 'Closed'}</span>
        </div>
      ))}
      {businessHours.length > 2 && (
        <button 
          onClick={() => setShowAll(!showAll)}
          style={{background:'none', border:'none', padding:0, textDecoration:'underline', marginTop:'4px', cursor:'pointer', fontWeight: 600}}
        >
          {showAll ? 'Close' : `View all (${businessHours.length})`}
        </button>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---

const BusinessPageClient = ({ initialData, slug }) => {
  const router = useRouter();
  const [businessData, setBusinessData] = useState(initialData);
  const [memberships, setMemberships] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [mapContainerKey] = useState(() => `business-map-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!slug || typeof window === "undefined") return;
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${base.replace(/\/$/, "")}/businesses/${slug}/memberships/`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMemberships(Array.isArray(data) ? data : []))
      .catch(() => setMemberships([]));
  }, [slug]);

  const handleJoinPlan = (productId) => {
    if (website && (website.startsWith("http://") || website.startsWith("https://"))) {
      const sep = website.includes("?") ? "&" : "?";
      window.location.href = `${website}${sep}ce_plan=${productId}&ce_mode=membership`;
    } else {
      const key = widget_api_key ? String(widget_api_key) : "";
      router.push(`/business/${slug}/join?ce_plan=${productId}&ce_mode=membership${key ? `&key=${encodeURIComponent(key)}` : ""}`);
    }
  };

  const handleFavoriteChange = (classId, newIsFavorited) => {
    setBusinessData((currentData) => {
      if (!currentData) return null;
      const updatedClasses = currentData.classes.map((cls) =>
        cls.classId === classId ? { ...cls, is_favorited: newIsFavorited } : cls
      );
      return { ...currentData, classes: updatedClasses };
    });
  };

  if (!businessData) return null;

  const {
    businessName,
    businessDescription,
    business_image_medium_url,
    businessCity,
    businessState,
    businessAddress,
    average_rating,
    totalReviews,
    classes = [],
    businessHours,
    studentContactPhone,
    studentContactEmail,
    website,
    widget_api_key,
    social_media_links = {},
    locations = [],
  } = businessData;

  const ratingAsNumber = average_rating ? parseFloat(average_rating) : 0;

  const displayLocations = useMemo(
    () => dedupeBusinessLocationsForDisplay(locations),
    [locations],
  );

  const primaryBusinessLocation = useMemo(() => {
    if (!displayLocations?.length) return null;
    return displayLocations.find((l) => l.is_primary) || displayLocations[0];
  }, [displayLocations]);

  // Coordinates for map (prefer primary saved location, then first class)
  const mapCoordinates = useMemo(() => {
    if (
      primaryBusinessLocation?.latitude != null &&
      primaryBusinessLocation?.longitude != null
    ) {
      const lat = parseFloat(primaryBusinessLocation.latitude);
      const lng = parseFloat(primaryBusinessLocation.longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lat, lng];
    }
    if (classes.length > 0 && classes[0].coordinates) {
      const parts = classes[0].coordinates.split(",");
      if (parts.length === 2) return [parseFloat(parts[0]), parseFloat(parts[1])];
    }
    return [40.7128, -74.006];
  }, [classes, primaryBusinessLocation]);

  const socialIcons = {
    facebook: <Facebook size={18} />,
    twitter: <Twitter size={18} />,
    instagram: <Instagram size={18} />,
    linkedin: <Linkedin size={18} />,
    youtube: <Youtube size={18} />,
  };

  return (
    <PageWrapper>
      <GlobalStyles />
      <ClientHeader />

      <MainContainer>
        
        {/* 1. BRAND: compact logo + title & meta */}
        <BrandHeader>
          <LogoSlot>
            {business_image_medium_url ? (
              <Image
                src={business_image_medium_url}
                alt={`${businessName} logo`}
                fill
                priority
                sizes="64px"
                style={{ objectFit: "contain", padding: "6px" }}
              />
            ) : (
              <LogoInitial>
                {(businessName && businessName.charAt(0).toUpperCase()) || "?"}
              </LogoInitial>
            )}
          </LogoSlot>
          <HeaderTextBlock>
            <Title>{businessName}</Title>
            <MetaRow>
              <LeftMeta>
                {ratingAsNumber > 0 && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Star size={14} fill="#222" strokeWidth={0} />
                      <span style={{ fontWeight: 600 }}>
                        <NumberFlow
                          value={ratingAsNumber}
                          format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                        />
                      </span>
                    </div>
                    <span className="dot">•</span>
                    <a href="#reviews-section">
                      <NumberFlow value={totalReviews || 0} /> reviews
                    </a>
                    <span className="dot">•</span>
                  </>
                )}
                {ratingAsNumber === 0 && (
                  <>
                    <span style={{ color: "#222", fontWeight: 600 }}>New Business</span>
                    <span className="dot">•</span>
                  </>
                )}
                <span>
                  {businessCity}, {businessState}
                </span>
              </LeftMeta>
            </MetaRow>
          </HeaderTextBlock>
        </BrandHeader>

        {/* 2. MAIN CONTENT GRID */}
        <ContentGrid>
          
          {/* LEFT COLUMN: Details, Description, Reviews */}
          <LeftColumn>
            <HostRow>
              <HostInfo>
                <h2>Hosted by {businessName}</h2>
                <p>{classes.length} active classes • Joined recently</p>
              </HostInfo>
            </HostRow>

            {/* Highlights Section */}
            <HighlightsGrid>
              {ratingAsNumber > 4.5 && (
                <HighlightItem>
                  <div className="icon"><Star size={24} /></div>
                  <div className="content">
                    <h3>Top Rated</h3>
                    <p>This business is highly rated by students.</p>
                  </div>
                </HighlightItem>
              )}
              <HighlightItem>
                <div className="icon"><MapPin size={24} /></div>
                <div className="content">
                  <h3>Great Location</h3>
                  <p>Located in the heart of {businessCity}.</p>
                </div>
              </HighlightItem>
            </HighlightsGrid>

            <SectionDivider />

            {/* UPCOMING CLASSES — above locations / about so visitors see schedules first */}
            <div style={{ marginBottom: "32px" }}>
              <BusinessUpcomingClasses
                classes={classes}
                businessName={businessName}
                handleFavoriteChange={handleFavoriteChange}
              />
            </div>

            <SectionDivider />

            {displayLocations.length > 0 && (
              <div style={{ marginBottom: "32px" }}>
                <h3
                  style={{
                    fontSize: "22px",
                    fontWeight: 600,
                    marginBottom: "16px",
                  }}
                >
                  Locations
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {displayLocations.map((loc) => {
                    const line = formatBusinessLocationLine(loc);
                    const q = encodeURIComponent(line || loc.address || "");
                    return (
                      <div
                        key={loc.id}
                        style={{
                          padding: 16,
                          border: "1px solid #e5e7eb",
                          borderRadius: 12,
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>
                          {loc.name}
                          {loc.is_primary ? (
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#2563eb",
                                textTransform: "uppercase",
                              }}
                            >
                              Primary
                            </span>
                          ) : null}
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: "#4b5563" }}>
                          {line}
                        </p>
                        {line ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${q}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-block",
                              marginTop: 10,
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#111827",
                            }}
                          >
                            Open in Maps
                          </a>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {displayLocations.length > 0 && <SectionDivider />}

            <div style={{marginBottom: '32px'}}>
              <h3 style={{fontSize:'22px', fontWeight:600, marginBottom:'16px'}}>About this business</h3>
              <DescriptionText>
                {businessDescription || "No description provided."}
              </DescriptionText>
            </div>

            <SectionDivider />

            {/* MEMBERSHIPS */}
            {memberships.length > 0 && (
              <div style={{ marginBottom: "32px" }}>
                <h3 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Users size={22} /> Memberships
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {memberships.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: 16,
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                        <div style={{ fontSize: 14, color: "#6b7280" }}>
                          ${p.price} / {p.billing_interval === "year" ? "year" : "month"}
                          {p.access_type === "credits" && p.credit_allowance != null && (
                            <> · {p.credit_allowance} {p.credit_unit || "credits"}</>
                          )}
                        </div>
                        {p.description && (
                          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>{p.description}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleJoinPlan(p.id)}
                        style={{
                          padding: "10px 20px",
                          background: "#222",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <SectionDivider />

            {/* REVIEWS */}
            <div id="reviews-section">
              <ReviewsTab
                slug={slug}
                totalReviews={totalReviews || 0}
                ratingAsNumber={ratingAsNumber}
              />
            </div>

          </LeftColumn>

          {/* RIGHT COLUMN: Sticky Sidebar */}
          <RightColumn>
            <StickyWrapper>
              <BookingCard>
                <CardHeader>
                  <div className="price">Contact Info</div>
                  <div className="rating">
                    <Star size={14} fill="#222" />
                    {ratingAsNumber > 0 ? ratingAsNumber.toFixed(2) : "New"}
                    <span>({totalReviews} reviews)</span>
                  </div>
                </CardHeader>

                {/* Map Preview - key per slug so Leaflet never reuses the same container */}
                <MapPreviewBox>
                   {isMounted && (
                    <MapContainer
                      key={`${mapContainerKey}-${slug ?? "unknown"}`}
                      center={mapCoordinates}
                      zoom={14}
                      scrollWheelZoom={false}
                      zoomControl={false}
                      attributionControl={false}
                      dragging={false}
                      doubleClickZoom={false}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                      <Marker position={mapCoordinates} icon={createBrandIcon() || undefined} />
                    </MapContainer>
                  )}
                  <MobileMapLink 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      (primaryBusinessLocation && formatBusinessLocationLine(primaryBusinessLocation)) ||
                        businessAddress ||
                        "",
                    )}`}
                    target="_blank"
                  >
                    Open in Maps
                  </MobileMapLink>
                </MapPreviewBox>

                <ContactList>
                  {studentContactPhone && (
                    <ContactItem>
                      <Phone size={18} />
                      <a href={`tel:${studentContactPhone}`}>{studentContactPhone}</a>
                    </ContactItem>
                  )}
                  {studentContactEmail && (
                    <ContactItem>
                      <Mail size={18} />
                      <a href={`mailto:${studentContactEmail}`}>{studentContactEmail}</a>
                    </ContactItem>
                  )}
                  {website && (
                    <ContactItem>
                      <Globe size={18} />
                      <a href={website} target="_blank" rel="noreferrer">Visit Website <ExternalLink size={12} style={{display:'inline'}}/></a>
                    </ContactItem>
                  )}
                </ContactList>

                <HoursContainer>
                  <HoursTitle><Clock size={16} /> Opening Hours</HoursTitle>
                  <HoursListSimple businessHours={businessHours} />
                </HoursContainer>

                {Object.keys(social_media_links).length > 0 && (
                  <SocialRow>
                    {Object.entries(social_media_links).map(([key, url]) => (
                      url && socialIcons[key] ? (
                        <SocialLink key={key} href={url} target="_blank" rel="noreferrer">{socialIcons[key]}</SocialLink>
                      ) : null
                    ))}
                  </SocialRow>
                )}

              </BookingCard>
            </StickyWrapper>
          </RightColumn>

        </ContentGrid>
      </MainContainer>
      <FooterClient />
    </PageWrapper>
  );
};

export default BusinessPageClient;