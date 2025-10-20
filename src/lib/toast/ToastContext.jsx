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

  const messageAPI = {
    success: (content, duration, onClose) =>
      addToast("success", content, duration, onClose),
    error: (content, duration, onClose) =>
      addToast("error", content, duration, onClose),
    info: (content, duration, onClose) =>
      addToast("info", content, duration, onClose),
    warning: (content, duration, onClose) =>
      addToast("warning", content, duration, onClose),
    loading: (content, duration = 0, onClose) =>
      addToast("loading", content, duration, onClose),
    open: ({ type = "info", content, duration, onClose }) =>
      addToast(type, content, duration, onClose),
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
