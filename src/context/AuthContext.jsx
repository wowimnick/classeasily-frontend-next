"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import AuthModal from "@/components/auth/AuthModal";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");
  const [onSuccessCallback, setOnSuccessCallback] = useState(null);

  const openLoginModal = useCallback((onSuccess = null) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("authModalOpening"));
    }
    setAuthModalMode("login");
    setOnSuccessCallback(() => onSuccess);
    setTimeout(() => {
      setIsAuthModalVisible(true);
    }, 100);
  }, []);

  const openRegisterModal = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("authModalOpening"));
    }
    setAuthModalMode("register");
    setOnSuccessCallback(null);
    setTimeout(() => {
      setIsAuthModalVisible(true);
    }, 100);
  }, []);

  const openForgotPasswordModal = useCallback(() => {
    setAuthModalMode("forgotPassword");
    setOnSuccessCallback(null);
    setIsAuthModalVisible(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalVisible(false);
    setOnSuccessCallback(null);
  }, []);

  const executeLoginSuccessAction = useCallback(() => {
    if (typeof onSuccessCallback === "function") {
      onSuccessCallback();
      setOnSuccessCallback(null);
    }
  }, [onSuccessCallback]);

  return (
    <AuthContext.Provider
      value={{
        openLoginModal,
        openRegisterModal,
        openForgotPasswordModal,
        closeAuthModal,
      }}
    >
      {children}
      {isAuthModalVisible && (
        <AuthModal
          visible={isAuthModalVisible}
          onClose={closeAuthModal}
          defaultMode={authModalMode}
          onLoginSuccessAction={executeLoginSuccessAction}
        />
      )}
    </AuthContext.Provider>
  );
};

// Renamed to avoid conflict with auth-client's useAuth
export const useAuthModal = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthProvider");
  }
  return context;
};
