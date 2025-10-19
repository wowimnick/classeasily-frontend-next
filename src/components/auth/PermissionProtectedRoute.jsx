"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/useAuthUser";
import { saveRedirectPath, useAuthStore } from "@/lib/auth-client"; // Import these

export default function PermissionProtectedRoute({
  children,
  requiredPermission,
}) {
  const router = useRouter();
  const { user: currentUser, isLoading } = useAuthUser();
  const isAuthenticated = !!currentUser;
  const [currentPath, setCurrentPath] = useState("");

  // Get the function to open auth modal
  const setShouldOpenAuthModal = useAuthStore(
    (state) => state.setShouldOpenAuthModal
  );

  // Get pathname only on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  useEffect(() => {
    // Don't redirect while loading or if path isn't set yet
    if (isLoading || !currentPath) return;

    if (!isAuthenticated) {
      // Save the redirect path
      saveRedirectPath(currentPath, requiredPermission);

      // CRITICAL FIX: Trigger the auth modal to open
      setShouldOpenAuthModal(true);

      // Redirect to homepage
      router.push("/");
      return;
    }

    if (
      requiredPermission &&
      !currentUser?.permissions?.includes(requiredPermission)
    ) {
      // User is authenticated but lacks permission - clear redirect and go home
      if (typeof window !== "undefined") {
        localStorage.removeItem("redirectAfterLogin");
        localStorage.removeItem("redirectRequiredPermission");
      }
      router.push("/");
    }
  }, [
    isAuthenticated,
    isLoading,
    currentUser,
    requiredPermission,
    router,
    currentPath,
    setShouldOpenAuthModal, // Add to dependencies
  ]);

  // Show nothing while loading or if not authenticated
  if (
    isLoading ||
    !isAuthenticated ||
    (requiredPermission &&
      !currentUser?.permissions?.includes(requiredPermission))
  ) {
    return null;
  }

  return children;
}
