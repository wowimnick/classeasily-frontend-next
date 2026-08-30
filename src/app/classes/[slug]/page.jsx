import { permanentRedirect } from "next/navigation";
import { connection } from "next/server";

export const metadata = {
  title: "ClassEasily",
  robots: { index: false, follow: false },
};

export default async function ClassPage({ params }) {
  await connection();
  await params;
  permanentRedirect("/");
}
