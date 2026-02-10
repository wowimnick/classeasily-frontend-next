import { Suspense } from "react";
import ClientOnlyWrapper from "@/components/common/ClientOnlyWrapper";
import PermissionProtectedRoute from "@/components/auth/PermissionProtectedRoute";
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";

export const metadata = {
  title: "Administration | Platform Management",
  description: "Manage users, roles, and platform settings",
};

export default function AdminLayout({ children }) {
  return (
    <ClientOnlyWrapper>
      <PermissionProtectedRoute requiredPermission="quickstart.access_admin_dashboard">
        <Suspense fallback={<GlobalLoaderWithInlineStyles />}>
          {children}
        </Suspense>
      </PermissionProtectedRoute>
    </ClientOnlyWrapper>
  );
}
