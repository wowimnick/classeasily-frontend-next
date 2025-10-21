// app/classes/[slug]/page.jsx
import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "antd";

import { fetchClassDetail } from "@/lib/server-data-fetchers";
import { businessService } from "@/services/apiService.js";
import ClientHeader from "@/components/layout/ClientHeader";
import Footer from "@/components/homepage/Footer.jsx";
import ClassPageClient from "../_components/ClassPageClient";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Generate static params - fetch ALL classes
export async function generateStaticParams() {
  try {
    console.log("=== Fetching ALL class slugs for static generation ===");
    const allClasses = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 20) {
      try {
        console.log(`Fetching page ${page}...`);

        const response = await fetch(
          `${BASE_URL}/classes/?page=${page}&page_size=100`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          console.error(`Failed to fetch page ${page}: ${response.status}`);
          break;
        }

        const data = await response.json();

        if (data.results && Array.isArray(data.results)) {
          allClasses.push(...data.results);
          console.log(`✅ Page ${page}: Added ${data.results.length} classes`);
          hasMore = !!data.next;
          page++;
        } else {
          hasMore = false;
        }

        if (hasMore) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        break;
      }
    }

    const slugs = allClasses
      .filter((classItem) => classItem.slug)
      .map((classItem) => ({ slug: classItem.slug }));

    console.log(
      `=== ✅ SUCCESS: ${slugs.length} class pages will be pre-generated ===`
    );
    return slugs;
  } catch (error) {
    console.error("❌ Error in generateStaticParams:", error);
    return [];
  }
}

// Fetch class data - USE THE TAGGED FETCH FROM server-data-fetchers
async function getClassData(slug) {
  console.log(`=== Fetching data for slug: ${slug} ===`);

  if (!slug) {
    console.error("ERROR: slug is undefined or empty!");
    notFound();
  }

  try {
    // USE THE FUNCTION WITH CACHE TAGS
    const classResult = await fetchClassDetail(slug);

    if (!classResult.success || !classResult.data) {
      console.warn(`Class not found for slug: ${slug}`);
      notFound();
    }

    const classData = classResult.data;
    console.log(`✅ Class data fetched: ${classData.classId}`);

    let businessResult = null;
    if (classData.business_slug) {
      console.log(`Fetching business: ${classData.business_slug}`);
      const res = await businessService.fetchPublicBusinessDetail(
        classData.business_slug
      );
      if (res.success && res.data) {
        businessResult = res.data;
        console.log(`✅ Business data fetched`);
      }
    }

    let reviewsResult = null;
    if (classData.review_count > 0) {
      console.log(`Fetching reviews for: ${slug}`);
      try {
        const response = await fetch(
          `${BASE_URL}/classes/${slug}/reviews/?page=1&page_size=6`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "force-cache",
            next: {
              revalidate: 1800,
              tags: ["reviews", `class-${slug}-reviews`],
            },
          }
        );

        if (response.ok) {
          const reviewsData = await response.json();
          reviewsResult = reviewsData.results || reviewsData;
          console.log(`✅ ${reviewsResult.length} reviews fetched`);
        }
      } catch (reviewError) {
        console.error("Error fetching reviews:", reviewError);
      }
    }

    return {
      classData,
      businessData: businessResult,
      initialReviews: reviewsResult,
    };
  } catch (error) {
    console.error(`❌ ERROR in getClassData for ${slug}:`, error);

    if (
      error.response?.status === 404 ||
      error.message?.includes("404") ||
      error.message?.includes("not found")
    ) {
      notFound();
    }

    throw error;
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const { classData, businessData } = await getClassData(resolvedParams.slug);

  const pageTitle = classData?.title
    ? `${classData.title} | Classeasily`
    : "Class Details | Classeasily";
  const pageDescription = classData?.description
    ? classData.description.substring(0, 160) + "..."
    : "View details and book this class on Classeasily.";
  const canonicalUrl = `https://www.classeasily.com/classes/${classData.slug}`;
  const imageUrl =
    classData.images?.length > 0
      ? classData.images[0].original_url
      : "https://www.classeasily.com/placeholder-image.jpg";

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: classData.title,
    description: classData.description,
    image: imageUrl,
    courseCode: `CLASS-${classData.classId}`,
    provider: {
      "@type": "Organization",
      name: businessData?.businessName || "Classeasily Partner",
      url: businessData?.website || "https://www.classeasily.com",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: classData.average_rating?.toFixed(1) || "0",
      reviewCount: classData.review_count || "0",
    },
    offers: classData.options
      ?.filter((opt) =>
        opt.schedules?.some((s) => s.price && parseFloat(s.price) > 0)
      )
      .map((option) => ({
        "@type": "Offer",
        name: option.title || "Class Option",
        price:
          option.schedules.find((s) => s.price && parseFloat(s.price) > 0)
            ?.price || "0",
        priceCurrency: classData.currency_code || "USD",
        availability: "https://schema.org/InStock",
      })),
  };

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      images: [
        { url: imageUrl, width: 1200, height: 630, alt: classData.title },
      ],
      type: "website",
    },
    other: {
      "application/ld+json": JSON.stringify(courseSchema),
    },
  };
}

export default async function ClassPage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const { classData, businessData, initialReviews } = await getClassData(
    resolvedParams.slug
  );

  const breadcrumbItems = [
    { key: "home", title: <Link href="/">Home</Link> },
    { key: "explore", title: <Link href="/explore">Explore</Link> },
  ];

  const { category_key, category_name, subcategory_key, subcategory_name } =
    classData;

  const locationText =
    classData?.business_city && classData?.business_state
      ? `${classData.business_city}, ${classData.business_state}`
      : classData?.business_state || classData?.business_city || null;

  if (locationText) {
    const locationSearchParams = new URLSearchParams({
      location: locationText,
    });
    breadcrumbItems.push({
      key: "location",
      title: (
        <Link href={`/explore?${locationSearchParams.toString()}`}>
          {locationText}
        </Link>
      ),
    });
  }

  if (category_name && category_key) {
    const categoryUrl = `/explore/category/${category_key}`;
    breadcrumbItems.push({
      key: "category",
      title: <Link href={categoryUrl}>{category_name}</Link>,
    });

    if (subcategory_name && subcategory_key) {
      const subcategoryUrl = `${categoryUrl}/${subcategory_key}`;
      breadcrumbItems.push({
        key: "subcategory",
        title: <Link href={subcategoryUrl}>{subcategory_name}</Link>,
      });
    }
  }

  breadcrumbItems.push({
    key: "class",
    title: classData.title,
  });

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <ClientHeader showOptionsWrapper={false} />
      <main style={{ flex: 1 }}>
        <ClassPageClient
          classData={classData}
          businessData={businessData}
          initialReviews={initialReviews}
        />
      </main>
      <div
        style={{
          maxWidth: "1200px",
          padding: "24px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <Breadcrumb items={breadcrumbItems} />
      </div>
      <Footer />
    </div>
  );
}
