"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Badge, Popover, List, Typography, Button, Empty } from "antd";
import {
  BellOutlined,
  BellFilled,
  ClockCircleOutlined,
  CheckOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { Check, Settings, X } from "lucide-react";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { notificationService } from "@/services/apiService";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { useNotificationsWebSocket } from "@/hooks/useNotificationsWebSocket";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";

const { Text, Title } = Typography;

// Animations
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 56, 92, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(255, 56, 92, 0);
  }
`;

// Desktop styled components
const IconContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05)
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.15),
      rgba(255, 255, 255, 0.08)
    );
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }

  ${(props) =>
    props.$hasunread &&
    css`
      animation: ${pulseGlow} 2s infinite;
    `}
`;

const PopoverContainer = styled.div`
  width: 380px;
  max-height: 500px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: ${slideIn} 0.3s ease-out;

  @media (max-width: 768px) {
    display: none;
  }
`;

const PopoverHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e2e8f0;
`;

const HeaderTitle = styled(Title)`
  margin: 0 !important;
  color: #1e293b;
  font-weight: 600;
  font-size: 18px;
`;

const MarkAllButton = styled(Button)`
  border: none;
  background: transparent;
  color: #ff385c;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 56, 92, 0.1);
    color: #e02954;
  }

  &:focus {
    background: rgba(255, 56, 92, 0.1);
    color: #e02954;
  }
`;

const StyledList = styled(List)`
  max-height: 320px;
  overflow-y: auto;

  .ant-list-item {
    padding: 0;
    border-bottom: none;
    margin: 0;
  }

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
    &:hover {
      background: #94a3b8;
    }
  }
`;

const NotificationItem = styled.div`
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 16px 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) =>
    props.$isunread
      ? "linear-gradient(135deg, #fef2f2, #fef7f7)"
      : "transparent"};
  border-left: ${(props) =>
    props.$isunread ? "3px solid #ff385c" : "3px solid transparent"};

  &:hover {
    background: ${(props) =>
      props.$isunread
        ? "linear-gradient(135deg, #fee2e2, #fef2f2)"
        : "#f8fafc"};
  }

  &:not(:last-child) {
    border-bottom: 1px solid #f1f5f9;
  }
`;

const NotificationIconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: ${(props) =>
    props.color || "linear-gradient(135deg, #e2e8f0, #cbd5e1)"};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  color: white;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
    border-radius: 12px;
  }
`;

const NotificationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationMessage = styled(Text)`
  font-size: 14px;
  color: #334155;
  line-height: 1.5;
  display: block;
  font-weight: ${(props) => (props.$isunread ? "500" : "400")};
  margin-bottom: 6px;
`;

const NotificationTime = styled(Text)`
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionButton = styled(Button)`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: white;
    color: #ff385c;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  ${NotificationItem}:hover & {
    opacity: 1;
    transform: translateX(0);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  background: #f8fafc;
`;

const EmptyContainer = styled.div`
  padding: 40px 24px;
  text-align: center;
  background: #f8fafc;
`;

// Mobile Notifications Components (keeping all your existing mobile styles)
const MobileNotificationOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 999999;
  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileNotificationContainer = styled(motion.div)`
  position: fixed;
  right: 16px;
  top: 80px;
  width: min(380px, calc(100vw - 32px));
  max-height: calc(100vh - 120px);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 999999;
  @media (min-width: 769px) {
    display: none;
  }
`;

// ... (Keep all your other mobile styled components - MobileNotificationHeader, etc.)

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const notificationVariants = {
  hidden: {
    scale: 0.1,
    opacity: 0,
    y: -50,
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
      duration: 0.5,
    },
  },
  exit: {
    scale: 0.1,
    opacity: 0,
    y: -50,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const NotificationsButton = () => {
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [mobileNotificationsVisible, setMobileNotificationsVisible] =
    useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [countLoading, setCountLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState("top right");

  const router = useRouter();
  const { user: currentUser } = useAuth();
  const popoverRef = useRef(null);
  const notificationButtonRef = useRef(null);

  useNotificationsWebSocket({
    enabled: !!currentUser,
    onNewNotification: (n) => {
      setNotifications((prev) => {
        const exists = prev.some((x) => x.id === n.id);
        if (exists) return prev;
        return [n, ...prev];
      });
    },
    onUnreadDelta: (delta) => {
      setUnreadCount((c) => Math.max(0, c + delta));
    },
  });

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (currentUser) {
      setCountLoading(true);
    } else {
      setUnreadCount(0);
      setNotifications([]);
      setPopoverVisible(false);
      setMobileNotificationsVisible(false);
      setInitialLoadDone(false);
      setCountLoading(false);
    }
  }, [currentUser]);

  // Calculate transform origin based on button position
  useEffect(() => {
    if (
      mobileNotificationsVisible &&
      notificationButtonRef.current &&
      isMobile
    ) {
      const buttonRect = notificationButtonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      const buttonCenterX = buttonRect.left + buttonRect.width / 2;
      const buttonCenterY = buttonRect.top + buttonRect.height / 2;

      const modalWidth = Math.min(380, viewportWidth - 32);
      const modalLeft = viewportWidth - 16 - modalWidth;
      const modalTop = 80;

      const originX = ((buttonCenterX - modalLeft) / modalWidth) * 100;
      const originY = ((buttonCenterY - modalTop) / 400) * 100;

      const clampedX = Math.max(0, Math.min(100, originX));
      const clampedY = Math.max(0, Math.min(100, originY));

      setTransformOrigin(`${clampedX}% ${clampedY}%`);
    }
  }, [mobileNotificationsVisible, isMobile]);

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUser) {
      setUnreadCount(0);
      setCountLoading(false);
      return;
    }
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unread_count);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      setUnreadCount(0);
    } finally {
      setCountLoading(false);
    }
  }, [currentUser]);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await notificationService.getNotifications({
        page_size: 10,
      });
      if (response.success) {
        setNotifications(response.data || []);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      setNotifications([]);
    } finally {
      setLoading(false);
      if (!initialLoadDone) setInitialLoadDone(true);
    }
  }, [currentUser, initialLoadDone]);

  useEffect(() => {
    if (currentUser) {
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
      setCountLoading(false);
    }
  }, [currentUser, fetchUnreadCount]);

  useEffect(() => {
    if ((popoverVisible || mobileNotificationsVisible) && currentUser) {
      fetchNotifications();
    }
  }, [
    popoverVisible,
    mobileNotificationsVisible,
    currentUser,
    fetchNotifications,
  ]);

  const handleNotificationClick = async (item) => {
    if (!currentUser) return;
    if (item.link_web) router.push(item.link_web);
    setPopoverVisible(false);
    setMobileNotificationsVisible(false);
  };

  const markAsRead = async (id) => {
    if (!currentUser) return;
    try {
      const response = await notificationService.markNotificationAsRead(id);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === id ? { ...notif, is_read: true } : notif
          )
        );
        fetchUnreadCount();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser || unreadCount === 0) return;
    try {
      const response = await notificationService.markAllNotificationsAsRead();
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, is_read: true }))
        );
        fetchUnreadCount();
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleMobileNotificationsClose = async () => {
    if (currentUser && unreadCount > 0) {
      await markAllAsRead();
    }
    setMobileNotificationsVisible(false);
  };

  const toggleMobileNotifications = () => {
    if (isMobile) {
      setMobileNotificationsVisible(!mobileNotificationsVisible);
    } else {
      setPopoverVisible(!popoverVisible);
    }
  };

  const getIconComponent = (iconNameString) => {
    const iconStyle = { fontSize: "18px" };
    const iconMap = {
      UserPlus: "👤",
      Star: "⭐",
      DollarSign: "💰",
      Clock: "⏰",
      UserX: "🚫",
      MessageSquare: "💬",
    };
    const emoji = iconMap[iconNameString];
    if (emoji) {
      return (
        <span
          role="img"
          aria-label={iconNameString.toLowerCase()}
          style={iconStyle}
        >
          {emoji}
        </span>
      );
    }
    return <BellOutlined style={iconStyle} />;
  };

  const getIconColor = (iconNameString) => {
    const colorMap = {
      UserPlus: "linear-gradient(135deg, #10b981, #059669)",
      Star: "linear-gradient(135deg, #f59e0b, #d97706)",
      DollarSign: "linear-gradient(135deg, #22c55e, #16a34a)",
      Clock: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
      UserX: "linear-gradient(135deg, #ff385c, #e02954)",
      MessageSquare: "linear-gradient(135deg, #ff385c, #e02954)",
    };
    return (
      colorMap[iconNameString] || "linear-gradient(135deg, #64748b, #475569)"
    );
  };

  // Desktop popover content
  const desktopPopoverContent = (
    <PopoverContainer>
      <PopoverHeader>
        <HeaderTitle level={5}>Notifications</HeaderTitle>
        {currentUser && unreadCount > 0 && (
          <MarkAllButton
            onClick={markAllAsRead}
            disabled={loading || countLoading}
            icon={<ReadOutlined />}
          >
            Mark all read
          </MarkAllButton>
        )}
      </PopoverHeader>

      {!currentUser ? (
        <EmptyContainer>
          <Text style={{ color: "#64748b", fontSize: "16px" }}>
            Please log in to see notifications.
          </Text>
        </EmptyContainer>
      ) : (loading && !initialLoadDone) || countLoading ? (
        <LoadingContainer>
          <GlobalLoaderWithoutInlineStyles />
        </LoadingContainer>
      ) : notifications.length === 0 ? (
        <EmptyContainer>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text style={{ color: "#64748b", fontSize: "16px" }}>
                No new notifications
              </Text>
            }
          />
        </EmptyContainer>
      ) : (
        <StyledList
          itemLayout="horizontal"
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item style={{ padding: 0, border: "none" }}>
              <NotificationItem
                $isunread={!item.is_read}
                onClick={() => handleNotificationClick(item)}
              >
                <NotificationIconWrapper color={getIconColor(item.icon)}>
                  {getIconComponent(item.icon)}
                </NotificationIconWrapper>
                <NotificationContent>
                  <NotificationMessage $isunread={!item.is_read}>
                    {item.message}
                  </NotificationMessage>
                  <NotificationTime>
                    <ClockCircleOutlined />
                    {item.time_since}
                  </NotificationTime>
                </NotificationContent>
                {!item.is_read && (
                  <ActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(item.id);
                    }}
                    title="Mark as read"
                    icon={<CheckOutlined style={{ fontSize: "12px" }} />}
                  />
                )}
              </NotificationItem>
            </List.Item>
          )}
        />
      )}
    </PopoverContainer>
  );

  return (
    <>
      <div ref={notificationButtonRef}>
        {/* Desktop */}
        {!isMobile && (
          <Popover
            content={desktopPopoverContent}
            trigger="click"
            open={popoverVisible}
            onOpenChange={setPopoverVisible}
            placement="bottomRight"
            styles={{
              body: {
                padding: 0,
                backgroundColor: "transparent",
                boxShadow: "none",
                borderRadius: "16px",
                marginTop: "12px",
              },
            }}
            ref={popoverRef}
          >
            <IconContainer
              $hasunread={!!currentUser && unreadCount > 0 && !countLoading}
            >
              <Badge
                count={currentUser && !countLoading ? unreadCount : 0}
                overflowCount={99}
                size="small"
                offset={[-6, 6]}
                style={{
                  backgroundColor: "#ff385c",
                  borderColor: "#ffffff",
                  fontSize: "10px",
                  fontWeight: "600",
                  minWidth: "16px",
                  height: "16px",
                  lineHeight: "16px",
                  borderRadius: "8px",
                }}
              >
                {!!currentUser &&
                !countLoading &&
                (popoverVisible || unreadCount > 0) ? (
                  <BellFilled style={{ fontSize: "20px", color: "#ffffff" }} />
                ) : (
                  <BellOutlined
                    style={{ fontSize: "20px", color: "#ffffff" }}
                  />
                )}
              </Badge>
            </IconContainer>
          </Popover>
        )}

        {/* Mobile */}
        {isMobile && (
          <Badge
            count={currentUser && !countLoading ? unreadCount : 0}
            overflowCount={99}
            size="small"
            offset={[-6, 6]}
            style={{
              backgroundColor: "#ff385c",
              borderColor: "#ffffff",
              fontSize: "10px",
              fontWeight: "600",
              minWidth: "16px",
              height: "16px",
              lineHeight: "16px",
              borderRadius: "8px",
            }}
          >
            <IconContainer
              $hasunread={!!currentUser && unreadCount > 0 && !countLoading}
              onClick={toggleMobileNotifications}
            >
              {!!currentUser &&
              !countLoading &&
              (mobileNotificationsVisible || unreadCount > 0) ? (
                <BellFilled style={{ fontSize: "20px", color: "#ffffff" }} />
              ) : (
                <BellOutlined style={{ fontSize: "20px", color: "#ffffff" }} />
              )}
            </IconContainer>
          </Badge>
        )}
      </div>

      {/* Mobile Notifications Portal */}
      {isMobile &&
        typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {mobileNotificationsVisible && (
              <>
                <MobileNotificationOverlay
                  variants={overlayVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onClick={handleMobileNotificationsClose}
                />
                <MobileNotificationContainer
                  variants={notificationVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ transformOrigin }}
                >
                  <PopoverHeader>
                    <HeaderTitle level={5}>
                      <BellOutlined
                        style={{ fontSize: "20px", marginRight: "8px" }}
                      />
                      Notifications
                      {unreadCount > 0 && (
                        <Badge
                          count={unreadCount}
                          style={{
                            backgroundColor: "#ff385c",
                            marginLeft: "8px",
                          }}
                        />
                      )}
                    </HeaderTitle>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      {unreadCount > 0 && (
                        <Button
                          type="text"
                          icon={<Check size={16} />}
                          onClick={markAllAsRead}
                          style={{ padding: "4px 8px" }}
                          title="Mark all as read"
                        />
                      )}
                      <Button
                        type="text"
                        icon={<X size={20} />}
                        onClick={handleMobileNotificationsClose}
                      />
                    </div>
                  </PopoverHeader>

                  {!currentUser ? (
                    <EmptyContainer>
                      <Text style={{ color: "#64748b", fontSize: "16px" }}>
                        Please log in to see notifications.
                      </Text>
                    </EmptyContainer>
                  ) : (loading && !initialLoadDone) || countLoading ? (
                    <LoadingContainer>
                      <GlobalLoaderWithoutInlineStyles />
                    </LoadingContainer>
                  ) : notifications.length === 0 ? (
                    <EmptyContainer>
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <Text style={{ color: "#64748b", fontSize: "16px" }}>
                            No new notifications
                          </Text>
                        }
                      />
                    </EmptyContainer>
                  ) : (
                    <StyledList
                      itemLayout="horizontal"
                      dataSource={notifications}
                      renderItem={(item) => (
                        <List.Item style={{ padding: 0, border: "none" }}>
                          <NotificationItem
                            $isunread={!item.is_read}
                            onClick={() => handleNotificationClick(item)}
                          >
                            <NotificationIconWrapper
                              color={getIconColor(item.icon)}
                            >
                              {getIconComponent(item.icon)}
                            </NotificationIconWrapper>
                            <NotificationContent>
                              <NotificationMessage $isunread={!item.is_read}>
                                {item.message}
                              </NotificationMessage>
                              <NotificationTime>
                                <ClockCircleOutlined />
                                {item.time_since}
                              </NotificationTime>
                            </NotificationContent>
                            {!item.is_read && (
                              <ActionButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(item.id);
                                }}
                                title="Mark as read"
                                icon={
                                  <CheckOutlined style={{ fontSize: "12px" }} />
                                }
                              />
                            )}
                          </NotificationItem>
                        </List.Item>
                      )}
                    />
                  )}
                </MobileNotificationContainer>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

export default NotificationsButton;
