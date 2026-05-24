import React from "react";
import { notFound, permanentRedirect } from "next/navigation";
import ClassCheckoutClient from "./_components/ClassCheckoutClient";
import { fetchClassDetail } from "@/lib/server-data-fetchers";

async function getClassData(slug) {
  if (!slug) return null;
  try {
    const classResult = await fetchClassDetail(slug);
    if (!classResult?.success || !classResult?.data) return null;
    return classResult.data;
  } catch {
    return null;
  }
}

export default async function ClassCheckoutPage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;
  if (!slug) notFound();

  const initialClassData = await getClassData(slug);
  if (
    initialClassData?.slug &&
    slug &&
    slug !== initialClassData.slug
  ) {
    permanentRedirect(`/classes/${initialClassData.slug}/checkout`);
  }
  if (!initialClassData) notFound();

  return (
    <ClassCheckoutClient
      slug={initialClassData.slug}
      initialClassData={initialClassData}
    />
  );
}
