import { permanentRedirect } from "next/navigation";
import { connection } from "next/server";

export const metadata = {
  title: "ClassEasily",
  robots: { index: false, follow: false },
};

export default async function BusinessPublicPage({ params }) {
  await connection();
  await Promise.resolve(params);
  permanentRedirect("/");
}
