"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
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
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
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
  width: auto;

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

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const removeToast = useCallback((id) => {
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
    (type, content, duration = 3000, onClose) => {
      const id = Date.now() + Math.random();

      setToasts((prev) => [...prev, { id, type, content, isExiting: false }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
          onClose?.();
        }, duration);
      }

      return () => removeToast(id);
    },
    [removeToast]
  );

  const normalizeDuration = (duration) => {
    if (duration === undefined || duration === null) return 3000;
    if (duration === 0) return 0; // For loading states
    return duration * 1000; // Convert seconds to milliseconds
  };

  const messageAPI = {
    success: (content, duration, onClose) => {
      if (typeof content === "object" && content.content !== undefined) {
        return addToast(
          "success",
          content.content,
          normalizeDuration(content.duration),
          content.onClose
        );
      }
      return addToast("success", content, normalizeDuration(duration), onClose);
    },
    error: (content, duration, onClose) => {
      if (typeof content === "object" && content.content !== undefined) {
        return addToast(
          "error",
          content.content,
          normalizeDuration(content.duration),
          content.onClose
        );
      }
      return addToast("error", content, normalizeDuration(duration), onClose);
    },
    info: (content, duration, onClose) => {
      if (typeof content === "object" && content.content !== undefined) {
        return addToast(
          "info",
          content.content,
          normalizeDuration(content.duration),
          content.onClose
        );
      }
      return addToast("info", content, normalizeDuration(duration), onClose);
    },
    warning: (content, duration, onClose) => {
      if (typeof content === "object" && content.content !== undefined) {
        return addToast(
          "warning",
          content.content,
          normalizeDuration(content.duration),
          content.onClose
        );
      }
      return addToast("warning", content, normalizeDuration(duration), onClose);
    },
    loading: (content, duration = 0, onClose) => {
      if (typeof content === "object" && content.content !== undefined) {
        return addToast(
          "loading",
          content.content,
          normalizeDuration(content.duration || 0),
          content.onClose
        );
      }
      return addToast(
        "loading",
        content,
        normalizeDuration(duration || 0),
        onClose
      );
    },
    open: ({ type = "info", content, duration, onClose }) => {
      return addToast(type, content, normalizeDuration(duration), onClose);
    },
    destroy: (key) => {
      if (key) {
        removeToast(key);
      } else {
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
