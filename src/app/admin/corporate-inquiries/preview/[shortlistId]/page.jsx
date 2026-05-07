import { connection } from "next/server";
import PreviewClient from "./PreviewClient";

export default async function AdminCorporateShortlistPreviewPage({ params }) {
  await connection();
  const { shortlistId } = await params;
  return <PreviewClient shortlistId={shortlistId} />;
}
