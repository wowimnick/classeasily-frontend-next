import ShortlistPageClient from "./ShortlistPageClient";

export const metadata = {
  title: "Your team event options | ClassEasily",
  description: "Review your curated team-building options.",
  robots: { index: false, follow: false },
};

export default async function CorporateShortlistPage({ params }) {
  const resolved = await params;
  const token = resolved?.token;
  if (!token) {
    return null;
  }
  return <ShortlistPageClient token={token} />;
}
