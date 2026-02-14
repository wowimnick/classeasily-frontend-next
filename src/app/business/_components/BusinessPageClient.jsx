"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import styled, { createGlobalStyle, css } from "styled-components";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, Star, Phone, Mail, Clock, 
  Share2, ChevronRight, ExternalLink, Facebook, Twitter, Instagram, Linkedin, Youtube 
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import NumberFlow from "@number-flow/react";
import { motion, AnimatePresence } from "framer-motion";

// Imported component (Assumption: path is correct based on prompt)
import HomeClassCard from "@/components/homepage/HomeClassCard.jsx";
import ClientHeader from "@/components/layout/ClientHeader";
import FooterClient from "@/components/homepage/FooterClient";
import ClassReviews from "@/app/classes/_components/ClassReviews.jsx";

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
  
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: minmax(min-content, auto);
  gap: 1.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr); /* Tablet: 2 cols */
    padding: 1.5rem;
  }

  @media (max-width: 768px) {
    display: flex; /* Mobile: Stack everything */
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
  }
`;

// Base Card Style
const BentoCard = styled(motion.div)`
  background: white;
  border-radius: 24px;
  padding: 1.75rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.04);
  overflow: hidden;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;


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
  position: relative;

  @media (max-width: 1024px) {
    grid-column: span 2;
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

// 2. At a glance — completely different layout: hero stat left, secondary stats right
const StatsCell = styled(BentoCard)`
  grid-column: span 4;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto;
  gap: 0;
  align-content: center;
  min-height: 140px;

  @media (max-width: 1024px) { grid-column: span 1; }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    min-height: auto;
    padding: 1.25rem;
  }
`;

const GlanceHero = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border-right: 1px solid #eee;
  text-align: center;

  @media (max-width: 480px) {
    border-right: none;
    border-bottom: 1px solid #eee;
    padding-bottom: 1rem;
    margin-bottom: 0.5rem;
  }
`;

const GlanceBigValue = styled.span`
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
  color: #111;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;

  @media (max-width: 480px) { font-size: 2rem; }
`;

const GlanceHeroLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 0.35rem;
`;

const GlanceSecondary = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
`;

const GlanceRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;

  .num {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111;
    font-variant-numeric: tabular-nums;
  }
  .txt {
    font-size: 0.8rem;
    color: #666;
    font-weight: 500;
  }
`;

// 3. Classes Section (Full Width)
const ClassesCell = styled(BentoCard)`
  grid-column: span 12;
  background: transparent;
  box-shadow: none;
  border: none;
  padding: 0;
  overflow: visible; /* Allow shadows of cards to show */
  min-width: 0; /* Let grid child shrink so horizontal scroll can overflow */
`;

const ClassesSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 0.25rem;
  flex-wrap: wrap;
  gap: 0.5rem;

  .title-block h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 2px 0;
    color: #1a1a1a;
    line-height: 1.2;
  }

  .title-block span {
    font-size: 0.8rem;
    color: #666;
  }

  .scroll-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const ScrollBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #e5e5e5;
  background: white;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    border-color: #ff385c;
    color: #ff385c;
    background: #fff8f6;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const HorizontalScroll = styled.div`
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.5rem 0.5rem 2rem 0.5rem;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  min-height: 0;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #e0e0e0;
    border-radius: 10px;
  }

  > * {
    flex: 0 0 auto;
    width: 280px;
    scroll-snap-align: start;
  }
`;

// 4. Contact & Hours (Sticky Sidebar on Desktop)
const SidebarWrapper = styled.div`
  grid-column: span 4;
  grid-row: span 2; /* Span alongside reviews */
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 1024px) { grid-column: span 1; }
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
    
    strong { color: #111; }
    span { color: #666; word-break: break-all;}
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

const ShareBtn = styled.button`
  width: 36px; height: 36px;
  border-radius: 50%;
  background: #f5f5f5;
  border: none;
  display: flex; align-items: center; justify-content: center;
  color: #555;
  cursor: pointer;
  transition: 0.2s;
  &:hover { background: #ff385c; color: white; }
  svg { width: 18px; height: 18px; }
`;

// 5. Map Cell
const MapCell = styled(BentoCard)`
  height: 300px;
  padding: 0;
  position: relative;
  
  .overlay {
    position: absolute;
    bottom: 1rem; left: 1rem; right: 1rem;
    background: white;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 400;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    font-weight: 600;
  }
`;

// 6. Reviews Cell
const ReviewsCell = styled(BentoCard)`
  grid-column: span 8;
  
  @media (max-width: 1024px) { grid-column: span 2; }
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

const SCROLL_AMOUNT = 320;

const BusinessPageClient = ({ initialData, slug }) => {
  const router = useRouter();
  const [businessData, setBusinessData] = useState(initialData);
  const [isMounted, setIsMounted] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");
  const classesScrollRef = useRef(null);
  const reviewsSectionRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const title = businessData?.businessName || "Business";
    setShareFeedback("");
    const doCopy = () => {
      try {
        navigator.clipboard.writeText(url);
        setShareFeedback("Link copied!");
        setTimeout(() => setShareFeedback(""), 2000);
      } catch {
        setShareFeedback("Copy the URL from your browser");
      }
    };
    if (navigator.share) {
      navigator.share({ title, url }).then(() => setShareFeedback("Shared!")).catch((err) => {
        if (err.name !== "AbortError") doCopy();
      });
    } else {
      doCopy();
    }
  };

  const scrollClassesLeft = (e) => {
    e.preventDefault();
    const el = classesScrollRef.current;
    if (el) el.scrollBy({ left: -SCROLL_AMOUNT, behavior: "smooth" });
  };

  const scrollClassesRight = (e) => {
    e.preventDefault();
    const el = classesScrollRef.current;
    if (el) el.scrollBy({ left: SCROLL_AMOUNT, behavior: "smooth" });
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
    social_media_links = {},
    reviews = [] // Assuming some reviews might be passed in initialData or fetched
  } = businessData;

  const ratingAsNumber = average_rating ? parseFloat(average_rating) : 0;

  // Only show classes that have an upcoming session (day/time on card)
  const upcomingClasses = useMemo(
    () => (classes || []).filter((c) => c.soonest_next_week),
    [classes],
  );

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
        <HeroCell initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5}}>
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

        {/* 2. AT A GLANCE — new layout: hero stat left, secondary right */}
        <StatsCell initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5, delay: 0.1}}>
          <GlanceHero>
            <GlanceBigValue>
              <Star size={28} fill="#ff385c" color="#ff385c" />
              <NumberFlow value={ratingAsNumber} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
            </GlanceBigValue>
            <GlanceHeroLabel>Rating</GlanceHeroLabel>
          </GlanceHero>
          <GlanceSecondary>
            <GlanceRow>
              <span className="num"><NumberFlow value={totalReviews} /></span>
              <span className="txt">Reviews</span>
            </GlanceRow>
            <GlanceRow>
              <span className="num"><NumberFlow value={classes.length} /></span>
              <span className="txt">Classes</span>
            </GlanceRow>
          </GlanceSecondary>
        </StatsCell>

        {/* 3. CLASSES SECTION (Horizontal Scroll) */}
        <ClassesCell initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} transition={{duration: 0.5, delay: 0.2}}>
          <ClassesSectionHeader>
            <div className="title-block">
              <h2>Upcoming Classes</h2>
              <span>Book your next session</span>
            </div>
            <div className="scroll-actions">
              <ScrollBtn
                type="button"
                aria-label="Scroll left"
                onClick={scrollClassesLeft}
                disabled={upcomingClasses.length === 0}
              >
                <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
              </ScrollBtn>
              <ScrollBtn
                type="button"
                aria-label="Scroll right"
                onClick={scrollClassesRight}
                disabled={upcomingClasses.length === 0}
              >
                <ChevronRight size={18} />
              </ScrollBtn>
            </div>
          </ClassesSectionHeader>

          <HorizontalScroll
            ref={classesScrollRef}
            role="region"
            aria-label="Upcoming classes carousel"
          >
            {upcomingClasses.length > 0 ? (
              upcomingClasses.map((cls, idx) => (
                <HomeClassCard
                  key={cls.classId}
                  {...cls}
                  rating={parseFloat(cls.average_rating) || 0}
                  totalReviews={cls.review_count}
                  business_name={businessName}
                  soonest_next_week={cls.soonest_next_week}
                  onFavoriteChange={(isFav) => handleFavoriteChange(cls.classId, isFav)}
                  priority={idx < 4}
                />
              ))
            ) : (
              <div
                style={{
                  padding: "2rem",
                  color: "#888",
                  fontStyle: "italic",
                  flex: "0 0 auto",
                  minWidth: "100%",
                }}
              >
                No upcoming classes listed at the moment.
              </div>
            )}
          </HorizontalScroll>
        </ClassesCell>

        {/* 4. REVIEWS (Left Column) — ClassReviews component */}
        <ReviewsCell ref={reviewsSectionRef} id="reviews-section" initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5, delay: 0.3}}>
          <ClassReviews
            slug={slug}
            initialRating={ratingAsNumber}
            initialReviewCount={totalReviews || 0}
            platformReviewCount={totalReviews || 0}
            reviewsContext="business"
          />
        </ReviewsCell>

        {/* 5. SIDEBAR (Location, Contact, Hours) */}
        <SidebarWrapper>
          
          {/* MAP CARD */}
          <MapCell initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} transition={{duration: 0.5, delay: 0.4}}>
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
            <div className="overlay">
               <span>{businessCity}</span>
               <a 
                 href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessAddress)}`}
                 target="_blank" rel="noreferrer"
                 style={{color: '#ff385c', textDecoration: 'none'}}
               >
                 <ExternalLink size={16} />
               </a>
            </div>
          </MapCell>

          {/* CONTACT INFO CARD */}
          <BentoCard initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5, delay: 0.5}}>
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

            <div style={{margin: '1.5rem 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '1rem 0'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 600}}>
                <Clock size={16} color="#666" /> Opening Hours
              </div>
              <HoursList businessHours={businessHours} />
            </div>

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
              <ShareBtn type="button" onClick={handleShare} aria-label="Share page"><Share2 size={16} /></ShareBtn>
              {shareFeedback ? <span style={{ fontSize: "0.75rem", color: "#ff385c", alignSelf: "center" }}>{shareFeedback}</span> : null}
            </SocialGrid>
          </BentoCard>

        </SidebarWrapper>

      </MainContainer>
      <FooterClient />
    </PageWrapper>
  );
};

export default BusinessPageClient;