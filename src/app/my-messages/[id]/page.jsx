"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Redirect /my-messages/[id] → /?conversation_id=id (homepage with overlay). No dedicated page. */
export default function RedirectToHomepageConversation() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  useEffect(() => {
    if (!id) router.replace("/my-messages");
    else router.replace(`/?conversation_id=${id}`, { scroll: false });
  }, [id, router]);

  return null;
}
