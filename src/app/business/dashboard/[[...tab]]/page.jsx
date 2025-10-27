import DashboardContent from "../_components/DashboardContent";

export const metadata = {
  title: "Dashboard | ClassEasily",
  description: "Business dashboard",
};

// CRITICAL FIX: Remove the key prop and Suspense wrapper
// The key was causing complete unmount/remount on every navigation
// DashboardContent now uses usePathname() to track route changes
export default function DashboardPage() {
  return <DashboardContent />;
}
