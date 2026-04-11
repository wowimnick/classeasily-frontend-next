/**
 * Maps primary BusinessLocation (or legacy profile fields) to profile PATCH/FormData fields.
 */
export function getAddressFieldsForProfileSave(data) {
  if (!data) {
    return {
      businessAddress: "",
      businessUnit: "",
      businessCity: "",
      businessState: "",
      businessZipCode: "",
      latitude: null,
      longitude: null,
      showExactLocation: true,
    };
  }
  const locs = data.locations || [];
  const primary = locs.find((l) => l.is_primary && l.is_active !== false);
  if (primary) {
    return {
      businessAddress: primary.address || "",
      businessUnit: primary.unit || "",
      businessCity: primary.city || "",
      businessState: primary.state || "",
      businessZipCode: primary.zip_code || "",
      latitude: primary.latitude != null ? Number(primary.latitude) : null,
      longitude: primary.longitude != null ? Number(primary.longitude) : null,
      showExactLocation: primary.show_exact_location !== false,
    };
  }
  return {
    businessAddress: data.businessAddress || "",
    businessUnit: data.businessUnit || "",
    businessCity: data.businessCity || "",
    businessState: data.businessState || "",
    businessZipCode: data.businessZipCode || "",
    latitude: data.latitude != null ? Number(data.latitude) : null,
    longitude: data.longitude != null ? Number(data.longitude) : null,
    showExactLocation: data.showExactLocation !== false,
  };
}
