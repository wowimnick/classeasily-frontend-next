// components/homepage/Footer.jsx
import { fetchBusinessCategories } from "@/lib/server-data-fetchers";
import FooterClient from "./FooterClient";

/**
 * Server Component wrapper for Footer
 * Fetches categories on the server (with caching) and passes them to the client component
 */
export default async function Footer() {
  // Fetch categories on the server (with caching)
  const result = await fetchBusinessCategories();
  const categories = result.success ? result.data : [];

  return <FooterClient categories={categories} />;
}
