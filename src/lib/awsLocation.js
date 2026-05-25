/** AWS Location Service proxy (shared across autocomplete, reverse geocode, and client geolocation). */
export const AWS_LOCATION_API_URL =
  "https://geocoding.classeasily.com/address-autocomplete-proxy";

export function parseAlsLocationResult(entry) {
  if (!entry || typeof entry !== "object") return null;

  const lat = Number(entry.latitude ?? entry.lat);
  const lng = Number(entry.longitude ?? entry.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const city =
    entry.city || entry.locality || entry.place || entry.municipality || "";
  const region =
    entry.state ||
    entry.region ||
    entry.administrativeArea ||
    entry.province ||
    "";

  return {
    lat,
    lng,
    city,
    region,
    country: entry.country || entry.countryName || "",
    displayText: `${city || "Unknown"}${region ? `, ${region}` : ""}`,
    timezone:
      entry.timezone ||
      (typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "America/Toronto"),
  };
}

export async function reverseGeocodeWithAls(lat, lng, { signal } = {}) {
  const response = await fetch(
    `${AWS_LOCATION_API_URL}?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&reverse=true`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(`ALS reverse geocode failed: ${response.status}`);
  }
  const data = await response.json();
  const entry = Array.isArray(data) ? data[0] : data;
  return parseAlsLocationResult(entry);
}

export const TORONTO_FALLBACK_LOCATION = {
  lat: 43.6532,
  lng: -79.3832,
  city: "Toronto",
  region: "ON",
  country: "Canada",
  displayText: "Toronto, ON",
  timezone: "America/Toronto",
};

/** Resolve browser coordinates, then reverse-geocode via ALS. */
export function getBrowserCoordinates({ timeoutMs = 5000 } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }
    const timer = setTimeout(() => reject(new Error("Geolocation timeout")), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 600000 },
    );
  });
}
