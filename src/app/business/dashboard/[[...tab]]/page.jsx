import DashboardContent from "../_components/DashboardContent";

export const metadata = {
  title: "Dashboard | ClassEasily",
  description: "Business dashboard",
};

// Simplified - DashboardContent now reads pathname directly
export default function DashboardPage() {
  return <DashboardContent />;
}
