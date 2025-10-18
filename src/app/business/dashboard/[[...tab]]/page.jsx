import { Suspense } from "react";
import DashboardContent from "../_components/DashboardContent";
import Loading from "../loading";

export const metadata = {
  title: "Dashboard | ClassEasily",
  description: "Business dashboard",
};

export default async function DashboardPage({ params }) {
  // Await params in Next.js 15+
  const resolvedParams = await params;

  // Create a unique key based on the current route
  const tabKey = resolvedParams?.tab?.join("/") || "overview";

  return (
    <Suspense fallback={<Loading />}>
      <DashboardContent key={tabKey} params={resolvedParams} />
    </Suspense>
  );
}
