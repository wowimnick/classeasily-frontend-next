"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Modal, Typography, Tooltip } from 'antd';
import message from '@/lib/message';
import styled, { css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Share2,
  Copy,
  X,
  Star,
  Mail,
  MessageSquare,
  Code,
  MoreHorizontal,
  Facebook,
  Twitter,
  Phone,
  Grid3x3,
} from "lucide-react";

const { Title } = Typography;

// --- Constants & Placeholders ---
const CLASSEASILY_RED_ACCESSIBLE = "#E63151";
const PLACEHOLDER_IMAGES = [
  "https://i.imgur.com/vL2za35.png",
  "https://i.imgur.com/Kned4kE.png",
  "https://i.imgur.com/X3SVGsv.png",
  "https://i.imgur.com/tdUN3iQ.png",
  "https://i.imgur.com/vL2za35.png",
];

// --- Styled Components --- (No changes needed)
const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
`;
const OrderWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;
const TitleSection = styled.div`
  padding: 1rem;
  margin: 1rem 0;
  @media (max-width: 768px) {
    display: none;
  }
`;

const ImageSkeleton = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  @media (max-width: 768px) {
    align-items: center;
  }
`;
const StyledTitle = styled(Title)`
  &.ant-typography {
    font-size: clamp(1.25rem, 4vw, 2rem);
    font-weight: 700;
    color: #000;
    margin-bottom: 0 !important;
  }
`;
const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
`;
const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 0.625rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: #222;
  transition: all 0.2s ease;
  text-decoration: underline;
  text-underline-offset: 2px;
  span {
    @media (max-width: 768px) {
      display: none;
    }
  }
  &:hover:not(:disabled) {
    background: #f7f7f7;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;
const ImagesContainer = styled.div`
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 1.5rem;
  @media (max-width: 768px) {
    order: 1;
    margin-bottom: 0;
  }
`;
const DesktopImagesWrapper = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  height: 500px;
  max-height: 80vh;
  @media (max-width: 768px) {
    display: none;
  }
`;
const ClassImagesGrid = styled.div`
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  & > div:nth-of-type(2) {
    border-radius: 0 12px 0 0;
  }
  & > div:nth-of-type(4) {
    border-radius: 0 0 12px 0;
  }
`;
const ImageWrapperBase = styled.div`
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background-color: #f0f0f0;
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  &:hover img:not(.placeholder) {
    transform: scale(1.05);
  }
  &.non-clickable {
    cursor: default;
  }
`;
const LargeImage = styled(ImageWrapperBase)`
  flex-basis: 60%;
  border-radius: 12px 0 0 12px;
`;
const SmallImage = styled(ImageWrapperBase)``;
const ViewAllPhotosButton = styled.button`
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
  &:hover {
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  @media (max-width: 1024px) {
    bottom: 2rem;
  }
`;
const MobileCarouselWrapper = styled.div`
  display: none;
  position: relative;
  @media (max-width: 768px) {
    display: block;
  }
`;
const EmblaViewport = styled.div`
  overflow: hidden;
  border-radius: 12px;
  @media (max-width: 768px) {
    border-radius: 0;
  }
`;
const EmblaContainer = styled.div`
  display: flex;
`;
const EmblaSlide = styled.div`
  flex: 0 0 100%;
  min-width: 0;
`;
const CarouselImageContent = styled.div`
  aspect-ratio: 4 / 3;
  position: relative;
  overflow: hidden;
  background-color: #f0f0f0;
  cursor: pointer;
  @media (max-width: 768px) {
    aspect-ratio: 1 / 1;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  &.non-clickable {
    cursor: default;
  }
`;
const CarouselOverlay = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
`;
const ImageCounter = styled.div`
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.825rem;
  backdrop-filter: blur(4px);
`;
const CustomGalleryModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 3000; 
  display: flex;
  align-items: center;
  justify-content: center;
`;
const CustomGalleryModalWrapper = styled(motion.div)`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;
const GalleryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  color: white;
  flex-shrink: 0;
`;
const GalleryIconButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;
const GalleryThumbnailNavigation = styled.div`
  padding: 0rem 1.5rem 1rem;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
`;
const ThumbnailEmblaViewport = styled.div`
  overflow: visible;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
`;
const ThumbnailEmblaContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;
const ThumbnailEmblaSlide = styled.div`
  flex: 0 0 auto;
  min-width: 0;
`;
const ThumbnailImage = styled.div`
  width: 80px;
  height: 53px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  ${({ $isActive }) =>
    $isActive &&
    css`
      border-color: white;
      transform: scale(1.1);
    `} &:hover {
    border-color: rgba(255, 255, 255, 0.5);
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  @media (max-width: 768px) {
    width: 60px;
    height: 40px;
  }
`;
const ThumbnailWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 600px;
`;
const GalleryCarouselWrapper = styled.div`
  flex-grow: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;
const GalleryEmblaViewport = styled.div`
  overflow: hidden;
  width: 100%;
  height: 100%;
`;
const GalleryEmblaContainer = styled.div`
  display: flex;
  height: 100%;
`;
const GalleryEmblaSlide = styled.div`
  flex: 0 0 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4rem;
  height: 100%;
  overflow: hidden;
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;
const GalleryImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
  transition: transform 0.3s ease;
  cursor: grab;
  ${({ $isZoomed }) =>
    $isZoomed &&
    css`
      touch-action: none;
      cursor: move;
    `}
`;
const GalleryFooter = styled.div`
  padding: 1rem;
  color: white;
  text-align: center;
  font-weight: 500;
  flex-shrink: 0;
`;
const ImageErrorFallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #eee;
  color: #aaa;
  position: absolute;
  top: 0;
`;
const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 24px;
    overflow: hidden;
    padding: 0;
  }
  .ant-modal-header {
    display: none;
  }
  .ant-modal-body {
    padding: 0;
  }
  .ant-modal-close {
    display: none;
  }
`;
const ShareModalWrapper = styled.div`
  padding: 2rem 1.5rem;
`;
const ShareModalHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 1.25rem;
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    text-align: center;
    flex-grow: 1;
    margin: 0;
  }
`;
const CloseButton = styled.button`
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #f7f7f7;
  }
`;
const PlaceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  img {
    width: 72px;
    height: 72px;
    border-radius: 12px;
    object-fit: cover;
  }
  p {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }
`;
const ShareGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;
const ShareOptionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid #dddddd;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #222;
  text-decoration: none;
  font-weight: 600;
  background: transparent;
  width: 100%;
  text-align: left;
  font-family: inherit;
  font-size: 0.9rem;
  &:hover {
    background: #f7f7f7;
    border-color: #b0b0b0;
  }
`;
const EmbedModalContent = styled.div`
  padding: 1rem;
  textarea {
    width: 100%;
    min-height: 120px;
    font-family: monospace;
  }
`;
const PlaceMeta = styled.div`
  font-size: 0.875rem;
  color: #717171;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  margin-top: 4px;
`;
const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ClassPageImagesTitle = React.memo(
  ({
    images,
    title,
    rating,
    business_name,
    categoryName,
    location,
    isShareModalVisible,
    onShareModalClose,
    isFavorite,
    isTogglingFavorite,
    onFavoriteClick,
    onShareClick,
  }) => {
    const [isGalleryModalVisible, setIsGalleryModalVisible] = useState(false);
    const [isEmbedModalVisible, setIsEmbedModalVisible] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
    const [galleryCurrentSlide, setGalleryCurrentSlide] = useState(0);
    const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0 });
    const [currentUrl, setCurrentUrl] = useState("");

    useEffect(() => {
      // Ensure window object is available before accessing location
      setCurrentUrl(window.location.href);
    }, []);

    const classImages =
      Array.isArray(images) && images.length > 0 ? images : [];
    const usePlaceholders = classImages.length === 0;
    const imagesToDisplay = usePlaceholders ? PLACEHOLDER_IMAGES : classImages;
    const embedCode = `<iframe src="${currentUrl}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`;

    const [emblaRef, emblaApi] = useEmblaCarousel({
      loop: imagesToDisplay.length > 1,
    });
    const [galleryEmblaRef, galleryEmblaApi] = useEmblaCarousel({
      loop: imagesToDisplay.length > 1,
    });
    const [thumbnailEmblaRef, thumbnailEmblaApi] = useEmblaCarousel({
      containScroll: "keepSnaps",
      dragFree: true,
    });

    const resetZoom = useCallback(() => setZoom({ scale: 1, x: 0, y: 0 }), []);
    const onThumbClick = useCallback(
      (index) => {
        if (galleryEmblaApi) {
          resetZoom();
          galleryEmblaApi.scrollTo(index);
        }
      },
      [galleryEmblaApi, resetZoom]
    );

    useEffect(() => {
      if (!emblaApi) return;
      const onSelect = () => setCurrentSlide(emblaApi.selectedScrollSnap());
      emblaApi.on("select", onSelect);
      return () => emblaApi.off("select", onSelect);
    }, [emblaApi]);

    useEffect(() => {
      if (isGalleryModalVisible && galleryEmblaApi) {
        galleryEmblaApi.scrollTo(galleryInitialIndex, true);
        thumbnailEmblaApi?.scrollTo(galleryInitialIndex, true);
      }
    }, [
      isGalleryModalVisible,
      galleryEmblaApi,
      thumbnailEmblaApi,
      galleryInitialIndex,
    ]);

    useEffect(() => {
      if (!galleryEmblaApi) return;
      const onSelect = () => {
        const selected = galleryEmblaApi.selectedScrollSnap();
        setGalleryCurrentSlide(selected);
        thumbnailEmblaApi?.scrollTo(selected);
        resetZoom();
      };
      galleryEmblaApi.on("select", onSelect);
      return () => galleryEmblaApi.off("select", onSelect);
    }, [galleryEmblaApi, thumbnailEmblaApi, resetZoom]);

    const handleGalleryModalClose = () => setIsGalleryModalVisible(false);

    const handleCopyToClipboard = (text, successMessage) => {
      navigator.clipboard
        .writeText(text)
        .then(() => message.success(successMessage));
    };

    const renderGridImageItem = (image, index, isLarge) => {
      const imageUrl = usePlaceholders
        ? image
        : isLarge
          ? image?.large_url || image?.medium_url
          : image?.medium_url || image?.thumbnail_url;
      const ImageComponent = isLarge ? LargeImage : SmallImage;
      return (
        <ImageComponent
          key={index}
          className={usePlaceholders ? "non-clickable" : ""}
          onClick={() => !usePlaceholders && showGalleryModal(index)}
        >
          <img
            src={imageUrl}
            alt={`Class image ${index + 1}`}
            loading={isLarge ? "eager" : "lazy"}
            fetchpriority={isLarge ? "high" : "auto"}
          />
          {isLarge && classImages.length > 5 && (
            <ViewAllPhotosButton
              onClick={(e) => {
                e.stopPropagation();
                showGalleryModal(0);
              }}
            >
              <Grid3x3 size={16} /> Show all photos
            </ViewAllPhotosButton>
          )}
        </ImageComponent>
      );
    };

    const showGalleryModal = (startIndex = 0) => {
      if (classImages.length > 0) {
        setGalleryInitialIndex(startIndex);
        setIsGalleryModalVisible(true);
      }
    };

    const overlayVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 },
    };
    const modalVariants = {
      hidden: { scale: 0.95, opacity: 0 },
      visible: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
    };

    return (
      <MainContent>
        <OrderWrapper>
          {title && (
            <TitleSection>
              <TitleRow>
                <StyledTitle level={1}>{title}</StyledTitle>
                <ActionsWrapper>
                  <Tooltip
                    title={
                      isFavorite ? "Remove from favorites" : "Save to favorites"
                    }
                  >
                    <ActionButton
                      onClick={onFavoriteClick}
                      disabled={isTogglingFavorite}
                      aria-label={
                        isFavorite
                          ? "Remove from favorites"
                          : "Save to favorites"
                      }
                    >
                      <Heart
                        size={18}
                        fill={isFavorite ? CLASSEASILY_RED_ACCESSIBLE : "none"}
                        color={isFavorite ? CLASSEASILY_RED_ACCESSIBLE : "#333"}
                      />
                      <span>{isFavorite ? "Saved" : "Save"}</span>
                    </ActionButton>
                  </Tooltip>
                  <Tooltip title="Share this class">
                    <ActionButton
                      onClick={onShareClick}
                      aria-label="Share this class"
                    >
                      <Share2 size={18} />
                      <span>Share</span>
                    </ActionButton>
                  </Tooltip>
                </ActionsWrapper>
              </TitleRow>
            </TitleSection>
          )}
          <ImagesContainer>
            <DesktopImagesWrapper>
              {imagesToDisplay.length > 0 &&
                renderGridImageItem(imagesToDisplay[0], 0, true)}
              {imagesToDisplay.length > 1 && (
                <ClassImagesGrid>
                  {imagesToDisplay
                    .slice(1, 5)
                    .map((img, index) =>
                      renderGridImageItem(img, index + 1, false)
                    )}
                </ClassImagesGrid>
              )}
            </DesktopImagesWrapper>
            <MobileCarouselWrapper>
              <EmblaViewport ref={emblaRef}>
                <EmblaContainer>
                  {imagesToDisplay.map((img, index) => (
                    <EmblaSlide
                      key={index}
                      onClick={() =>
                        !usePlaceholders && showGalleryModal(index)
                      }
                    >
                      <CarouselImageContent
                        className={usePlaceholders ? "non-clickable" : ""}
                      >
                        <img
                          src={img.large_url || img.medium_url || img}
                          alt={`Class image ${index + 1}`}
                          loading={index === 0 ? "eager" : "lazy"}
                          fetchpriority={index === 0 ? "high" : "auto"}
                        />
                      </CarouselImageContent>
                    </EmblaSlide>
                  ))}
                </EmblaContainer>
              </EmblaViewport>
              <CarouselOverlay>
                <ImageCounter>
                  {currentSlide + 1} / {imagesToDisplay.length}
                </ImageCounter>
              </CarouselOverlay>
            </MobileCarouselWrapper>
          </ImagesContainer>
        </OrderWrapper>

        <AnimatePresence>
          {isGalleryModalVisible && (
            <CustomGalleryModalOverlay
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={handleGalleryModalClose}
            >
              <CustomGalleryModalWrapper variants={modalVariants}>
                <GalleryHeader onClick={(e) => e.stopPropagation()}>
                  <div />
                  <GalleryIconButton
                    onClick={handleGalleryModalClose}
                    aria-label="Close gallery"
                  >
                    <X size={20} />
                  </GalleryIconButton>
                </GalleryHeader>
                <GalleryThumbnailNavigation
                  onClick={(e) => e.stopPropagation()}
                >
                  <ThumbnailWrapper>
                    <ThumbnailEmblaViewport ref={thumbnailEmblaRef}>
                      <ThumbnailEmblaContainer>
                        {classImages.map((img, index) => (
                          <ThumbnailEmblaSlide key={index}>
                            <ThumbnailImage
                              $isActive={index === galleryCurrentSlide}
                              onClick={() => onThumbClick(index)}
                            >
                              <img
                                src={
                                  img?.thumbnail_url || img?.medium_url || img
                                }
                                alt={`Thumbnail ${index + 1}`}
                              />
                            </ThumbnailImage>
                          </ThumbnailEmblaSlide>
                        ))}
                      </ThumbnailEmblaContainer>
                    </ThumbnailEmblaViewport>
                  </ThumbnailWrapper>
                </GalleryThumbnailNavigation>
                <GalleryCarouselWrapper>
                  <GalleryEmblaViewport ref={galleryEmblaRef}>
                    <GalleryEmblaContainer>
                      {classImages.map((img, index) => (
                        <GalleryEmblaSlide key={index}>
                          <GalleryImage
                            src={img?.large_url || img?.medium_url || img}
                            alt={`Class image ${index + 1}`}
                            $isZoomed={zoom.scale > 1}
                            style={{
                              transform: `scale(${zoom.scale}) translate(${zoom.x}px, ${zoom.y}px)`,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (zoom.scale > 1) {
                                resetZoom();
                              }
                            }}
                          />
                        </GalleryEmblaSlide>
                      ))}
                    </GalleryEmblaContainer>
                  </GalleryEmblaViewport>
                </GalleryCarouselWrapper>
                <GalleryFooter onClick={(e) => e.stopPropagation()}>
                  {galleryCurrentSlide + 1} / {classImages.length}
                </GalleryFooter>
              </CustomGalleryModalWrapper>
            </CustomGalleryModalOverlay>
          )}
        </AnimatePresence>
        <StyledModal
          open={isShareModalVisible}
          onCancel={onShareModalClose}
          footer={null}
          width={580}
          centered
        >
          <ShareModalWrapper>
            <ShareModalHeader>
              <CloseButton
                onClick={onShareModalClose}
                aria-label="Close share options"
              >
                <X size={18} />
              </CloseButton>
              <h3>Share this place</h3>
            </ShareModalHeader>
            <PlaceInfo>
              <img
                src={imagesToDisplay[0]?.thumbnail_url || imagesToDisplay[0]}
                alt={title}
              />
              <div>
                <p>{title}</p>
                <PlaceMeta>
                  {rating && rating > 0 ? (
                    <MetaItem>
                      <Star size={14} fill="#FFB400" color="#FFB400" />
                      {rating.toFixed(1)}
                    </MetaItem>
                  ) : (
                    <MetaItem>
                      <Star size={14} fill="#FFB400" color="#FFB400" />
                      New Class
                    </MetaItem>
                  )}
                  {business_name && <MetaItem>· {business_name}</MetaItem>}
                  {categoryName && <MetaItem>· {categoryName}</MetaItem>}
                  {location && <MetaItem>· {location}</MetaItem>}
                </PlaceMeta>
              </div>
            </PlaceInfo>
            <ShareGrid>
              <ShareOptionButton
                onClick={() =>
                  handleCopyToClipboard(currentUrl, "Link Copied!")
                }
              >
                <Copy size={18} /> Copy Link
              </ShareOptionButton>
              <ShareOptionButton
                as="a"
                href={`mailto:?subject=${encodeURIComponent(
                  title
                )}&body=${encodeURIComponent(currentUrl)}`}
              >
                <Mail size={18} /> Email
              </ShareOptionButton>
              <ShareOptionButton
                as="a"
                href={`sms:?&body=${encodeURIComponent(
                  `${title}\n${currentUrl}`
                )}`}
              >
                <MessageSquare size={18} /> Messages
              </ShareOptionButton>
              <ShareOptionButton
                as="a"
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `${title}\n${currentUrl}`
                )}`}
                target="_blank"
              >
                <Phone size={18} /> WhatsApp
              </ShareOptionButton>
              <ShareOptionButton
                as="a"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  currentUrl
                )}`}
                target="_blank"
              >
                <Facebook size={18} /> Facebook
              </ShareOptionButton>
              <ShareOptionButton
                as="a"
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  currentUrl
                )}&text=${encodeURIComponent(title)}`}
                target="_blank"
              >
                <Twitter size={18} /> Twitter
              </ShareOptionButton>
              <ShareOptionButton
                onClick={() => {
                  onShareModalClose();
                  setIsEmbedModalVisible(true);
                }}
              >
                <Code size={18} /> Embed
              </ShareOptionButton>
              {typeof navigator !== "undefined" && navigator.share && (
                <ShareOptionButton
                  onClick={() =>
                    navigator.share({ title, text: title, url: currentUrl })
                  }
                >
                  <MoreHorizontal size={18} /> More
                </ShareOptionButton>
              )}
            </ShareGrid>
          </ShareModalWrapper>
        </StyledModal>
        <Modal
          open={isEmbedModalVisible}
          onCancel={() => setIsEmbedModalVisible(false)}
          title="Embed this class"
          footer={null}
          centered
        >
          <EmbedModalContent>
            <textarea readOnly value={embedCode} rows={5} />
            <ActionButton
              onClick={() =>
                handleCopyToClipboard(embedCode, "Embed code copied!")
              }
            >
              <Copy size={16} /> Copy Code
            </ActionButton>
          </EmbedModalContent>
        </Modal>
      </MainContent>
    );
  }
);

ClassPageImagesTitle.displayName = "ClassPageImagesTitle";
export default ClassPageImagesTitle;
