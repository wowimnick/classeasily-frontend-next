/**
 * Maps admin API shapes to the same JSON shape as the public shortlist GET,
 * so preview renders identical UI components.
 */
export function adminShortlistToPreviewPayload(shortlistAdmin, inquiryAdmin) {
  const inquiry = {
    company_name: inquiryAdmin?.company_name ?? "",
    contact_name: inquiryAdmin?.contact_name ?? "",
    email: inquiryAdmin?.email ?? "",
  };

  const options = (shortlistAdmin.options || [])
    .filter((o) => !o.is_archived)
    .sort((a, b) => a.position - b.position || String(a.id).localeCompare(String(b.id)))
    .map((o) => ({
      id: o.id,
      position: o.position,
      source_type: o.source_type,
      class_slug: o.source_class_slug || "",
      title: o.title,
      host_name: o.host_name,
      tagline: o.tagline || "",
      description: o.description || "",
      inclusions: o.inclusions || [],
      cover_image_url: o.cover_image_url || "",
      gallery_urls: o.gallery_urls || [],
      location_text: o.location_text || "",
      location_label: o.location_label || "",
      maps_query: o.maps_query || "",
      duration_minutes: o.duration_minutes,
      min_headcount: o.min_headcount,
      max_headcount: o.max_headcount,
      price_total_cents: o.price_total_cents,
      price_per_person_cents: o.price_per_person_cents,
      proposed_date_options: o.proposed_date_options || [],
    }));

  return {
    id: shortlistAdmin.id,
    token: shortlistAdmin.token,
    status: shortlistAdmin.status,
    deposit_percent: shortlistAdmin.deposit_percent,
    currency: shortlistAdmin.currency,
    inquiry,
    options,
    active_booking: null,
  };
}
