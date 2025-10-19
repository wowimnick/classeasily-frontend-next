"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import AuthModal from "@/components/auth/AuthModal";
import { useAuthStore } from "@/lib/auth-client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");
  const [onSuccessCallback, setOnSuccessCallback] = useState(null);

  // Watch for global auth modal trigger
  const shouldOpenAuthModal = useAuthStore(
    (state) => state.shouldOpenAuthModal
  );
  const setShouldOpenAuthModal = useAuthStore(
    (state) => state.setShouldOpenAuthModal
  );

  // Open auth modal when global flag is set
  useEffect(() => {
    if (shouldOpenAuthModal && !isAuthModalVisible) {
      console.log("[AuthContext] Global auth modal trigger detected");
      setAuthModalMode("login");
      setIsAuthModalVisible(true);
      // Reset the flag
      setShouldOpenAuthModal(false);
    }
  }, [shouldOpenAuthModal, isAuthModalVisible, setShouldOpenAuthModal]);

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
