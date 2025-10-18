"use client";

import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import { Empty, Pagination, message, Typography, ConfigProvider } from "antd";
import { Heart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// MIGRATION: Updated import paths to use Next.js aliases
import HomeClassCard from "@/components/homepage/HomeClassCard";
import { userService } from "@/services/apiService";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { theme } from "@/components/theme";

// --- Modal Shell Components ---

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1050;

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-end;
  }
`;

const ModalContainer = styled(motion.div)`
  width: 100%;
  max-width: 1080px;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  @media (max-width: 1080px) {
    max-width: 100vw;
  }

  @media (max-width: 768px) {
    height: auto;
    max-height: 85vh;
    border-radius: 24px 24px 0 0;
  }
`;

const DragHandle = styled(motion.div)`
  display: none;
  width: 40px;
  height: 5px;
  background: #d1d1d1;
  border-radius: 2.5px;
  margin: 12px auto 0;
  cursor: grab;

  @media (max-width: 768px) {
    display: block;
  }
`;

const CloseButton = styled(motion.button)`
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f0f0f0;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  color: #717171;

  &:hover {
    background: #e0e0e0;
  }
`;

const ModalHeader = styled.header`
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  h2.ant-typography {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
  }
  @media (max-width: 768px) {
    padding: 16px 24px;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px 20px;
  }
`;

// --- Content-Specific Styled Components ---

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

const EmptyStateContainer = styled(motion.div)`
  text-align: center;
  padding: 48px 24px;
  max-width: 500px;
  margin: 5rem auto;
  .ant-empty-image {
    height: 80px;
    margin-bottom: 20px;
    svg {
      color: ${theme.token.colorPrimary};
      opacity: 0.7;
    }
  }
  .ant-empty-description {
    color: #6b7280;
    font-size: 16px;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding-bottom: 1rem;
`;

const FavoritesModal = ({ isOpen, onClose }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 9;

  // MIGRATION: State to ensure component is mounted on client before using portals or window object
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize(); // Set initial value
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const fetchFavorites = useCallback(async (page) => {
    setLoading(true);
    setError(null);
    const result = await userService.getMyFavoriteClasses(page, pageSize);
    if (result.success) {
      setFavorites(result.data || []);
      setTotalItems(result.count || 0);
      setCurrentPage(page);
    } else {
      setError(result.error || "Failed to load favorites.");
      setFavorites([]);
      setTotalItems(0);
      message.error(result.error || "Could not load favorites.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchFavorites(1);
    }
  }, [isOpen, fetchFavorites]);

  const handlePageChange = (page) => {
    fetchFavorites(page);
  };

  const handleFavoriteChange = (classId, isNowFavorited) => {
    if (!isNowFavorited) {
      setFavorites((prev) => prev.filter((fav) => fav.classId !== classId));
      setTotalItems((prev) => prev - 1);
      message.success("Removed from favorites.");
    }
  };

  const handleDragEnd = (event, info) => {
    if (info.offset.y > 100 && info.velocity.y > 20) {
      onClose();
    }
  };

  const modalVariants = isMobile
    ? {
        hidden: { y: "100%", opacity: 0 },
        visible: {
          y: 0,
          opacity: 1,
          transition: { type: "spring", damping: 30, stiffness: 300 },
        },
        exit: {
          y: "100%",
          opacity: 0,
          transition: { duration: 0.2, ease: "easeIn" },
        },
      }
    : {
        hidden: { scale: 0.95, opacity: 0 },
        visible: {
          scale: 1,
          opacity: 1,
          transition: { duration: 0.2, ease: "easeOut" },
        },
        exit: {
          scale: 0.95,
          opacity: 0,
          transition: { duration: 0.2, ease: "easeIn" },
        },
      };

  const renderContent = () => {
    if (loading) {
      return (
        <LoaderContainer>
          <GlobalLoaderWithoutInlineStyles />
        </LoaderContainer>
      );
    }
    if (error) {
      return (
        <EmptyStateContainer>
          <Empty description={<span>{error}</span>} />
        </EmptyStateContainer>
      );
    }
    if (favorites.length === 0) {
      return (
        <EmptyStateContainer initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Empty
            image={<Heart size={32} />}
            description="You haven't favorited any classes yet. Start exploring!"
          />
        </EmptyStateContainer>
      );
    }
    return (
      <>
        <GridContainer>
          {favorites.map((classItem) => (
            <HomeClassCard
              key={classItem.classId}
              {...classItem}
              is_favorited={true}
              onFavoriteChange={(isFavorited) =>
                handleFavoriteChange(classItem.classId, isFavorited)
              }
            />
          ))}
        </GridContainer>
        {totalItems > pageSize && (
          <PaginationContainer>
            <Pagination
              current={currentPage}
              total={totalItems}
              pageSize={pageSize}
              onChange={handlePageChange}
              showSizeChanger={false}
              size="small"
            />
          </PaginationContainer>
        )}
      </>
    );
  };

  const modalComponent = (
    <ConfigProvider theme={theme}>
      <AnimatePresence>
        {isOpen && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <ModalContainer
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              drag={isMobile ? "y" : false}
              dragConstraints={{ top: 0, bottom: 500 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={handleDragEnd}
              dragSnapToOrigin
            >
              <CloseButton
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close favorites"
              >
                <X size={20} />
              </CloseButton>
              <DragHandle />
              <ModalHeader>
                <Typography.Title level={2}>My Favorites</Typography.Title>
              </ModalHeader>
              <ModalContent>{renderContent()}</ModalContent>
            </ModalContainer>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </ConfigProvider>
  );

  // MIGRATION: Only render the portal if the component is mounted on the client.
  if (!isMounted) {
    return null;
  }

  return ReactDOM.createPortal(modalComponent, document.body);
};

export default FavoritesModal;
