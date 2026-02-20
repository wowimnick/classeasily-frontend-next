// components/homepage/Footer.jsx
import { fetchClassCollections } from "@/lib/server-data-fetchers";
import FooterClient from "./FooterClient";

/**
 * Server Component wrapper for Footer
 * Fetches collections on the server (with caching) and passes them to the client component
 */
export default async function Footer() {
  const collections = await fetchClassCollections();

  return <FooterClient collections={collections} />;
}
