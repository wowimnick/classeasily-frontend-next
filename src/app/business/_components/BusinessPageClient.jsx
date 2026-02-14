"use client";

import React, { useState, useEffect, useMemo } from "react";
import styled, { createGlobalStyle, css } from "styled-components";
import Image from "next/image";
import { 
  MapPin, Star, Phone, Mail, Clock, 
  ExternalLink, Facebook, Twitter, Instagram, Linkedin, Youtube 
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

// --- GLOBAL STYLES & LEAFLET FIXES ---
const GlobalStyles = createGlobalStyle`
  body {
    background-color: #f2f2f4; /* Light grey background for Bento contrast */
  }
  
  .leaflet-container {
    width: 100%;
    height: 100%;
    border-radius: 24px;
    z-index: 1;
  }
`;

// --- STYLED COMPONENTS (BENTO SYSTEM) ---

const PageWrapper = styled.div`
  min-height: 100vh;
`;

const MainContainer = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  padding-top: 1.5rem;
  min-width: 0;
  box-sizing: border-box;

  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: minmax(min-content, auto);
  gap: 1.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 1.5rem;
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    gap: 0.75rem;
  }
  @media (max-width: 480px) {
    padding: 0.5rem;
    gap: 0.5rem;
  }
`;

// Base Card Style
const BentoCard = styled.div`
  background: white;
  border-radius: 24px;
  padding: 1.25rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.04);
  overflow: hidden;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 16px;
  }
  @media (max-width: 480px) {
    padding: 0.75rem;
    border-radius: 12px;
  }

  ${props => props.$noPadding && css`
    padding: 0;
  `}
  
  ${props => props.$dark && css`
    background: #1a1a1a;
    color: white;
  `}
`;

// --- SPECIFIC GRID CELLS ---

// 1. Hero Cell (Top Left - Big)
const HeroCell = styled(BentoCard)`
  grid-column: span 8;
  grid-row: span 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 380px;
  min-width: 0;
  position: relative;

  @media (max-width: 1024px) {
    grid-column: 1 / -1;
    min-height: 350px;
  }
`;

const HeroBackground = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  
  img {
    object-fit: cover;
    filter: brightness(0.7);
    transition: transform 0.5s ease;
  }

  ${HeroCell}:hover & img {
    transform: scale(1.03);
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  color: white;
  max-width: 650px;
`;

const BadgeRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const Badge = styled.span`
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 0.35rem 0.85rem;
  border-radius: 100px;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid rgba(255,255,255,0.3);

  svg { width: 14px; height: 14px; }
`;

const BusinessTitle = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 1rem;
  letter-spacing: -0.03em;
  text-shadow: 0 4px 12px rgba(0,0,0,0.3);

  @media (max-width: 768px) { font-size: 2.25rem; }
`;

const BusinessBio = styled.p`
  font-size: 1.1rem;
  line-height: 1.5;
  color: rgba(255,255,255,0.9);
  margin-bottom: 1.5rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
`;

// 2. At a glance — compact single row: Rating | Reviews | Classes
const StatsCell = styled(BentoCard)`
  grid-column: span 4;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 0;
  padding: 0.875rem 1.25rem;
  min-width: 0;

  @media (max-width: 1024px) {
    grid-column: 1 / -1;
  }
  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
    gap: 0.75rem;
  }
`;

const GlanceStat = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  flex: 1;
  padding-right: 1rem;
  border-right: 1px solid #eee;

  &:last-child {
    padding-right: 0;
    border-right: none;
  }
  @media (max-width: 480px) {
    padding-right: 0.75rem;
    &:last-child {
      padding-right: 0;
    }
  }
`;

const GlanceStatBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
`;

const GlanceValue = styled.span`
  font-size: 1.35rem;
  font-weight: 700;
  color: #111;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;

const GlanceLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  @media (max-width: 480px) {
    font-size: 0.65rem;
  }
`;

// 3. Classes Section (Full Width) - uses BusinessUpcomingClasses
const ClassesCell = styled(BentoCard)`
  grid-column: span 12;
  background: transparent;
  box-shadow: none;
  border: none;
  padding: 0;
  overflow: visible;
  min-width: 0;
  @media (max-width: 1024px) {
    grid-column: 1 / -1;
  }
`;

// 4. Contact & Hours (Sticky Sidebar on Desktop)
const SidebarWrapper = styled.div`
  grid-column: span 4;
  grid-row: span 2;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;

  @media (max-width: 1024px) {
    grid-column: 1 / -1;
  }
`;

const ActionButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
  text-decoration: none;

  ${props => props.$primary ? css`
    background: #111;
    color: white;
    &:hover { background: #333; transform: translateY(-2px); }
  ` : css`
    background: #f5f5f5;
    color: #333;
    &:hover { background: #e5e5e5; }
  `}
`;

const HoursDivider = styled.div`
  margin: 1.5rem 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  padding: 1rem 0;
  @media (max-width: 768px) {
    margin: 1rem 0;
    padding: 0.75rem 0;
  }
  @media (max-width: 480px) {
    margin: 0.75rem 0;
    padding: 0.5rem 0;
  }
`;

const ContactRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  
  .icon-box {
    width: 40px; height: 40px;
    background: #fff0f3;
    color: #ff385c;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  
  .text {
    display: flex; flex-direction: column;
    font-size: 0.9rem;
    min-width: 0;
    overflow-wrap: break-word;
    word-break: break-word;

    strong { color: #111; }
    span { color: #666; }
  }
  @media (max-width: 480px) {
    padding: 0.5rem 0;
  }
`;

const SocialGrid = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const SocialBtn = styled.a`
  width: 36px; height: 36px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex; align-items: center; justify-content: center;
  color: #555;
  transition: 0.2s;
  &:hover { background: #ff385c; color: white; }
  svg { width: 18px; height: 18px; }
`;

// 5. Map Cell — compact "View in Google Maps" link like ClassPageMap
const MapLink = styled.a`
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
  @media (max-width: 480px) {
    padding: 12px 12px;
    font-size: 0.9rem;
  }
`;

const MapCell = styled(BentoCard)`
  height: 300px;
  padding: 0;
  position: relative;
`;

// 6. Reviews Cell
const ReviewsCell = styled(BentoCard)`
  grid-column: span 8;
  min-width: 0;

  @media (max-width: 1024px) {
    grid-column: 1 / -1;
  }
`;

// --- HELPER COMPONENTS ---

// Custom Leaflet Marker
const createBrandIcon = () => {
  // Check if we are on client to avoid L is not defined
  if (typeof window === 'undefined') return null;
  
  return L.divIcon({
    html: `<div style="
      background-color: #ff385c;
      width: 24px; height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    "></div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const HoursList = ({ businessHours }) => {
  if (!businessHours || businessHours.length === 0) return <p style={{color: '#999'}}>No hours listed</p>;
  
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {businessHours.slice(0, 3).map((h, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
          <span style={{ fontWeight: h.day.includes(today) ? '700' : '400', color: h.day.includes(today) ? '#ff385c' : '#444' }}>
            {h.day}
          </span>
          <span style={{ color: h.isOpen ? '#111' : '#999' }}>
             {h.isOpen ? `${h.open} - ${h.close}` : 'Closed'}
          </span>
        </div>
      ))}
      {businessHours.length > 3 && (
         <div style={{ fontSize: '0.8rem', color: '#ff385c', marginTop: '4px', cursor: 'pointer' }}>
           View all hours
         </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---

const BusinessPageClient = ({ initialData, slug }) => {
  const [businessData, setBusinessData] = useState(initialData);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    social_media_links = {},
    reviews = [] // Assuming some reviews might be passed in initialData or fetched
  } = businessData;

  const ratingAsNumber = average_rating ? parseFloat(average_rating) : 0;
  
  // Coordinates for map (fallback to first class location if business loc missing)
  const mapCoordinates = useMemo(() => {
    if (classes.length > 0 && classes[0].coordinates) {
      const parts = classes[0].coordinates.split(',');
      if (parts.length === 2) return [parseFloat(parts[0]), parseFloat(parts[1])];
    }
    return [40.7128, -74.0060]; // Default NY
  }, [classes]);

  const socialIcons = {
    facebook: <Facebook size={16} />,
    twitter: <Twitter size={16} />,
    instagram: <Instagram size={16} />,
    linkedin: <Linkedin size={16} />,
    youtube: <Youtube size={16} />,
  };

  return (
    <PageWrapper>
      <GlobalStyles />
      <ClientHeader />

      <MainContainer>
        
        {/* 1. HERO CARD */}
        <HeroCell>
          <HeroBackground>
            <Image 
              src={business_image_medium_url || "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80"} 
              alt={businessName}
              fill
            />
            {/* Gradient Overlay */}
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%)'}} />
          </HeroBackground>
          
          <HeroContent>
            <BadgeRow>
              <Badge><MapPin /> {businessCity}, {businessState}</Badge>
              {ratingAsNumber > 0 && (
                <Badge style={{background: 'rgba(255,184,0,0.2)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)'}}>
                  <Star fill="#FFD700" /> {ratingAsNumber.toFixed(1)} Rating
                </Badge>
              )}
            </BadgeRow>
            
            <BusinessTitle>{businessName}</BusinessTitle>
            
            <BusinessBio>
              {businessDescription 
                ? (businessDescription.length > 150 ? businessDescription.substring(0, 150) + "..." : businessDescription)
                : "Welcome to our business page. We offer top-tier classes and experiences."}
            </BusinessBio>
          </HeroContent>
        </HeroCell>

        {/* 2. AT A GLANCE — compact row: Rating | Reviews | Classes */}
        <StatsCell>
          <GlanceStat>
            <GlanceStatBlock>
              <GlanceValue>
                <Star size={18} fill="#ff385c" color="#ff385c" />
                <NumberFlow value={ratingAsNumber} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
              </GlanceValue>
              <GlanceLabel>Rating</GlanceLabel>
            </GlanceStatBlock>
          </GlanceStat>
          <GlanceStat>
            <GlanceStatBlock>
              <GlanceValue><NumberFlow value={totalReviews} /></GlanceValue>
              <GlanceLabel>Reviews</GlanceLabel>
            </GlanceStatBlock>
          </GlanceStat>
          <GlanceStat>
            <GlanceStatBlock>
              <GlanceValue><NumberFlow value={classes.length} /></GlanceValue>
              <GlanceLabel>Classes</GlanceLabel>
            </GlanceStatBlock>
          </GlanceStat>
        </StatsCell>

        {/* 3. UPCOMING CLASSES (scrollable, only classes with upcoming sessions) */}
        <ClassesCell>
          <BusinessUpcomingClasses
            classes={classes}
            businessName={businessName}
            handleFavoriteChange={handleFavoriteChange}
          />
        </ClassesCell>

        {/* 4. REVIEWS (ReviewsTab - What people are saying) */}
        <ReviewsCell id="reviews-section">
          <ReviewsTab
            slug={slug}
            totalReviews={totalReviews || 0}
            ratingAsNumber={ratingAsNumber}
          />
        </ReviewsCell>

        {/* 5. SIDEBAR (Location, Contact, Hours) */}
        <SidebarWrapper>
          
          {/* MAP CARD */}
          <MapCell>
            {isMounted && (
               <MapContainer 
                 center={mapCoordinates} 
                 zoom={13} 
                 scrollWheelZoom={false}
                 zoomControl={false}
                 attributionControl={false}
               >
                 <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                 <Marker position={mapCoordinates} icon={createBrandIcon() || undefined} />
               </MapContainer>
            )}
            <MapLink
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessAddress || "")}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View in Google Maps"
            >
              View in Google Maps
            </MapLink>
          </MapCell>

          {/* CONTACT INFO CARD */}
          <BentoCard>
            <h3 style={{fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem'}}>Contact & Hours</h3>
            
            <ContactRow>
              <div className="icon-box"><Phone size={18} /></div>
              <div className="text">
                <span>Phone</span>
                <strong>{studentContactPhone || "Not listed"}</strong>
              </div>
            </ContactRow>
            
            <ContactRow>
              <div className="icon-box"><Mail size={18} /></div>
              <div className="text">
                <span>Email</span>
                <strong>{studentContactEmail || "Not listed"}</strong>
              </div>
            </ContactRow>

            <HoursDivider>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 600}}>
                <Clock size={16} color="#666" /> Opening Hours
              </div>
              <HoursList businessHours={businessHours} />
            </HoursDivider>

            {website ? (
              <ActionButton $primary href={website} target="_blank" rel="noreferrer">
                Visit Website <ExternalLink size={16} />
              </ActionButton>
            ) : null}

            <SocialGrid>
              {Object.entries(social_media_links || {}).map(([key, url]) => (
                url && socialIcons[key] ? (
                  <SocialBtn key={key} href={url} target="_blank" rel="noreferrer">{socialIcons[key]}</SocialBtn>
                ) : null
              ))}
            </SocialGrid>
          </BentoCard>

        </SidebarWrapper>

      </MainContainer>
      <FooterClient />
    </PageWrapper>
  );
};

export default BusinessPageClient;