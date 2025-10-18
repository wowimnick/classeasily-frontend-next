// app/businesses/[slug]/page.jsx

import { notFound } from "next/navigation";
import BusinessPageClient from "../_components/BusinessPageClient";
import { businessService } from "@/services/apiService";

// Fetch all business data once and cache it for the build process
let allBusinessesData = null;

async function getAllBusinesses() {
  if (!allBusinessesData) {
    try {
      allBusinessesData = await businessService.fetchPublicBusinesses();
    } catch (error) {
      allBusinessesData = { success: false, data: [] };
    }
  }
  return allBusinessesData;
}

// Generate static params for business pages
export async function generateStaticParams() {
  if (process.env.NODE_ENV !== "production") {
    return [];
  }

  try {
    const businessesResult = await getAllBusinesses();

    if (!businessesResult.success || !businessesResult.data) {
      return [];
    }

    const paths = (businessesResult.data?.results || []).map((business) => ({
      slug: business.slug,
    }));

    return paths;
  } catch {
    return [];
  }
}

async function getBusinessData(slug) {
  if (!slug || typeof slug !== "string") {
    return null;
  }

  const businessesResult = await getAllBusinesses();

  // Check if we already have the business data from the initial fetch
  if (businessesResult.success && businessesResult.data) {
    const businessFromList = businessesResult.data?.results?.find(
      (business) => business.slug === slug
    );
    if (businessFromList) {
      return businessFromList;
    }
  }

  // Fallback: fetch the business individually
  try {
    const result = await businessService.fetchPublicBusinessDetail(slug);

    if (!result.success || !result.data) {
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;
  const businessData = await getBusinessData(slug);

  if (!businessData) {
    return {
      title: "Business Not Found | Classeasily",
    };
  }

  const { businessName, businessDescription } = businessData;
  const pageDescription =
    businessDescription?.substring(0, 160) + "..." ||
    `Explore classes and reviews for ${businessName}.`;

  return {
    title: `${businessName} | Classeasily`,
    description: pageDescription,
    openGraph: {
      title: `${businessName} | Classeasily`,
      description: pageDescription,
    },
  };
}

export default async function BusinessPage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;
  const businessData = await getBusinessData(slug);

  if (!businessData) {
    notFound();
  }

  return <BusinessPageClient initialData={businessData} slug={slug} />;
}
