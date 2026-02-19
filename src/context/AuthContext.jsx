// app/context/AuthContext.jsx

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/auth/AuthModal";
import {
  useAuthStore,
  getRedirectPath,
  clearRedirectPath,
} from "@/lib/auth-client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const router = useRouter();
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
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

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

  // Handle post-login redirect
  useEffect(() => {
    if (isAuthenticated && user && isAuthModalVisible) {
      // FIX: Do not redirect if the user is in the "Forgot Password" flow.
      // This prevents phantom redirects if background auth refreshes/initializes
      // while the user is trying to reset their password.
      if (authModalMode === 'forgotPassword') {
        console.log("[AuthContext] User authenticated but in Forgot Password mode. Preventing redirect.");
        return;
      }

      console.log("[AuthContext] User authenticated, checking for redirect...");

      // Get redirect data
      const { path: redirectPath, requiredPermission } = getRedirectPath();

      // Close modal first
      setIsAuthModalVisible(false);

      // Execute any callback
      if (typeof onSuccessCallback === "function") {
        onSuccessCallback();
        setOnSuccessCallback(null);
      }

      // Handle redirect logic
      if (user.has_business) {
        console.log(
          "[AuthContext] User has business, redirecting to business dashboard"
        );
        clearRedirectPath();
        router.push("/business/dashboard/overview");
      } else if (redirectPath && redirectPath !== "/") {
        // If they came from /business (e.g. Become a host), send to registration flow
        const targetPath =
          redirectPath === "/business" ? "/business/register" : redirectPath;
        if (requiredPermission) {
          if (user?.permissions?.includes(requiredPermission)) {
            clearRedirectPath();
            router.push(targetPath);
          } else {
            clearRedirectPath();
          }
        } else {
          clearRedirectPath();
          router.push(targetPath);
        }
      } else {
        // No redirect needed
        clearRedirectPath();
      }
    }
  }, [isAuthenticated, user, isAuthModalVisible, onSuccessCallback, router, authModalMode]); // Added authModalMode dependency

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

  const authModalValue = useMemo(
    () => ({
      openLoginModal,
      openRegisterModal,
      openForgotPasswordModal,
      closeAuthModal,
    }),
    [openLoginModal, openRegisterModal, openForgotPasswordModal, closeAuthModal]
  );

  return (
    <AuthContext.Provider value={authModalValue}>
      {children}
      <AuthModal
        visible={isAuthModalVisible}
        onClose={closeAuthModal}
        defaultMode={authModalMode}
        onLoginSuccessAction={executeLoginSuccessAction}
        onModeChange={setAuthModalMode} // <--- Sync modal internal state with context
      />
    </AuthContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthProvider");
  }
  return context;
};