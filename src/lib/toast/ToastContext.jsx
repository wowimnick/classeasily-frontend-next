"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { setMessageHandlers } from "../message";

const ToastContext = createContext(null);

// Animations
const slideIn = keyframes`
  from {
    transform: translate(-50%, -100%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translate(-50%, 0);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -100%);
    opacity: 0;
  }
`;

// Styled Components
const ToastContainer = styled.div`
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  align-items: center;
`;

const ToastItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 10px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: ${(props) => (props.$isExiting ? slideOut : slideIn)} 0.3s ease;
  pointer-events: auto;
  max-width: 500px;

  .anticon {
    font-size: 16px;
    flex-shrink: 0;
  }

  &[data-type="success"] .anticon {
    color: #52c41a;
  }

  &[data-type="error"] .anticon {
    color: #ff4d4f;
  }

  &[data-type="info"] .anticon {
    color: #1890ff;
  }

  &[data-type="warning"] .anticon {
    color: #faad14;
  }

  &[data-type="loading"] .anticon {
    color: #1890ff;
  }
`;

const ToastContent = styled.div`
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 1.5;
  white-space: nowrap;
`;

const iconMap = {
  success: CheckCircleOutlined,
  error: CloseCircleOutlined,
  info: InfoCircleOutlined,
  warning: WarningOutlined,
  loading: LoadingOutlined,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const timersRef = useRef({});

  React.useEffect(() => {
    setIsMounted(true);
    return () => {
      // Clear all timers on unmount
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  const removeToast = useCallback((id) => {
    // Clear any existing timer for this toast
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }

    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, isExiting: true } : toast
      )
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback(
    (type, content, duration = 3000, onClose, key) => {
      // Use provided key or generate a unique one
      const id = key || Date.now() + Math.random();

      // Clear any existing timer for this key/id
      if (timersRef.current[id]) {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
      }

      // Check if toast with this key already exists
      setToasts((prev) => {
        const existingToast = prev.find((toast) => toast.id === id);

        if (existingToast) {
          // Update existing toast - replace type and content
          return prev.map((toast) =>
            toast.id === id
              ? { ...toast, type, content, isExiting: false }
              : toast
          );
        } else {
          // Add new toast
          return [...prev, { id, type, content, isExiting: false }];
        }
      });

      // Set up auto-dismiss timer if duration > 0
      if (duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
          onClose?.();
        }, duration);
        timersRef.current[id] = timer;
      }

      // Return function to manually close this toast
      return () => removeToast(id);
    },
    [removeToast]
  );

  const normalizeDuration = (duration) => {
    if (duration === undefined || duration === null) return 3000;
    if (duration === 0) return 0; // For loading states that need manual dismissal
    return duration * 1000; // Convert seconds to milliseconds
  };

  const messageAPI = {
    success: (content, duration, onClose) => {
      if (typeof content === "object" && content.content !== undefined) {
        const normalizedDuration = normalizeDuration(content.duration);
        return addToast(
          "success",
          content.content,
          normalizedDuration,
          content.onClose,
          content.key
        );
      }
      return addToast("success", content, normalizeDuration(duration), onClose);
    },
    error: (content, duration, onClose) => {
      if (typeof content === "object" && content.content !== undefined) {
        const normalizedDuration = normalizeDuration(content.duration);
        return addToast(
          "error",
          content.content,
          normalizedDuration,
          content.onClose,
          content.key
        );
      }
      return addToast("error", content, normalizeDuration(duration), onClose);
    },
    info: (content, duration, onClose) => {
      if (typeof content === "object" && content.content !== undefined) {
        const normalizedDuration = normalizeDuration(content.duration);
        return addToast(
          "info",
          content.content,
          normalizedDuration,
          content.onClose,
          content.key
        );
      }
      return addToast("info", content, normalizeDuration(duration), onClose);
    },
    warning: (content, duration, onClose) => {
      if (typeof content === "object" && content.content !== undefined) {
        const normalizedDuration = normalizeDuration(content.duration);
        return addToast(
          "warning",
          content.content,
          normalizedDuration,
          content.onClose,
          content.key
        );
      }
      return addToast("warning", content, normalizeDuration(duration), onClose);
    },
    loading: (content, duration = 0, onClose) => {
      if (typeof content === "object" && content.content !== undefined) {
        const normalizedDuration = normalizeDuration(
          content.duration !== undefined ? content.duration : 0
        );
        return addToast(
          "loading",
          content.content,
          normalizedDuration,
          content.onClose,
          content.key
        );
      }
      return addToast("loading", content, normalizeDuration(duration), onClose);
    },
    open: ({ type = "info", content, duration, onClose, key }) => {
      return addToast(type, content, normalizeDuration(duration), onClose, key);
    },
    destroy: (key) => {
      if (key) {
        removeToast(key);
      } else {
        // Destroy all toasts
        Object.keys(timersRef.current).forEach((id) => {
          clearTimeout(timersRef.current[id]);
        });
        timersRef.current = {};
        setToasts([]);
      }
    },
  };

  // Set the module-level handlers when provider mounts
  useEffect(() => {
    setMessageHandlers(messageAPI);
  }, [messageAPI]);

  return (
    <ToastContext.Provider value={messageAPI}>
      {children}
      {isMounted &&
        createPortal(
          <ToastContainer>
            {toasts.map((toast) => {
              const Icon = iconMap[toast.type];
              return (
                <ToastItem
                  key={toast.id}
                  data-type={toast.type}
                  $isExiting={toast.isExiting}
                >
                  <Icon spin={toast.type === "loading"} />
                  <ToastContent>{toast.content}</ToastContent>
                </ToastItem>
              );
            })}
          </ToastContainer>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
