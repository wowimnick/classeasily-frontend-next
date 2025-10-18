// app/classes/[slug]/page.jsx
import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "antd";

import { classService, businessService } from "@/services/apiService.js";
import ClientHeader from "@/components/layout/ClientHeader";
import Footer from "@/components/homepage/Footer.jsx";
import ClassPageClient from "../_components/ClassPageClient";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateStaticParams() {
  if (process.env.NODE_ENV !== "production") {
    console.log("=== Skipping generateStaticParams in development ===");
    return [];
  }

  try {
    console.log("=== generateStaticParams: Fetching class slugs ===");
    const pages = [1, 2];
    const allClasses = [];

    for (const page of pages) {
      try {
        console.log(`Fetching page ${page}...`);
        const params = { page, participants: 1 };
        const response = await classService.searchClasses(params);

        if (response.results && Array.isArray(response.results)) {
          allClasses.push(...response.results);
          console.log(`Page ${page}: Found ${response.results.length} classes`);
        }

        if (page < pages.length) {
          await delay(1000);
        }
      } catch (error) {
        console.error(`Error fetching page ${page} for static params:`, error);
      }
    }

    const slugs = allClasses
      .filter((classItem) => classItem.slug)
      .map((classItem) => ({ slug: classItem.slug }));

    console.log(
      `=== generateStaticParams: Found ${slugs.length} slugs to prerender ===`
    );
    return slugs;
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}

async function getClassData(slug) {
  console.log(`=== getClassData called with slug: ${slug} ===`);

  if (!slug) {
    console.error("ERROR: slug is undefined or empty!");
    notFound();
  }

  try {
    console.log(`Fetching class with slug: ${slug}`);
    const classResult = await classService.fetchClassDetail(slug);
    console.log(`✅ Class fetch successful: ${classResult?.classId}`);

    if (!classResult || !classResult.classId) {
      console.warn(`Class not found for slug: ${slug}`);
      notFound();
    }

    let businessResult = null;
    if (classResult.business_slug) {
      console.log(`Fetching business with slug: ${classResult.business_slug}`);
      const res = await businessService.fetchPublicBusinessDetail(
        classResult.business_slug
      );
      if (res.success && res.data) {
        businessResult = res.data;
        console.log(`✅ Business fetch successful`);
      } else {
        console.warn(
          `Could not fetch business data for slug: ${classResult.business_slug}`
        );
      }
    }

    // Fetch initial reviews during static generation
    let reviewsResult = null;
    if (classResult.review_count > 0) {
      console.log(`Fetching initial reviews for class: ${slug}`);
      try {
        const reviewsData = await classService.fetchClassReviewsPaginated(
          slug,
          1,
          6
        );
        if (reviewsData.success && reviewsData.reviews) {
          // Pass the full reviews array from the response
          reviewsResult = reviewsData.reviews;
          console.log(
            `✅ Reviews fetch successful: ${reviewsResult.length} reviews`
          );

          // Log first review to verify structure
          if (reviewsResult.length > 0) {
            console.log(
              "First review structure:",
              JSON.stringify(
                {
                  id: reviewsResult[0].id,
                  reviewer_name: reviewsResult[0].reviewer_name,
                  has_avatar: !!reviewsResult[0].reviewer_avatar_url,
                  has_images: reviewsResult[0].image_urls?.length || 0,
                  rating: reviewsResult[0].rating,
                  source: reviewsResult[0].source,
                },
                null,
                2
              )
            );
          }
        } else {
          console.warn(
            "Reviews fetch returned no data or failed:",
            reviewsData
          );
        }
      } catch (reviewError) {
        console.error("Error fetching reviews:", reviewError);
        // Don't fail the entire page if reviews fail
        reviewsResult = null;
      }
    }

    return {
      classData: classResult,
      businessData: businessResult,
      initialReviews: reviewsResult, // Pass the array directly
    };
  } catch (error) {
    console.error(`=== ERROR in getClassData ===`);
    console.error("Slug:", slug);
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error response:", error.response?.data);

    if (
      error.response?.status === 404 ||
      error.message?.includes("404") ||
      error.message?.includes("not found")
    ) {
      console.log("404 error detected, calling notFound()");
      notFound();
    }

    throw new Error(`Failed to load class details for slug: ${slug}`);
  }
}

const getCachedClassData = React.cache(getClassData);

export async function generateMetadata({ params }) {
  const resolvedParams = await Promise.resolve(params);
  console.log("=== generateMetadata for slug:", resolvedParams.slug);

  const { classData, businessData } = await getCachedClassData(
    resolvedParams.slug
  );

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
  console.log("=== ClassPage rendering slug:", resolvedParams.slug);

  const { classData, businessData, initialReviews } = await getCachedClassData(
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
