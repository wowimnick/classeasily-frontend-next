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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            height: "100vh",
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          <Suspense fallback={<GlobalLoaderWithInlineStyles />}>
            {children}
          </Suspense>
        </div>
      </PermissionProtectedRoute>
    </ClientOnlyWrapper>
  );
}
