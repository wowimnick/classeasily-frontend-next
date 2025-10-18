"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/useAuthUser";

export default function PermissionProtectedRoute({
  children,
  requiredPermission,
}) {
  const router = useRouter();
  const { user: currentUser, isLoading } = useAuthUser();
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    if (
      requiredPermission &&
      !currentUser?.permissions?.includes(requiredPermission)
    ) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, currentUser, requiredPermission, router]);

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
